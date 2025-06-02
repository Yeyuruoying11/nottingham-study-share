import { getSchoolsByUniversityAndCampus } from './academic-data';

// 用户设置管理
export interface UserAcademicSettings {
  university?: string; // 'uon-uk' | 'uon-china' | 'ntu' | 'private'
  school?: string;
  department?: string;
  autoRedirect: boolean;
}

const SETTINGS_KEY = 'user_academic_settings';

// 获取用户设置
export function getUserSettings(): UserAcademicSettings {
  if (typeof window === 'undefined') {
    return { autoRedirect: false };
  }
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('获取用户设置失败:', error);
  }
  
  return { autoRedirect: false };
}

// 保存用户设置
export function saveUserSettings(settings: UserAcademicSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // 触发设置更新事件
    window.dispatchEvent(new CustomEvent('userSettingsUpdated', { detail: settings }));
  } catch (error) {
    console.error('保存用户设置失败:', error);
  }
}

// 获取学校选项
export function getUniversityOptions() {
  return [
    { id: 'uon-uk', name: '诺丁汉大学 - 英国校区', logo: '🇬🇧' },
    { id: 'uon-china', name: '诺丁汉大学 - 中国校区', logo: '🇨🇳' },
    { id: 'ntu', name: '诺丁汉特伦特大学', logo: '🏛️' },
    { id: 'private', name: '保密', logo: '🔒' }
  ];
}

// 根据学校选择获取对应的学院
export function getSchoolsByUniversityChoice(universityChoice: string) {
  switch (universityChoice) {
    case 'uon-uk':
      return getSchoolsByUniversityAndCampus('uon', 'uk');
    case 'uon-china':
      return getSchoolsByUniversityAndCampus('uon', 'china');
    case 'ntu':
      return getSchoolsByUniversityAndCampus('ntu');
    default:
      return [];
  }
}

// 根据学校选择获取导航路径
export function getNavigationPath(settings: UserAcademicSettings) {
  if (!settings.university || settings.university === 'private') {
    return null;
  }
  
  const path = ['/academic'];
  
  // 大学选择
  if (settings.university === 'uon-uk') {
    path.push('uon', 'uk');
  } else if (settings.university === 'uon-china') {
    path.push('uon', 'china');
  } else if (settings.university === 'ntu') {
    path.push('ntu');
  }
  
  // 学院选择
  if (settings.school) {
    path.push(settings.school);
  }
  
  // 专业选择
  if (settings.department) {
    path.push(settings.department);
  }
  
  return path.join('/');
} 