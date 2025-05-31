"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Users, BookOpen, ChevronRight, ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import { 
  universities, 
  schools, 
  departments, 
  getSchoolsByUniversity,
  getDepartmentsBySchool, 
  getCoursesByDepartment 
} from '@/lib/academic-data';
import { University, School, Department, Course } from '@/lib/types';

export default function AcademicPage() {
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // 调试信息
  console.log('=== 学术数据调试 ===');
  console.log('大学数量:', universities.length);
  console.log('学院数量:', schools.length);
  console.log('专业数量:', departments.length);
  
  if (selectedUniversity) {
    const universitySchools = getSchoolsByUniversity(selectedUniversity.id);
    console.log(`${selectedUniversity.name} 的学院数量:`, universitySchools.length);
    
    if (selectedSchool) {
      const schoolDepts = getDepartmentsBySchool(selectedSchool.id);
      console.log(`${selectedSchool.name} 的专业数量:`, schoolDepts.length);
      
      if (selectedDepartment) {
        const deptCourses = getCoursesByDepartment(selectedDepartment.id);
        console.log(`${selectedDepartment.name} 的课程数量:`, deptCourses.length);
      }
    }
  }

  const schoolColors = {
    // 诺丁汉大学学院颜色
    'uon-arts': 'bg-purple-100 text-purple-800 border-purple-200',
    'uon-engineering': 'bg-orange-100 text-orange-800 border-orange-200',
    'uon-medicine': 'bg-red-100 text-red-800 border-red-200',
    'uon-science': 'bg-blue-100 text-blue-800 border-blue-200',
    'uon-social-sciences': 'bg-green-100 text-green-800 border-green-200',
    'uon-business': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    
    // 诺丁汉特伦特大学学院颜色
    'ntu-art-design': 'bg-pink-100 text-pink-800 border-pink-200',
    'ntu-business': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'ntu-science-technology': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'ntu-social-sciences': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'ntu-education': 'bg-amber-100 text-amber-800 border-amber-200',
    'ntu-law': 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const getSchoolIcon = (schoolId: string) => {
    if (schoolId.includes('arts') || schoolId.includes('art-design')) return '🎨';
    if (schoolId.includes('engineering')) return '⚙️';
    if (schoolId.includes('medicine')) return '🏥';
    if (schoolId.includes('science')) return '🔬';
    if (schoolId.includes('social-sciences')) return '👥';
    if (schoolId.includes('business')) return '💼';
    if (schoolId.includes('education')) return '📚';
    if (schoolId.includes('law')) return '⚖️';
    return '📚';
  };

  const handleUniversitySelect = (university: University) => {
    setSelectedUniversity(university);
    setSelectedSchool(null);
    setSelectedDepartment(null);
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setSelectedDepartment(null);
  };

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
  };

  const handleBackToUniversities = () => {
    setSelectedUniversity(null);
    setSelectedSchool(null);
    setSelectedDepartment(null);
  };

  const handleBackToSchools = () => {
    setSelectedSchool(null);
    setSelectedDepartment(null);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
  };

  const getBreadcrumbText = () => {
    if (selectedDepartment) return selectedDepartment.name;
    if (selectedSchool) return selectedSchool.name;
    if (selectedUniversity) return selectedUniversity.name;
    return '学习';
  };

  const getBackAction = () => {
    if (selectedDepartment) return handleBackToDepartments;
    if (selectedSchool) return handleBackToSchools;
    if (selectedUniversity) return handleBackToUniversities;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {getBackAction() ? (
                <button
                  onClick={getBackAction()!}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">返回</span>
                </button>
              ) : (
                <Link 
                  href="/"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">返回首页</span>
                </Link>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">
                {getBreadcrumbText()}
              </h1>
            </div>

            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 调试面板 */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">🐛 调试信息</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>大学数量: {universities.length}</div>
            <div>学院数量: {schools.length}</div>
            <div>专业数量: {departments.length}</div>
            {selectedUniversity && (
              <div>当前大学学院数: {getSchoolsByUniversity(selectedUniversity.id).length}</div>
            )}
            {selectedSchool && (
              <div>当前学院专业数: {getDepartmentsBySchool(selectedSchool.id).length}</div>
            )}
            {selectedDepartment && (
              <div>当前专业课程数: {getCoursesByDepartment(selectedDepartment.id).length}</div>
            )}
          </div>
        </div>

        {!selectedUniversity ? (
          // 大学选择视图
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">选择院校</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                选择你的院校，探索相关学院、专业和课程的学习资源与讨论
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {universities.map((university, index) => (
                <motion.div
                  key={university.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleUniversitySelect(university)}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-6xl">{university.logo}</div>
                      <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {getSchoolsByUniversity(university.id).length} 个学院
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      {university.name}
                    </h3>
                    <p className="text-gray-500 mb-4 font-medium">{university.nameEn}</p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {university.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{getSchoolsByUniversity(university.id).length} 学院</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>英国诺丁汉</span>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : !selectedSchool ? (
          // 学院列表视图
          <div>
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-5xl">{selectedUniversity.logo}</div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedUniversity.name}</h2>
                  <p className="text-lg text-gray-600">{selectedUniversity.nameEn}</p>
                </div>
              </div>
              <p className="text-gray-600 max-w-3xl mb-4">
                {selectedUniversity.description}
              </p>
              <p className="text-sm text-gray-500">
                选择学院以查看相关专业和课程
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getSchoolsByUniversity(selectedUniversity.id).map((school, index) => (
                <motion.div
                  key={school.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleSchoolSelect(school)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl">{getSchoolIcon(school.id)}</div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${schoolColors[school.id as keyof typeof schoolColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                        {getDepartmentsBySchool(school.id).length} 个专业
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      {school.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{school.nameEn}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {school.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{getDepartmentsBySchool(school.id).length} 专业</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : !selectedDepartment ? (
          // 专业列表视图
          <div>
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-4xl">{getSchoolIcon(selectedSchool.id)}</div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedSchool.name}</h2>
                  <p className="text-lg text-gray-600">{selectedSchool.nameEn}</p>
                </div>
              </div>
              <p className="text-gray-600 max-w-3xl mb-4">
                {selectedSchool.description}
              </p>
              <p className="text-sm text-gray-500">
                选择专业以查看相关课程
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getDepartmentsBySchool(selectedSchool.id).map((department, index) => (
                <motion.div
                  key={department.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleDepartmentSelect(department)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl">📚</div>
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {getCoursesByDepartment(department.id).length} 门课程
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      {department.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{department.nameEn}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {department.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <BookOpen className="w-4 h-4" />
                        <span>{getCoursesByDepartment(department.id).length} 门课程</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          // 课程列表视图
          <div>
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-3xl">📚</div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedDepartment.name}</h2>
                  <p className="text-lg text-gray-600">{selectedDepartment.nameEn}</p>
                </div>
              </div>
              <p className="text-gray-600 max-w-3xl mb-6">
                {selectedDepartment.description}
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  💡 点击课程可以查看该课程的相关帖子和讨论
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getCoursesByDepartment(selectedDepartment.id).map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                >
                  <Link href={`/academic/course/${course.id}`}>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          course.level === 'undergraduate' ? 'bg-green-100 text-green-700' :
                          course.level === 'postgraduate' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {course.level === 'undergraduate' ? '本科' : 
                           course.level === 'postgraduate' ? '研究生' : '博士'}
                        </div>
                        {course.year && (
                          <div className="text-sm font-medium text-gray-500">
                            Year {course.year}
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                          {course.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">{course.nameEn}</p>
                        <p className="text-sm font-mono text-blue-600">{course.code}</p>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {course.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {course.credits} 学分
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 