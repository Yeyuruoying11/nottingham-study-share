"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Users, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { schools, departments, getDepartmentsBySchool, getCoursesByDepartment } from '@/lib/academic-data';
import { School, Department, Course } from '@/lib/types';

export default function AcademicPage() {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const schoolColors = {
    'arts': 'bg-purple-100 text-purple-800 border-purple-200',
    'engineering': 'bg-orange-100 text-orange-800 border-orange-200',
    'medicine': 'bg-red-100 text-red-800 border-red-200',
    'science': 'bg-blue-100 text-blue-800 border-blue-200',
    'social-sciences': 'bg-green-100 text-green-800 border-green-200',
    'business': 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  const getSchoolIcon = (schoolId: string) => {
    switch (schoolId) {
      case 'arts': return '🎨';
      case 'engineering': return '⚙️';
      case 'medicine': return '🏥';
      case 'science': return '🔬';
      case 'social-sciences': return '👥';
      case 'business': return '💼';
      default: return '📚';
    }
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setSelectedDepartment(null);
  };

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
  };

  const handleBackToSchools = () => {
    setSelectedSchool(null);
    setSelectedDepartment(null);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {selectedSchool ? (
                <button
                  onClick={selectedDepartment ? handleBackToDepartments : handleBackToSchools}
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
                {selectedDepartment ? selectedDepartment.name : 
                 selectedSchool ? selectedSchool.name : 
                 '学院专业'}
              </h1>
            </div>

            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedSchool ? (
          // 学院列表视图
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">诺丁汉大学学院</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                选择你的学院，探索相关专业和课程的学习资源与讨论
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school, index) => (
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
              <p className="text-gray-600 max-w-3xl">
                {selectedSchool.description}
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