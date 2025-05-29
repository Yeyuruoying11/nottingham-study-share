import { School, Department, Course } from './types';

// 诺丁汉大学学院数据
export const schools: School[] = [
  {
    id: 'arts',
    name: '人文学院',
    nameEn: 'Faculty of Arts',
    description: '包含语言、文学、历史、哲学等人文学科'
  },
  {
    id: 'engineering',
    name: '工程学院',
    nameEn: 'Faculty of Engineering',
    description: '涵盖各类工程学科，注重实践与创新'
  },
  {
    id: 'medicine',
    name: '医学院',
    nameEn: 'Faculty of Medicine & Health Sciences',
    description: '医学、护理、兽医学等健康科学专业'
  },
  {
    id: 'science',
    name: '理学院',
    nameEn: 'Faculty of Science',
    description: '数学、物理、化学、生物等基础科学'
  },
  {
    id: 'social-sciences',
    name: '社会科学院',
    nameEn: 'Faculty of Social Sciences',
    description: '心理学、教育学、政治学、经济学等'
  },
  {
    id: 'business',
    name: '商学院',
    nameEn: 'Nottingham University Business School',
    description: '商业管理、金融、会计、市场营销等商科专业'
  }
];

// 专业数据
export const departments: Department[] = [
  // 计算机科学类
  {
    id: 'computer-science',
    name: '计算机科学',
    nameEn: 'Computer Science',
    school: 'science',
    description: '软件开发、算法、人工智能、数据科学等'
  },
  {
    id: 'software-engineering',
    name: '软件工程',
    nameEn: 'Software Engineering',
    school: 'science',
    description: '软件开发生命周期、项目管理、系统设计'
  },
  
  // 商科类
  {
    id: 'business-management',
    name: '商业管理',
    nameEn: 'Business Management',
    school: 'business',
    description: '企业管理、战略规划、领导力发展'
  },
  {
    id: 'finance',
    name: '金融学',
    nameEn: 'Finance',
    school: 'business',
    description: '投资分析、风险管理、金融市场'
  },
  {
    id: 'accounting',
    name: '会计学',
    nameEn: 'Accounting',
    school: 'business',
    description: '财务会计、管理会计、审计'
  },
  {
    id: 'marketing',
    name: '市场营销',
    nameEn: 'Marketing',
    school: 'business',
    description: '品牌管理、数字营销、消费者行为'
  },
  
  // 工程类
  {
    id: 'mechanical-engineering',
    name: '机械工程',
    nameEn: 'Mechanical Engineering',
    school: 'engineering',
    description: '机械设计、制造工程、热力学'
  },
  {
    id: 'electrical-engineering',
    name: '电气工程',
    nameEn: 'Electrical Engineering',
    school: 'engineering',
    description: '电路设计、信号处理、电力系统'
  },
  {
    id: 'civil-engineering',
    name: '土木工程',
    nameEn: 'Civil Engineering',
    school: 'engineering',
    description: '结构设计、建筑工程、基础设施'
  },
  
  // 文科类
  {
    id: 'english',
    name: '英语语言文学',
    nameEn: 'English Language and Literature',
    school: 'arts',
    description: '文学分析、语言学、创意写作'
  },
  {
    id: 'history',
    name: '历史学',
    nameEn: 'History',
    school: 'arts',
    description: '世界史、英国史、史学研究方法'
  },
  {
    id: 'philosophy',
    name: '哲学',
    nameEn: 'Philosophy',
    school: 'arts',
    description: '逻辑学、伦理学、形而上学'
  },
  
  // 社会科学类
  {
    id: 'psychology',
    name: '心理学',
    nameEn: 'Psychology',
    school: 'social-sciences',
    description: '认知心理学、社会心理学、临床心理学'
  },
  {
    id: 'economics',
    name: '经济学',
    nameEn: 'Economics',
    school: 'social-sciences',
    description: '微观经济学、宏观经济学、计量经济学'
  },
  {
    id: 'education',
    name: '教育学',
    nameEn: 'Education',
    school: 'social-sciences',
    description: '教育理论、课程设计、教学方法'
  },
  
  // 理科类
  {
    id: 'mathematics',
    name: '数学',
    nameEn: 'Mathematics',
    school: 'science',
    description: '纯数学、应用数学、统计学'
  },
  {
    id: 'physics',
    name: '物理学',
    nameEn: 'Physics',
    school: 'science',
    description: '理论物理、实验物理、天体物理'
  },
  {
    id: 'chemistry',
    name: '化学',
    nameEn: 'Chemistry',
    school: 'science',
    description: '有机化学、无机化学、物理化学'
  },
  {
    id: 'biology',
    name: '生物学',
    nameEn: 'Biology',
    school: 'science',
    description: '分子生物学、生态学、进化生物学'
  },
  
  // 医学类
  {
    id: 'medicine',
    name: '医学',
    nameEn: 'Medicine',
    school: 'medicine',
    description: '临床医学、基础医学、医学研究'
  },
  {
    id: 'nursing',
    name: '护理学',
    nameEn: 'Nursing',
    school: 'medicine',
    description: '临床护理、社区护理、护理管理'
  }
];

// 课程数据（每个专业的主要课程）
export const courses: Course[] = [
  // 计算机科学课程
  {
    id: 'comp1001',
    name: '计算机科学基础',
    nameEn: 'Fundamentals of Computer Science',
    code: 'COMP1001',
    departmentId: 'computer-science',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '编程基础、算法入门、计算机系统概述'
  },
  {
    id: 'comp1002',
    name: '程序设计与数据结构',
    nameEn: 'Programming and Data Structures',
    code: 'COMP1002',
    departmentId: 'computer-science',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: 'Java/Python编程、数据结构、算法设计'
  },
  {
    id: 'comp2001',
    name: '软件工程',
    nameEn: 'Software Engineering',
    code: 'COMP2001',
    departmentId: 'computer-science',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '软件开发生命周期、设计模式、团队项目'
  },
  {
    id: 'comp2002',
    name: '数据库系统',
    nameEn: 'Database Systems',
    code: 'COMP2002',
    departmentId: 'computer-science',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: 'SQL、数据库设计、事务处理'
  },
  {
    id: 'comp3001',
    name: '人工智能',
    nameEn: 'Artificial Intelligence',
    code: 'COMP3001',
    departmentId: 'computer-science',
    level: 'undergraduate',
    year: 3,
    credits: 20,
    description: '机器学习、神经网络、知识表示'
  },
  {
    id: 'comp3002',
    name: '计算机网络',
    nameEn: 'Computer Networks',
    code: 'COMP3002',
    departmentId: 'computer-science',
    level: 'undergraduate',
    year: 3,
    credits: 20,
    description: '网络协议、网络安全、分布式系统'
  },
  
  // 商科课程
  {
    id: 'bus1001',
    name: '管理学原理',
    nameEn: 'Principles of Management',
    code: 'BUS1001',
    departmentId: 'business-management',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '管理理论、组织行为、领导力基础'
  },
  {
    id: 'bus1002',
    name: '会计学基础',
    nameEn: 'Introduction to Accounting',
    code: 'BUS1002',
    departmentId: 'accounting',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '财务会计、成本会计、会计报表'
  },
  {
    id: 'fin2001',
    name: '企业金融',
    nameEn: 'Corporate Finance',
    code: 'FIN2001',
    departmentId: 'finance',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '资本预算、资本结构、风险管理'
  },
  {
    id: 'mkt2001',
    name: '市场营销原理',
    nameEn: 'Principles of Marketing',
    code: 'MKT2001',
    departmentId: 'marketing',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '市场分析、消费者行为、营销策略'
  },
  
  // 工程课程
  {
    id: 'mech1001',
    name: '工程数学',
    nameEn: 'Engineering Mathematics',
    code: 'MECH1001',
    departmentId: 'mechanical-engineering',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '微积分、线性代数、微分方程'
  },
  {
    id: 'mech1002',
    name: '材料科学',
    nameEn: 'Materials Science',
    code: 'MECH1002',
    departmentId: 'mechanical-engineering',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '材料性质、材料选择、材料测试'
  },
  {
    id: 'elec2001',
    name: '电路分析',
    nameEn: 'Circuit Analysis',
    code: 'ELEC2001',
    departmentId: 'electrical-engineering',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '直流电路、交流电路、网络定理'
  },
  
  // 数学课程
  {
    id: 'math1001',
    name: '微积分I',
    nameEn: 'Calculus I',
    code: 'MATH1001',
    departmentId: 'mathematics',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '极限、导数、积分基础'
  },
  {
    id: 'math1002',
    name: '线性代数',
    nameEn: 'Linear Algebra',
    code: 'MATH1002',
    departmentId: 'mathematics',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '矩阵、向量空间、特征值'
  },
  {
    id: 'math2001',
    name: '概率与统计',
    nameEn: 'Probability and Statistics',
    code: 'MATH2001',
    departmentId: 'mathematics',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '概率论、统计推断、假设检验'
  },
  
  // 心理学课程
  {
    id: 'psyc1001',
    name: '心理学概论',
    nameEn: 'Introduction to Psychology',
    code: 'PSYC1001',
    departmentId: 'psychology',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '心理学基础理论、研究方法、心理学史'
  },
  {
    id: 'psyc2001',
    name: '认知心理学',
    nameEn: 'Cognitive Psychology',
    code: 'PSYC2001',
    departmentId: 'psychology',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '记忆、注意、思维、语言认知过程'
  }
];

// 辅助函数
export function getSchoolById(id: string): School | undefined {
  return schools.find(school => school.id === id);
}

export function getDepartmentById(id: string): Department | undefined {
  return departments.find(dept => dept.id === id);
}

export function getCourseById(id: string): Course | undefined {
  return courses.find(course => course.id === id);
}

export function getDepartmentsBySchool(schoolId: string): Department[] {
  return departments.filter(dept => dept.school === schoolId);
}

export function getCoursesByDepartment(departmentId: string): Course[] {
  return courses.filter(course => course.departmentId === departmentId);
}

export function getCoursesByLevel(level: 'undergraduate' | 'postgraduate' | 'phd'): Course[] {
  return courses.filter(course => course.level === level);
} 