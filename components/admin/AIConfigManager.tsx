"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Plus, Edit, Trash2, User, MessageCircle, Brain, Settings, Eye, EyeOff, Upload, Save, X, Activity, Clock, Globe, Palette, Mail, Heart } from 'lucide-react';
import { AICharacter, AIModelConfig, PostCategory } from '@/lib/types';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { AIPostingService } from '@/lib/ai-posting-service';
import { AIChatService } from '@/lib/ai-chat-service';
import AvatarSelector from './AvatarSelector';

export default function AIConfigManager() {
  const { user } = useAuth();
  const [aiCharacters, setAICharacters] = useState<AICharacter[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<AICharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'characters' | 'models'>('characters');

  // 加载AI角色数据
  useEffect(() => {
    const loadAICharacters = async () => {
      try {
        const charactersRef = collection(db, 'ai_characters');
        const snapshot = await getDocs(charactersRef);
        const characters = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate(),
          updated_at: doc.data().updated_at?.toDate(),
          stats: doc.data().stats || { 
            total_posts: 0, 
            posts_today: 0,
            total_chats: 0,
            chats_today: 0
          }
        })) as AICharacter[];
        
        setAICharacters(characters);
      } catch (error) {
        console.error('加载AI角色失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAICharacters();
  }, []);

  const handleCreateCharacter = () => {
    setEditingCharacter(null);
    setShowCreateModal(true);
  };

  const handleEditCharacter = (character: AICharacter) => {
    setEditingCharacter(character);
    setShowCreateModal(true);
  };

  const handleDeleteCharacter = async (characterId: string) => {
    if (!confirm('确定要删除这个AI角色吗？此操作不可撤销。')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'ai_characters', characterId));
      setAICharacters(prev => prev.filter(char => char.id !== characterId));
    } catch (error) {
      console.error('删除AI角色失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleInstantPost = async (character: AICharacter) => {
    if (!confirm(`确定要让 ${character.displayName} 立即发布一篇帖子吗？`)) {
      return;
    }

    try {
      // 创建立即发帖任务
      const taskData = {
        ai_character_id: character.id,
        ai_character_name: character.displayName,
        scheduled_time: new Date(),
        status: 'pending',
        created_at: new Date()
      };

      await addDoc(collection(db, 'ai_posting_tasks'), taskData);
      alert(`已为 ${character.displayName} 创建立即发帖任务，请稍等片刻...`);
      
      // 这里可以调用实际的AI发帖服务
      await triggerAIPost(character);
      
    } catch (error) {
      console.error('创建发帖任务失败:', error);
      alert('发帖失败，请重试');
    }
  };

  const handleInstantNewsPost = async (character: AICharacter) => {
    if (!character.settings.news_posting?.enabled) {
      alert('该AI角色未启用新闻发送功能，请先在配置中启用。');
      return;
    }

    if (!confirm(`确定要让 ${character.displayName} 立即发布今日诺丁汉新闻吗？\n\n新闻内容将包含：\n📰 当天诺丁汉本地新闻\n🎓 大学校园动态\n🌤️ 今日天气信息\n📅 校园活动预告`)) {
      return;
    }

    // 显示加载状态
    const loadingMessage = `正在为 ${character.displayName} 生成今日新闻内容...`;
    console.log(loadingMessage);

    try {
      // 检查今日新闻发送限制
      const canPost = await AIPostingService.checkDailyNewsPostLimit(
        character.id, 
        character.settings.news_posting.max_news_per_day
      );

      if (!canPost) {
        alert(`${character.displayName} 今日已达到新闻发送上限（${character.settings.news_posting.max_news_per_day}条），明日可继续发送。`);
        return;
      }

      // 显示正在生成提示
      const processingAlert = setTimeout(() => {
        console.log('新闻内容生成中，请稍候...');
      }, 1000);

      // 生成新闻内容
      console.log('开始生成新闻帖子内容...');
      const generatedPost = await AIPostingService.generatePostContent(character, undefined, undefined, true);
      
      clearTimeout(processingAlert);
      console.log('新闻内容生成完成:', generatedPost.title);
      
      // 发布帖子
      console.log('开始发布新闻帖子...');
      const postId = await AIPostingService.publishAIPost(character, generatedPost);
      
      // 成功提示
      const successMessage = `🎉 ${character.displayName} 成功发布今日新闻！

📰 标题：${generatedPost.title}

✅ 帖子已发布并显示在首页
🔄 图片正在后台处理中，稍后将自动显示

📊 今日发送统计已更新`;

      alert(successMessage);
      console.log('新闻发布成功！帖子ID:', postId);

      // 可选：刷新页面显示最新数据
      setTimeout(() => {
        if (confirm('是否要刷新页面查看刚发布的新闻帖子？')) {
          window.location.reload();
        }
      }, 2000);
      
    } catch (error) {
      console.error('AI新闻发布失败:', error);
      
      let errorMessage = '新闻发布失败，请稍后重试。';
      
      if (error instanceof Error) {
        if (error.message.includes('新闻发布功能未启用')) {
          errorMessage = '新闻发布功能未启用，请检查AI角色配置。';
        } else if (error.message.includes('暂无可用的新闻信息')) {
          errorMessage = '暂时无法获取新闻信息，请稍后重试。';
        } else if (error.message.includes('API')) {
          errorMessage = 'AI服务暂时不可用，请稍后重试。';
        } else if (error.message.includes('已达到今日发帖上限')) {
          errorMessage = '今日新闻发送已达上限，明日可继续发送。';
        } else {
          errorMessage = `发布失败：${error.message}`;
        }
      }
      
      alert(`❌ ${errorMessage}\n\n📝 错误详情：${error instanceof Error ? error.message : '未知错误'}\n\n💡 建议：\n• 检查网络连接\n• 确认AI服务可用\n• 查看浏览器控制台获取详细信息`);
    }
  };

  // AI发帖触发函数
  const triggerAIPost = async (character: AICharacter) => {
    try {
      // 检查今日发帖限制
      const canPost = await AIPostingService.checkDailyPostLimit(
        character.id, 
        character.settings.auto_posting.max_posts_per_day
      );

      if (!canPost) {
        alert(`${character.displayName} 今日已达到发帖上限`);
        return;
      }

      // 生成内容
      const generatedPost = await AIPostingService.generatePostContent(character);
      
      // 发布帖子
      const postId = await AIPostingService.publishAIPost(character, generatedPost);
      
      alert(`${character.displayName} 成功发布了新帖子！\n标题：${generatedPost.title}`);
      console.log('AI帖子发布成功:', postId);
      
    } catch (error) {
      console.error('AI发帖失败:', error);
      alert(`发帖失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const toggleCharacterStatus = async (character: AICharacter) => {
    try {
      const newStatus = character.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'ai_characters', character.id), {
        status: newStatus,
        updated_at: new Date()
      });
      
      setAICharacters(prev => 
        prev.map(char => 
          char.id === character.id 
            ? { ...char, status: newStatus, updated_at: new Date() }
            : char
        )
      );
    } catch (error) {
      console.error('更新角色状态失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部和标签切换 */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI配置管理</h2>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              支持聊天互动
            </span>
          </div>
          {activeTab === 'characters' && (
            <button
              onClick={handleCreateCharacter}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>创建AI角色</span>
            </button>
          )}
        </div>

        {/* 标签切换 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('characters')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'characters'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI角色管理
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'models'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI模型配置
          </button>
        </div>

        {/* 内容区域 */}
        {activeTab === 'characters' ? (
          <AICharactersList 
            characters={aiCharacters}
            onEdit={handleEditCharacter}
            onDelete={handleDeleteCharacter}
            onToggleStatus={toggleCharacterStatus}
            onInstantPost={handleInstantPost}
            onInstantNewsPost={handleInstantNewsPost}
          />
        ) : (
          <AIModelsConfig />
        )}
      </div>

      {/* 创建/编辑AI角色模态框 */}
      <AnimatePresence>
        {showCreateModal && (
          <AICharacterModal
            character={editingCharacter}
            onClose={() => {
              setShowCreateModal(false);
              setEditingCharacter(null);
            }}
            onSave={(character) => {
              if (editingCharacter) {
                setAICharacters(prev => 
                  prev.map(char => char.id === character.id ? character : char)
                );
              } else {
                setAICharacters(prev => [...prev, character]);
              }
              setShowCreateModal(false);
              setEditingCharacter(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// AI角色列表组件
function AICharactersList({ 
  characters, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onInstantPost, 
  onInstantNewsPost 
}: {
  characters: AICharacter[];
  onEdit: (character: AICharacter) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (character: AICharacter) => void;
  onInstantPost: (character: AICharacter) => void;
  onInstantNewsPost: (character: AICharacter) => void;
}) {
  if (characters.length === 0) {
    return (
      <div className="text-center py-12">
        <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">还没有AI角色</h3>
        <p className="text-gray-600 mb-4">创建你的第一个AI角色来开始智能互动和聊天</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {characters.map((character) => (
        <motion.div
          key={character.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                {character.avatar ? (
                  <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <Bot className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{character.displayName}</h3>
                <p className="text-sm text-gray-600">@{character.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{character.virtual_user?.email || 'ai@nottingham.edu'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onToggleStatus(character)}
                className={`p-1 rounded-full ${
                  character.status === 'active' 
                    ? 'text-green-600 hover:bg-green-100' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={character.status === 'active' ? '点击禁用' : '点击启用'}
              >
                {character.status === 'active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">AI模型</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                character.model === 'gpt4o' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {character.model === 'gpt4o' ? 'GPT-4o' : 'DeepSeek'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">语调风格</span>
              <span className="text-gray-900">{getToneDisplayName(character.personality.tone)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">聊天回复</span>
              <span className={character.settings.auto_chat?.enabled ? 'text-green-600' : 'text-gray-400'}>
                {character.settings.auto_chat?.enabled ? '开启' : '关闭'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">自动发帖</span>
              <span className={character.settings.auto_posting?.enabled ? 'text-blue-600' : 'text-gray-400'}>
                {character.settings.auto_posting?.enabled ? `每${character.settings.auto_posting.interval_hours}小时` : '关闭'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">新闻发送</span>
              <span className={character.settings.news_posting?.enabled ? 'text-green-600' : 'text-gray-400'}>
                {character.settings.news_posting?.enabled ? `每${character.settings.news_posting.interval_hours}小时` : '关闭'}
              </span>
            </div>
          </div>

          {character.stats && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">总发帖</span>
                  <div className="font-semibold text-blue-600">{character.stats.total_posts || 0}</div>
                </div>
                <div>
                  <span className="text-gray-600">今日发帖</span>
                  <div className="font-semibold text-orange-600">{character.stats.posts_today || 0}</div>
                </div>
                <div>
                  <span className="text-gray-600">总聊天</span>
                  <div className="font-semibold text-green-600">{character.stats.total_chats || 0}</div>
                </div>
                <div>
                  <span className="text-gray-600">今日聊天</span>
                  <div className="font-semibold text-purple-600">{character.stats.chats_today || 0}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(character)}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>编辑</span>
            </button>
            {character.settings.auto_posting?.enabled && (
              <button
                onClick={() => onInstantPost(character)}
                className="flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                title="立即发帖"
              >
                <MessageCircle className="w-4 h-4" />
                <span>发帖</span>
              </button>
            )}
            {character.settings.news_posting?.enabled && (
              <button
                onClick={() => onInstantNewsPost(character)}
                className="flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                title="立即发送新闻"
              >
                <Globe className="w-4 h-4" />
                <span>新闻</span>
              </button>
            )}
            <button
              onClick={() => onDelete(character.id)}
              className="flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// AI模型配置组件
function AIModelsConfig() {
  const [models] = useState<AIModelConfig[]>([
    {
      model_id: 'deepseek',
      display_name: 'DeepSeek',
      max_tokens: 4000,
      temperature: 0.7,
      available: true,
      cost_per_token: 0.00001
    },
    {
      model_id: 'gpt4o',
      display_name: 'GPT-4o',
      max_tokens: 8000,
      temperature: 0.7,
      available: true,
      cost_per_token: 0.00003
    }
  ]);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">可用AI模型</h3>
        <p className="text-sm text-gray-600">配置和管理AI模型的连接设置</p>
      </div>
      
      {models.map((model) => (
        <div key={model.model_id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                model.model_id === 'gpt4o' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{model.display_name}</h4>
                <p className="text-sm text-gray-600">AI模型 • {model.model_id}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              model.available 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {model.available ? '可用' : '不可用'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">最大令牌</span>
              <div className="font-semibold text-gray-900">{model.max_tokens.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-600">温度</span>
              <div className="font-semibold text-gray-900">{model.temperature}</div>
            </div>
            <div>
              <span className="text-gray-600">成本/令牌</span>
              <div className="font-semibold text-gray-900">${model.cost_per_token}</div>
            </div>
            <div className="flex items-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                配置API
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// AI角色创建/编辑模态框
function AICharacterModal({ 
  character, 
  onClose, 
  onSave 
}: {
  character: AICharacter | null;
  onClose: () => void;
  onSave: (character: AICharacter) => void;
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<AICharacter>>({
    name: '',
    displayName: '',
    description: '',
    avatar: '',
    model: 'deepseek',
    personality: {
      tone: 'friendly',
      style: 'helpful',
      interests: []
    },
    systemPrompt: '',
    settings: {
      max_response_length: 200,
      temperature: 0.7,
      auto_posting: {
        enabled: false,
        interval_hours: 4,
        categories: ['生活'],
        post_style: 'casual',
        include_images: false,
        max_posts_per_day: 6
      },
      auto_chat: {
        enabled: true,
        response_delay_min: 3,
        response_delay_max: 10,
        active_hours: {
          start: 8,
          end: 22
        },
        auto_initiate: false
      },
      news_posting: {
        enabled: false,
        interval_hours: 8,
        max_news_per_day: 2,
        news_sources: ['university', 'local'],
        post_time_range: {
          start: 8,
          end: 18
        },
        include_weather: true,
        include_events: true
      }
    },
    virtual_user: {
      uid: '',
      email: '',
      profile: {
        major: '计算机科学',
        year: '大二',
        bio: '',
        university: '诺丁汉大学'
      }
    },
    status: 'active'
  });
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState<'basic' | 'personality' | 'chat' | 'posting' | 'news' | 'profile'>('basic');

  useEffect(() => {
    if (character) {
      setFormData(character);
    } else {
      // 为新角色生成默认的虚拟用户信息
      const randomId = Math.random().toString(36).substr(2, 9);
      setFormData(prev => ({
        ...prev,
        virtual_user: {
          ...prev.virtual_user!,
          uid: `ai_${randomId}`,
          email: `ai_${randomId}@nottingham.ai`
        }
      }));
    }
  }, [character]);

  const handleSave = async () => {
    if (!formData.name || !formData.displayName || !formData.virtual_user?.email) {
      alert('请填写必要的信息');
      return;
    }

    setSaving(true);
    try {
      const now = new Date();
      const characterData = {
        ...formData,
        updated_at: now,
        ...(character ? {} : { 
          created_at: now,
          stats: { 
            total_posts: 0, 
            posts_today: 0,
            total_chats: 0,
            chats_today: 0
          }
        })
      };

      if (character) {
        // 更新现有角色
        await updateDoc(doc(db, 'ai_characters', character.id), characterData);
        onSave({ ...character, ...characterData } as AICharacter);
      } else {
        // 创建新角色
        const docRef = await addDoc(collection(db, 'ai_characters'), characterData);
        onSave({ id: docRef.id, ...characterData } as AICharacter);
      }
    } catch (error) {
      console.error('保存AI角色失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const categories: PostCategory[] = ['生活', '美食', '学习', '旅行', '资料', '租房'];
  const tones = [
    { value: 'friendly', label: '友好亲切' },
    { value: 'professional', label: '专业严谨' },
    { value: 'casual', label: '轻松随意' },
    { value: 'formal', label: '正式得体' },
    { value: 'humorous', label: '幽默风趣' }
  ];
  const styles = [
    { value: 'helpful', label: '乐于助人' },
    { value: 'educational', label: '富有教育意义' },
    { value: 'entertaining', label: '有趣生动' },
    { value: 'supportive', label: '支持鼓励' }
  ];

  const tabs = [
    { id: 'basic', label: '基本信息', icon: User },
    { id: 'personality', label: '个性设置', icon: Brain },
    { id: 'chat', label: '聊天配置', icon: MessageCircle },
    { id: 'posting', label: '发帖设置', icon: Edit },
    { id: 'news', label: '新闻发送', icon: Globe },
    { id: 'profile', label: '用户档案', icon: Heart }
  ];

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
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {character ? '编辑AI角色' : '创建AI角色'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* 标签导航 */}
          <div className="flex space-x-1 mt-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 基本信息 */}
          {currentTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    显示名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName || ''}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：小李同学"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：xiaoli_helper"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI模型
                  </label>
                  <select
                    value={formData.model || 'deepseek'}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value as 'deepseek' | 'gpt4o' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="deepseek">DeepSeek (推荐)</option>
                    <option value="gpt4o">GPT-4o</option>
                  </select>
                </div>
              </div>

              {/* 头像选择 - 使用新的AvatarSelector组件 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <AvatarSelector
                  selectedAvatar={formData.avatar || ''}
                  onAvatarChange={(avatarUrl) => setFormData({ ...formData, avatar: avatarUrl })}
                  characterName={formData.displayName || formData.name || 'AI角色'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  系统提示词 *
                </label>
                <textarea
                  value={formData.systemPrompt || ''}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="定义AI角色的基本身份和行为..."
                  required
                />
              </div>
            </div>
          )}

          {/* 个性设置 */}
          {currentTab === 'personality' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">个性设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      语调风格
                    </label>
                    <select
                      value={formData.personality?.tone || 'friendly'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        personality: { ...prev.personality!, tone: e.target.value as any }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {tones.map(tone => (
                        <option key={tone.value} value={tone.value}>{tone.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      回复风格
                    </label>
                    <select
                      value={formData.personality?.style || 'helpful'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        personality: { ...prev.personality!, style: e.target.value as any }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {styles.map(style => (
                        <option key={style.value} value={style.value}>{style.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    兴趣爱好 (用逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={formData.personality?.interests?.join(', ') || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      personality: { 
                        ...prev.personality!, 
                        interests: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      }
                    }))}
                    placeholder="例如: 编程, 音乐, 旅行, 美食"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大回复长度
                    </label>
                    <input
                      type="number"
                      value={formData.settings?.max_response_length || 200}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings!, max_response_length: parseInt(e.target.value) }
                      }))}
                      min="50"
                      max="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI温度 ({formData.settings?.temperature || 0.7})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.settings?.temperature || 0.7}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings!, temperature: parseFloat(e.target.value) }
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>保守</span>
                      <span>创造性</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 聊天配置 */}
          {currentTab === 'chat' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">聊天配置</h3>
                <div className="flex items-center space-x-3 mb-6">
                  <input
                    type="checkbox"
                    id="auto_chat"
                    checked={formData.settings?.auto_chat?.enabled || false}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      settings: { 
                        ...prev.settings!, 
                        auto_chat: { 
                          ...prev.settings!.auto_chat!, 
                          enabled: e.target.checked 
                        }
                      }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="auto_chat" className="text-sm font-medium text-gray-700">
                    启用AI聊天回复功能
                  </label>
                </div>

                {formData.settings?.auto_chat?.enabled && (
                  <div className="space-y-4 border-l-4 border-blue-200 pl-4 ml-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最小回复延迟 (秒)
                        </label>
                        <input
                          type="number"
                          value={formData.settings?.auto_chat?.response_delay_min || 3}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              auto_chat: { 
                                ...prev.settings!.auto_chat!, 
                                response_delay_min: parseInt(e.target.value) 
                              }
                            }
                          }))}
                          min="1"
                          max="60"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最大回复延迟 (秒)
                        </label>
                        <input
                          type="number"
                          value={formData.settings?.auto_chat?.response_delay_max || 10}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              auto_chat: { 
                                ...prev.settings!.auto_chat!, 
                                response_delay_max: parseInt(e.target.value) 
                              }
                            }
                          }))}
                          min="1"
                          max="300"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          活跃开始时间
                        </label>
                        <select
                          value={formData.settings?.auto_chat?.active_hours?.start || 8}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              auto_chat: { 
                                ...prev.settings!.auto_chat!, 
                                active_hours: {
                                  ...prev.settings!.auto_chat!.active_hours,
                                  start: parseInt(e.target.value)
                                }
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>00:00</option>
                          <option value={1}>01:00</option>
                          <option value={2}>02:00</option>
                          <option value={3}>03:00</option>
                          <option value={4}>04:00</option>
                          <option value={5}>05:00</option>
                          <option value={6}>06:00</option>
                          <option value={7}>07:00</option>
                          <option value={8}>08:00</option>
                          <option value={9}>09:00</option>
                          <option value={10}>10:00</option>
                          <option value={11}>11:00</option>
                          <option value={12}>12:00</option>
                          <option value={13}>13:00</option>
                          <option value={14}>14:00</option>
                          <option value={15}>15:00</option>
                          <option value={16}>16:00</option>
                          <option value={17}>17:00</option>
                          <option value={18}>18:00</option>
                          <option value={19}>19:00</option>
                          <option value={20}>20:00</option>
                          <option value={21}>21:00</option>
                          <option value={22}>22:00</option>
                          <option value={23}>23:00</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          活跃结束时间
                        </label>
                        <select
                          value={formData.settings?.auto_chat?.active_hours?.end || 22}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              auto_chat: { 
                                ...prev.settings!.auto_chat!, 
                                active_hours: {
                                  ...prev.settings!.auto_chat!.active_hours,
                                  end: parseInt(e.target.value)
                                }
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>00:00</option>
                          <option value={1}>01:00</option>
                          <option value={2}>02:00</option>
                          <option value={3}>03:00</option>
                          <option value={4}>04:00</option>
                          <option value={5}>05:00</option>
                          <option value={6}>06:00</option>
                          <option value={7}>07:00</option>
                          <option value={8}>08:00</option>
                          <option value={9}>09:00</option>
                          <option value={10}>10:00</option>
                          <option value={11}>11:00</option>
                          <option value={12}>12:00</option>
                          <option value={13}>13:00</option>
                          <option value={14}>14:00</option>
                          <option value={15}>15:00</option>
                          <option value={16}>16:00</option>
                          <option value={17}>17:00</option>
                          <option value={18}>18:00</option>
                          <option value={19}>19:00</option>
                          <option value={20}>20:00</option>
                          <option value={21}>21:00</option>
                          <option value={22}>22:00</option>
                          <option value={23}>23:00</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="auto_initiate"
                        checked={formData.settings?.auto_chat?.auto_initiate || false}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          settings: { 
                            ...prev.settings!, 
                            auto_chat: { 
                              ...prev.settings!.auto_chat!, 
                              auto_initiate: e.target.checked 
                            }
                          }
                        }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <label htmlFor="auto_initiate" className="text-sm font-medium text-gray-700">
                        允许主动发起对话 (实验性功能)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 发帖设置 */}
          {currentTab === 'posting' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">自动发帖设置</h3>
                <div className="flex items-center space-x-3 mb-6">
                  <input
                    type="checkbox"
                    id="auto_posting"
                    checked={formData.settings?.auto_posting?.enabled || false}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      settings: { 
                        ...prev.settings!, 
                        auto_posting: { 
                          ...prev.settings!.auto_posting!, 
                          enabled: e.target.checked 
                        }
                      }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="auto_posting" className="text-sm font-medium text-gray-700">
                    启用自动发帖功能
                  </label>
                </div>

                {formData.settings?.auto_posting?.enabled && (
                  <div className="space-y-4 border-l-4 border-green-200 pl-4 ml-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          发帖间隔（小时）
                        </label>
                        <select
                          value={formData.settings?.auto_posting?.interval_hours || 4}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              auto_posting: { 
                                ...prev.settings!.auto_posting!, 
                                interval_hours: parseInt(e.target.value) 
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="1">每1小时</option>
                          <option value="2">每2小时</option>
                          <option value="4">每4小时</option>
                          <option value="6">每6小时</option>
                          <option value="8">每8小时</option>
                          <option value="12">每12小时</option>
                          <option value="24">每24小时</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          每天最大发帖数
                        </label>
                        <input
                          type="number"
                          value={formData.settings?.auto_posting?.max_posts_per_day || 6}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              auto_posting: { 
                                ...prev.settings!.auto_posting!, 
                                max_posts_per_day: parseInt(e.target.value) 
                              }
                            }
                          }))}
                          min="1"
                          max="20"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          发帖风格
                        </label>
                        <select
                          value={formData.settings?.auto_posting?.post_style || 'casual'}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              auto_posting: { 
                                ...prev.settings!.auto_posting!, 
                                post_style: e.target.value as any 
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="educational">教育性</option>
                          <option value="casual">轻松随意</option>
                          <option value="informative">信息性</option>
                          <option value="entertaining">娱乐性</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="include_images"
                          checked={formData.settings?.auto_posting?.include_images || false}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              auto_posting: { 
                                ...prev.settings!.auto_posting!, 
                                include_images: e.target.checked 
                              }
                            }
                          }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <label htmlFor="include_images" className="text-sm font-medium text-gray-700">
                          包含图片（实验性功能）
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        发帖分类
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {categories.map(category => (
                          <label key={category} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.settings?.auto_posting?.categories?.includes(category) || false}
                              onChange={(e) => {
                                const currentCategories = formData.settings?.auto_posting?.categories || [];
                                const newCategories = e.target.checked
                                  ? [...currentCategories, category]
                                  : currentCategories.filter(c => c !== category);
                                
                                setFormData(prev => ({ 
                                  ...prev, 
                                  settings: { 
                                    ...prev.settings!, 
                                    auto_posting: { 
                                      ...prev.settings!.auto_posting!, 
                                      categories: newCategories 
                                    }
                                  }
                                }));
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 新闻发送 */}
          {currentTab === 'news' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">新闻发送设置</h3>
                <div className="flex items-center space-x-3 mb-6">
                  <input
                    type="checkbox"
                    id="news_posting"
                    checked={formData.settings?.news_posting?.enabled || false}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      settings: { 
                        ...prev.settings!, 
                        news_posting: { 
                          ...prev.settings!.news_posting!, 
                          enabled: e.target.checked 
                        }
                      }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="news_posting" className="text-sm font-medium text-gray-700">
                    启用新闻发送功能
                  </label>
                </div>

                {formData.settings?.news_posting?.enabled && (
                  <div className="space-y-4 border-l-4 border-green-200 pl-4 ml-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          新闻发送间隔（小时）
                        </label>
                        <select
                          value={formData.settings?.news_posting?.interval_hours || 8}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              news_posting: { 
                                ...prev.settings!.news_posting!, 
                                interval_hours: parseInt(e.target.value) 
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="1">每1小时</option>
                          <option value="2">每2小时</option>
                          <option value="4">每4小时</option>
                          <option value="6">每6小时</option>
                          <option value="8">每8小时</option>
                          <option value="12">每12小时</option>
                          <option value="24">每24小时</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          每天最大新闻发送数
                        </label>
                        <input
                          type="number"
                          value={formData.settings?.news_posting?.max_news_per_day || 2}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              news_posting: { 
                                ...prev.settings!.news_posting!, 
                                max_news_per_day: parseInt(e.target.value) 
                              }
                            }
                          }))}
                          min="1"
                          max="10"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          发送时间开始
                        </label>
                        <select
                          value={formData.settings?.news_posting?.post_time_range?.start || 8}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              news_posting: { 
                                ...prev.settings!.news_posting!, 
                                post_time_range: {
                                  ...prev.settings!.news_posting!.post_time_range,
                                  start: parseInt(e.target.value)
                                }
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>00:00</option>
                          <option value={1}>01:00</option>
                          <option value={2}>02:00</option>
                          <option value={3}>03:00</option>
                          <option value={4}>04:00</option>
                          <option value={5}>05:00</option>
                          <option value={6}>06:00</option>
                          <option value={7}>07:00</option>
                          <option value={8}>08:00</option>
                          <option value={9}>09:00</option>
                          <option value={10}>10:00</option>
                          <option value={11}>11:00</option>
                          <option value={12}>12:00</option>
                          <option value={13}>13:00</option>
                          <option value={14}>14:00</option>
                          <option value={15}>15:00</option>
                          <option value={16}>16:00</option>
                          <option value={17}>17:00</option>
                          <option value={18}>18:00</option>
                          <option value={19}>19:00</option>
                          <option value={20}>20:00</option>
                          <option value={21}>21:00</option>
                          <option value={22}>22:00</option>
                          <option value={23}>23:00</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          发送时间结束
                        </label>
                        <select
                          value={formData.settings?.news_posting?.post_time_range?.end || 18}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              news_posting: { 
                                ...prev.settings!.news_posting!, 
                                post_time_range: {
                                  ...prev.settings!.news_posting!.post_time_range,
                                  end: parseInt(e.target.value)
                                }
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>00:00</option>
                          <option value={1}>01:00</option>
                          <option value={2}>02:00</option>
                          <option value={3}>03:00</option>
                          <option value={4}>04:00</option>
                          <option value={5}>05:00</option>
                          <option value={6}>06:00</option>
                          <option value={7}>07:00</option>
                          <option value={8}>08:00</option>
                          <option value={9}>09:00</option>
                          <option value={10}>10:00</option>
                          <option value={11}>11:00</option>
                          <option value={12}>12:00</option>
                          <option value={13}>13:00</option>
                          <option value={14}>14:00</option>
                          <option value={15}>15:00</option>
                          <option value={16}>16:00</option>
                          <option value={17}>17:00</option>
                          <option value={18}>18:00</option>
                          <option value={19}>19:00</option>
                          <option value={20}>20:00</option>
                          <option value={21}>21:00</option>
                          <option value={22}>22:00</option>
                          <option value={23}>23:00</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        新闻来源
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'university', label: '大学新闻' },
                          { value: 'local', label: '本地新闻' },
                          { value: 'weather', label: '天气信息' },
                          { value: 'events', label: '校园活动' }
                        ].map(source => (
                          <label key={source.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.settings?.news_posting?.news_sources?.includes(source.value as any) || false}
                              onChange={(e) => {
                                const currentSources = formData.settings?.news_posting?.news_sources || [];
                                const newSources = e.target.checked
                                  ? [...currentSources, source.value]
                                  : currentSources.filter(s => s !== source.value);
                                
                                setFormData(prev => ({ 
                                  ...prev, 
                                  settings: { 
                                    ...prev.settings!, 
                                    news_posting: { 
                                      ...prev.settings!.news_posting!, 
                                      news_sources: newSources as any
                                    }
                                  }
                                }));
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{source.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="include_weather"
                          checked={formData.settings?.news_posting?.include_weather || false}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              news_posting: { 
                                ...prev.settings!.news_posting!, 
                                include_weather: e.target.checked 
                              }
                            }
                          }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <label htmlFor="include_weather" className="text-sm font-medium text-gray-700">
                          包含天气信息
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="include_events"
                          checked={formData.settings?.news_posting?.include_events || false}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            settings: { 
                              ...prev.settings!, 
                              news_posting: { 
                                ...prev.settings!.news_posting!, 
                                include_events: e.target.checked 
                              }
                            }
                          }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <label htmlFor="include_events" className="text-sm font-medium text-gray-700">
                          包含校园活动
                        </label>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 新闻发送说明</h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• AI将自动获取诺丁汉本地新闻、大学新闻和校园活动信息</li>
                        <li>• 天气信息每日更新，帮助学生合理安排出行</li>
                        <li>• 校园活动信息包含今日和近期的重要活动</li>
                        <li>• 发送时间限制在工作时间内，避免打扰学生休息</li>
                        <li>• 每日发送数量限制确保内容质量而非数量</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 用户档案 */}
          {currentTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">虚拟用户档案</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      虚拟邮箱 *
                    </label>
                    <input
                      type="email"
                      value={formData.virtual_user?.email || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        virtual_user: { 
                          ...prev.virtual_user!, 
                          email: e.target.value 
                        }
                      }))}
                      placeholder="ai_character@nottingham.ai"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      用户ID
                    </label>
                    <input
                      type="text"
                      value={formData.virtual_user?.uid || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        virtual_user: { 
                          ...prev.virtual_user!, 
                          uid: e.target.value 
                        }
                      }))}
                      placeholder="ai_character_001"
                      disabled={!!character}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      专业
                    </label>
                    <input
                      type="text"
                      value={formData.virtual_user?.profile?.major || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        virtual_user: { 
                          ...prev.virtual_user!, 
                          profile: {
                            ...prev.virtual_user!.profile,
                            major: e.target.value
                          }
                        }
                      }))}
                      placeholder="计算机科学"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      年级
                    </label>
                    <select
                      value={formData.virtual_user?.profile?.year || '大二'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        virtual_user: { 
                          ...prev.virtual_user!, 
                          profile: {
                            ...prev.virtual_user!.profile,
                            year: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="大一">大一</option>
                      <option value="大二">大二</option>
                      <option value="大三">大三</option>
                      <option value="大四">大四</option>
                      <option value="研究生">研究生</option>
                      <option value="博士生">博士生</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      大学
                    </label>
                    <input
                      type="text"
                      value={formData.virtual_user?.profile?.university || '诺丁汉大学'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        virtual_user: { 
                          ...prev.virtual_user!, 
                          profile: {
                            ...prev.virtual_user!.profile,
                            university: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    个人简介
                  </label>
                  <textarea
                    value={formData.virtual_user?.profile?.bio || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      virtual_user: { 
                        ...prev.virtual_user!, 
                        profile: {
                          ...prev.virtual_user!.profile,
                          bio: e.target.value
                        }
                      }
                    }))}
                    placeholder="介绍一下这个AI角色的背景和特点..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 辅助函数
function getToneDisplayName(tone: string): string {
  const toneMap: Record<string, string> = {
    friendly: '友好',
    professional: '专业',
    casual: '随意',
    formal: '正式',
    humorous: '幽默'
  };
  return toneMap[tone] || tone;
} 