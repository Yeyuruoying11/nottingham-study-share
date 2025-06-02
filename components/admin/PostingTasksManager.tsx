"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Clock, CheckCircle, AlertCircle, Trash2, RefreshCw, Plus, Calendar, User, Tag, Eye } from 'lucide-react';
import { AIPostingTask, AICharacter, PostCategory } from '@/lib/types';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { AIPostingService, AIPostingScheduler } from '@/lib/ai-posting-service';

export default function PostingTasksManager() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AIPostingTask[]>([]);
  const [aiCharacters, setAICharacters] = useState<AICharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');

  // 加载发帖任务
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const q = query(
          collection(db, 'ai_posting_tasks'),
          orderBy('created_at', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          scheduled_time: doc.data().scheduled_time?.toDate(),
          created_at: doc.data().created_at?.toDate(),
          completed_at: doc.data().completed_at?.toDate()
        })) as AIPostingTask[];
        
        setTasks(tasksData);
      } catch (error) {
        console.error('加载发帖任务失败:', error);
      }
    };

    const loadCharacters = async () => {
      try {
        const q = query(
          collection(db, 'ai_characters'),
          where('status', '==', 'active')
        );
        
        const snapshot = await getDocs(q);
        const charactersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate(),
          updated_at: doc.data().updated_at?.toDate()
        })) as AICharacter[];
        
        setAICharacters(charactersData);
      } catch (error) {
        console.error('加载AI角色失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
    loadCharacters();
  }, []);

  // 处理立即发帖
  const handleInstantPost = async (characterId: string, category?: PostCategory, topic?: string) => {
    try {
      const character = aiCharacters.find(c => c.id === characterId);
      if (!character) {
        alert('找不到指定的AI角色');
        return;
      }

      // 检查发帖限制
      const canPost = await AIPostingService.checkDailyPostLimit(
        character.id, 
        character.settings.auto_posting.max_posts_per_day
      );

      if (!canPost) {
        alert(`${character.displayName} 今日已达到发帖上限`);
        return;
      }

      // 创建任务
      const taskData = {
        ai_character_id: character.id,
        ai_character_name: character.displayName,
        scheduled_time: new Date(),
        category: category,
        topic: topic,
        status: 'pending' as const,
        created_at: new Date()
      };

      const docRef = await addDoc(collection(db, 'ai_posting_tasks'), taskData);
      
      // 立即执行发帖
      const generatedPost = await AIPostingService.generatePostContent(character, category, topic);
      const postId = await AIPostingService.publishAIPost(character, generatedPost);
      
      // 更新任务状态
      await updateDoc(doc(db, 'ai_posting_tasks', docRef.id), {
        status: 'completed',
        completed_at: new Date(),
        post_id: postId
      });

      alert(`${character.displayName} 成功发布了新帖子！\n标题：${generatedPost.title}`);
      
      // 重新加载任务列表
      window.location.reload();
      
    } catch (error) {
      console.error('立即发帖失败:', error);
      alert(`发帖失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 处理定时发帖
  const handleSchedulePost = async (characterId: string, scheduledTime: Date, category?: PostCategory, topic?: string) => {
    try {
      const character = aiCharacters.find(c => c.id === characterId);
      if (!character) {
        alert('找不到指定的AI角色');
        return;
      }

      const taskData = {
        ai_character_id: character.id,
        ai_character_name: character.displayName,
        scheduled_time: scheduledTime,
        category: category,
        topic: topic,
        status: 'pending' as const,
        created_at: new Date()
      };

      await addDoc(collection(db, 'ai_posting_tasks'), taskData);
      alert(`已为 ${character.displayName} 安排定时发帖任务`);
      
      // 重新加载任务列表
      window.location.reload();
      
    } catch (error) {
      console.error('创建定时任务失败:', error);
      alert('创建任务失败，请重试');
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'ai_posting_tasks', taskId));
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 处理调度器
  const handleRunScheduler = async () => {
    try {
      await AIPostingScheduler.processScheduledTasks();
      alert('发帖调度器执行完成');
      window.location.reload();
    } catch (error) {
      console.error('调度器执行失败:', error);
      alert('调度器执行失败');
    }
  };

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    if (filter !== 'all' && task.status !== filter) return false;
    if (selectedCharacter && task.ai_character_id !== selectedCharacter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI发帖任务管理</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunScheduler}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>执行调度器</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>创建任务</span>
            </button>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">状态:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">全部</option>
              <option value="pending">待执行</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">AI角色:</span>
            <select
              value={selectedCharacter}
              onChange={(e) => setSelectedCharacter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">全部角色</option>
              {aiCharacters.map(character => (
                <option key={character.id} value={character.id}>
                  {character.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'pending').length}</div>
            <div className="text-sm text-gray-600">待执行</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'completed').length}</div>
            <div className="text-sm text-gray-600">已完成</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{tasks.filter(t => t.status === 'failed').length}</div>
            <div className="text-sm text-gray-600">失败</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{tasks.length}</div>
            <div className="text-sm text-gray-600">总任务</div>
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">任务列表</h3>
          
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无任务</h3>
              <p className="text-gray-600">创建你的第一个发帖任务</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 创建任务模态框 */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTaskModal
            aiCharacters={aiCharacters}
            onClose={() => setShowCreateModal(false)}
            onInstantPost={handleInstantPost}
            onSchedulePost={handleSchedulePost}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 任务卡片组件
function TaskCard({ task, onDelete }: { task: AIPostingTask; onDelete: (id: string) => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待执行';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(task.status)}`}>
              {getStatusIcon(task.status)}
              <span>{getStatusText(task.status)}</span>
            </span>
            <span className="text-sm font-medium text-gray-900">{task.ai_character_name}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>计划时间: {task.scheduled_time.toLocaleString()}</span>
            </div>
            {task.category && (
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>分类: {task.category}</span>
              </div>
            )}
            {task.post_id && (
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <a 
                  href={`/post/${task.post_id}`}
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800"
                >
                  查看帖子
                </a>
              </div>
            )}
          </div>
          
          {task.topic && (
            <div className="mt-2 text-sm text-gray-700">
              <span className="font-medium">主题:</span> {task.topic}
            </div>
          )}
          
          {task.error_message && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <span className="font-medium">错误:</span> {task.error_message}
            </div>
          )}
        </div>
        
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          title="删除任务"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// 创建任务模态框
function CreateTaskModal({ 
  aiCharacters, 
  onClose, 
  onInstantPost, 
  onSchedulePost 
}: {
  aiCharacters: AICharacter[];
  onClose: () => void;
  onInstantPost: (characterId: string, category?: PostCategory, topic?: string) => void;
  onSchedulePost: (characterId: string, scheduledTime: Date, category?: PostCategory, topic?: string) => void;
}) {
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [category, setCategory] = useState<PostCategory | ''>('');
  const [topic, setTopic] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const categories: PostCategory[] = ['生活', '美食', '学习', '旅行', '资料', '租房'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCharacter) {
      alert('请选择AI角色');
      return;
    }

    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        alert('请设置发帖时间');
        return;
      }
      
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        alert('发帖时间必须晚于当前时间');
        return;
      }
      
      onSchedulePost(
        selectedCharacter, 
        scheduledDateTime,
        category || undefined,
        topic || undefined
      );
    } else {
      onInstantPost(
        selectedCharacter,
        category || undefined,
        topic || undefined
      );
    }
    
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">创建发帖任务</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI角色 *
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">选择AI角色</option>
                {aiCharacters.filter(c => c.settings.auto_posting?.enabled).map(character => (
                  <option key={character.id} value={character.id}>
                    {character.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类（可选）
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PostCategory | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">随机分类</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                主题（可选）
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="指定发帖主题"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isScheduled"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="w-4 h-4 text-green-600"
              />
              <label htmlFor="isScheduled" className="text-sm font-medium text-gray-700">
                定时发帖
              </label>
            </div>

            {isScheduled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    日期
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required={isScheduled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    时间
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required={isScheduled}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {isScheduled ? '创建定时任务' : '立即发帖'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
} 