// 管理员配置
export const ADMIN_CONFIG = {
  // 管理员邮箱列表
  adminEmails: [
    'scyyt4@nottingham.ac.uk'
  ],
  
  // 管理员权限
  permissions: {
    unlimitedUsernameChanges: true,
    deleteAnyPost: true,
    deleteAnyComment: true,
    banUsers: true,
    viewUserData: true
  }
};

// 检查是否为管理员
export function isAdmin(email: string): boolean {
  return ADMIN_CONFIG.adminEmails.includes(email.toLowerCase());
}

// 检查是否为管理员用户对象
export function isAdminUser(user: any): boolean {
  return user && user.email && isAdmin(user.email);
}

// 获取管理员权限
export function getAdminPermissions(email: string) {
  if (isAdmin(email)) {
    return ADMIN_CONFIG.permissions;
  }
  return null;
} 