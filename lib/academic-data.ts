import { School, Department, Course, University } from './types';

// 大学数据
export const universities: University[] = [
  {
    id: 'uon',
    name: '诺丁汉大学',
    nameEn: 'University of Nottingham',
    description: '英国顶尖研究型大学，罗素大学集团成员',
    logo: '🎓',
    website: 'https://www.nottingham.ac.uk'
  },
  {
    id: 'ntu',
    name: '诺丁汉特伦特大学',
    nameEn: 'Nottingham Trent University',
    description: '以实践教学和就业导向著称的现代化大学',
    logo: '🏛️',
    website: 'https://www.ntu.ac.uk'
  }
];

// 诺丁汉大学学院数据
export const schools: School[] = [
  // 诺丁汉大学学院
  {
    id: 'uon-arts',
    name: '人文学院',
    nameEn: 'Faculty of Arts',
    description: '包含语言、文学、历史、哲学等人文学科',
    universityId: 'uon'
  },
  {
    id: 'uon-engineering',
    name: '工程学院',
    nameEn: 'Faculty of Engineering',
    description: '涵盖各类工程学科，注重实践与创新',
    universityId: 'uon'
  },
  {
    id: 'uon-medicine',
    name: '医学院',
    nameEn: 'Faculty of Medicine & Health Sciences',
    description: '医学、护理、兽医学等健康科学专业',
    universityId: 'uon'
  },
  {
    id: 'uon-science',
    name: '理学院',
    nameEn: 'Faculty of Science',
    description: '数学、物理、化学、生物等基础科学',
    universityId: 'uon'
  },
  {
    id: 'uon-social-sciences',
    name: '社会科学院',
    nameEn: 'Faculty of Social Sciences',
    description: '心理学、教育学、政治学、经济学等',
    universityId: 'uon'
  },
  {
    id: 'uon-business',
    name: '商学院',
    nameEn: 'Nottingham University Business School',
    description: '商业管理、金融、会计、市场营销等商科专业',
    universityId: 'uon'
  },
  
  // 诺丁汉特伦特大学学院
  {
    id: 'ntu-art-design',
    name: '艺术与设计学院',
    nameEn: 'School of Art & Design',
    description: '创意设计、视觉艺术、时装设计等创意学科',
    universityId: 'ntu'
  },
  {
    id: 'ntu-business',
    name: '商学院',
    nameEn: 'Nottingham Business School',
    description: '实践导向的商业教育，与业界联系紧密',
    universityId: 'ntu'
  },
  {
    id: 'ntu-science-technology',
    name: '科学技术学院',
    nameEn: 'School of Science and Technology',
    description: '计算机科学、工程技术、生物科学等',
    universityId: 'ntu'
  },
  {
    id: 'ntu-social-sciences',
    name: '社会科学学院',
    nameEn: 'School of Social Sciences',
    description: '心理学、社会工作、犯罪学、政治学等',
    universityId: 'ntu'
  },
  {
    id: 'ntu-education',
    name: '教育学院',
    nameEn: 'School of Education',
    description: '教师培训、教育研究、早期教育等',
    universityId: 'ntu'
  },
  {
    id: 'ntu-law',
    name: '法学院',
    nameEn: 'Nottingham Law School',
    description: '法律实务、法学理论、国际法等',
    universityId: 'ntu'
  }
];

// 专业数据
export const departments: Department[] = [
  // 诺丁汉大学专业
  // 计算机科学类
  {
    id: 'uon-computer-science',
    name: '计算机科学',
    nameEn: 'Computer Science',
    school: 'uon-science',
    description: '软件开发、算法、人工智能、数据科学等'
  },
  {
    id: 'uon-software-engineering',
    name: '软件工程',
    nameEn: 'Software Engineering',
    school: 'uon-science',
    description: '软件开发生命周期、项目管理、系统设计'
  },
  
  // 商科类
  {
    id: 'uon-business-management',
    name: '商业管理',
    nameEn: 'Business Management',
    school: 'uon-business',
    description: '企业管理、战略规划、领导力发展'
  },
  {
    id: 'uon-finance',
    name: '金融学',
    nameEn: 'Finance',
    school: 'uon-business',
    description: '投资分析、风险管理、金融市场'
  },
  {
    id: 'uon-accounting',
    name: '会计学',
    nameEn: 'Accounting',
    school: 'uon-business',
    description: '财务会计、管理会计、审计'
  },
  {
    id: 'uon-marketing',
    name: '市场营销',
    nameEn: 'Marketing',
    school: 'uon-business',
    description: '品牌管理、数字营销、消费者行为'
  },
  
  // 工程类
  {
    id: 'uon-mechanical-engineering',
    name: '机械工程',
    nameEn: 'Mechanical Engineering',
    school: 'uon-engineering',
    description: '机械设计、制造工程、热力学'
  },
  {
    id: 'uon-electrical-engineering',
    name: '电气工程',
    nameEn: 'Electrical Engineering',
    school: 'uon-engineering',
    description: '电路设计、信号处理、电力系统'
  },
  {
    id: 'uon-civil-engineering',
    name: '土木工程',
    nameEn: 'Civil Engineering',
    school: 'uon-engineering',
    description: '结构设计、建筑工程、基础设施'
  },
  
  // 文科类
  {
    id: 'uon-english',
    name: '英语语言文学',
    nameEn: 'English Language and Literature',
    school: 'uon-arts',
    description: '文学分析、语言学、创意写作'
  },
  {
    id: 'uon-history',
    name: '历史学',
    nameEn: 'History',
    school: 'uon-arts',
    description: '世界史、英国史、史学研究方法'
  },
  {
    id: 'uon-philosophy',
    name: '哲学',
    nameEn: 'Philosophy',
    school: 'uon-arts',
    description: '逻辑学、伦理学、形而上学'
  },
  
  // 社会科学类
  {
    id: 'uon-psychology',
    name: '心理学',
    nameEn: 'Psychology',
    school: 'uon-social-sciences',
    description: '认知心理学、社会心理学、临床心理学'
  },
  {
    id: 'uon-economics',
    name: '经济学',
    nameEn: 'Economics',
    school: 'uon-social-sciences',
    description: '微观经济学、宏观经济学、计量经济学'
  },
  {
    id: 'uon-education',
    name: '教育学',
    nameEn: 'Education',
    school: 'uon-social-sciences',
    description: '教育理论、课程设计、教学方法'
  },
  
  // 理科类
  {
    id: 'uon-mathematics',
    name: '数学',
    nameEn: 'Mathematics',
    school: 'uon-science',
    description: '纯数学、应用数学、统计学'
  },
  {
    id: 'uon-physics',
    name: '物理学',
    nameEn: 'Physics',
    school: 'uon-science',
    description: '理论物理、实验物理、天体物理'
  },
  {
    id: 'uon-chemistry',
    name: '化学',
    nameEn: 'Chemistry',
    school: 'uon-science',
    description: '有机化学、无机化学、物理化学'
  },
  {
    id: 'uon-biology',
    name: '生物学',
    nameEn: 'Biology',
    school: 'uon-science',
    description: '分子生物学、生态学、进化生物学'
  },
  
  // 医学类
  {
    id: 'uon-medicine',
    name: '医学',
    nameEn: 'Medicine',
    school: 'uon-medicine',
    description: '临床医学、基础医学、医学研究'
  },
  {
    id: 'uon-nursing',
    name: '护理学',
    nameEn: 'Nursing',
    school: 'uon-medicine',
    description: '临床护理、社区护理、护理管理'
  },

  // 诺丁汉特伦特大学专业
  // 艺术与设计类
  {
    id: 'ntu-graphic-design',
    name: '平面设计',
    nameEn: 'Graphic Design',
    school: 'ntu-art-design',
    description: '视觉传达、品牌设计、数字媒体设计'
  },
  {
    id: 'ntu-fashion-design',
    name: '时装设计',
    nameEn: 'Fashion Design',
    school: 'ntu-art-design',
    description: '服装设计、时尚营销、纺织创新'
  },
  {
    id: 'ntu-fine-art',
    name: '美术',
    nameEn: 'Fine Art',
    school: 'ntu-art-design',
    description: '绘画、雕塑、装置艺术、当代艺术'
  },
  
  // 商科类
  {
    id: 'ntu-business-management',
    name: '商业管理',
    nameEn: 'Business Management',
    school: 'ntu-business',
    description: '企业管理、创业、国际商务'
  },
  {
    id: 'ntu-accounting',
    name: '会计与金融',
    nameEn: 'Accounting and Finance',
    school: 'ntu-business',
    description: '财务管理、投资分析、企业金融'
  },
  {
    id: 'ntu-marketing',
    name: '市场营销',
    nameEn: 'Marketing',
    school: 'ntu-business',
    description: '数字营销、品牌管理、消费者心理学'
  },
  
  // 科学技术类
  {
    id: 'ntu-computer-science',
    name: '计算机科学',
    nameEn: 'Computer Science',
    school: 'ntu-science-technology',
    description: '软件开发、网络安全、人工智能'
  },
  {
    id: 'ntu-engineering',
    name: '工程学',
    nameEn: 'Engineering',
    school: 'ntu-science-technology',
    description: '机械工程、电子工程、可持续工程'
  },
  {
    id: 'ntu-biosciences',
    name: '生物科学',
    nameEn: 'Biosciences',
    school: 'ntu-science-technology',
    description: '生物技术、微生物学、生物医学'
  },
  
  // 社会科学类
  {
    id: 'ntu-psychology',
    name: '心理学',
    nameEn: 'Psychology',
    school: 'ntu-social-sciences',
    description: '应用心理学、犯罪心理学、健康心理学'
  },
  {
    id: 'ntu-criminology',
    name: '犯罪学',
    nameEn: 'Criminology',
    school: 'ntu-social-sciences',
    description: '犯罪分析、刑事司法、社会政策'
  },
  {
    id: 'ntu-social-work',
    name: '社会工作',
    nameEn: 'Social Work',
    school: 'ntu-social-sciences',
    description: '社区工作、儿童保护、心理健康支持'
  },
  
  // 教育类
  {
    id: 'ntu-primary-education',
    name: '小学教育',
    nameEn: 'Primary Education',
    school: 'ntu-education',
    description: '儿童发展、教学方法、课程设计'
  },
  {
    id: 'ntu-secondary-education',
    name: '中学教育',
    nameEn: 'Secondary Education',
    school: 'ntu-education',
    description: '学科教学、青少年心理学、教育技术'
  },
  
  // 法学类
  {
    id: 'ntu-law',
    name: '法学',
    nameEn: 'Law',
    school: 'ntu-law',
    description: '英国法、国际法、商业法、人权法'
  }
];

// 课程数据（每个专业的主要课程）
export const courses: Course[] = [
  // 诺丁汉大学计算机科学课程
  {
    id: 'comp1001',
    name: '计算机科学基础',
    nameEn: 'Fundamentals of Computer Science',
    code: 'COMP1001',
    departmentId: 'uon-computer-science',
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
    departmentId: 'uon-computer-science',
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
    departmentId: 'uon-computer-science',
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
    departmentId: 'uon-computer-science',
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
    departmentId: 'uon-computer-science',
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
    departmentId: 'uon-computer-science',
    level: 'undergraduate',
    year: 3,
    credits: 20,
    description: '网络协议、网络安全、分布式系统'
  },
  
  // 诺丁汉大学商科课程
  {
    id: 'bus1001',
    name: '管理学原理',
    nameEn: 'Principles of Management',
    code: 'BUS1001',
    departmentId: 'uon-business-management',
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
    departmentId: 'uon-accounting',
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
    departmentId: 'uon-finance',
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
    departmentId: 'uon-marketing',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '市场分析、消费者行为、营销策略'
  },
  
  // 诺丁汉大学工程课程
  {
    id: 'mech1001',
    name: '工程数学',
    nameEn: 'Engineering Mathematics',
    code: 'MECH1001',
    departmentId: 'uon-mechanical-engineering',
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
    departmentId: 'uon-mechanical-engineering',
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
    departmentId: 'uon-electrical-engineering',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '直流电路、交流电路、网络定理'
  },
  
  // 诺丁汉大学数学课程
  {
    id: 'math1001',
    name: '微积分I',
    nameEn: 'Calculus I',
    code: 'MATH1001',
    departmentId: 'uon-mathematics',
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
    departmentId: 'uon-mathematics',
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
    departmentId: 'uon-mathematics',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '概率论、统计推断、假设检验'
  },
  
  // 诺丁汉大学心理学课程
  {
    id: 'psyc1001',
    name: '心理学概论',
    nameEn: 'Introduction to Psychology',
    code: 'PSYC1001',
    departmentId: 'uon-psychology',
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
    departmentId: 'uon-psychology',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '记忆、注意、思维、语言认知过程'
  },

  // 诺丁汉特伦特大学课程
  // 艺术设计课程
  {
    id: 'ntu-gd1001',
    name: '设计基础',
    nameEn: 'Design Fundamentals',
    code: 'GD1001',
    departmentId: 'ntu-graphic-design',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '设计原理、色彩理论、构图技巧'
  },
  {
    id: 'ntu-fd1001',
    name: '时装制图',
    nameEn: 'Fashion Illustration',
    code: 'FD1001',
    departmentId: 'ntu-fashion-design',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '服装绘制、人体比例、面料表现'
  },
  
  // 商科课程
  {
    id: 'ntu-bm1001',
    name: '商业环境',
    nameEn: 'Business Environment',
    code: 'BM1001',
    departmentId: 'ntu-business-management',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '商业环境分析、市场结构、企业社会责任'
  },
  {
    id: 'ntu-ac1001',
    name: '财务会计',
    nameEn: 'Financial Accounting',
    code: 'AC1001',
    departmentId: 'ntu-accounting',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: '会计基础、财务报表、会计准则'
  },
  
  // 计算机科学课程
  {
    id: 'ntu-cs1001',
    name: '编程入门',
    nameEn: 'Introduction to Programming',
    code: 'CS1001',
    departmentId: 'ntu-computer-science',
    level: 'undergraduate',
    year: 1,
    credits: 20,
    description: 'Python基础、算法思维、问题解决'
  },
  {
    id: 'ntu-cs2001',
    name: '网络安全',
    nameEn: 'Cybersecurity',
    code: 'CS2001',
    departmentId: 'ntu-computer-science',
    level: 'undergraduate',
    year: 2,
    credits: 20,
    description: '信息安全、网络防护、风险评估'
  }
];

// 辅助函数
export function getUniversityById(id: string): University | undefined {
  return universities.find(university => university.id === id);
}

export function getSchoolById(id: string): School | undefined {
  return schools.find(school => school.id === id);
}

export function getDepartmentById(id: string): Department | undefined {
  return departments.find(dept => dept.id === id);
}

export function getCourseById(id: string): Course | undefined {
  return courses.find(course => course.id === id);
}

export function getSchoolsByUniversity(universityId: string): School[] {
  return schools.filter(school => school.universityId === universityId);
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