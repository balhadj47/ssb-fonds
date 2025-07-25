
import { User } from '@/types/rbac';
import { SystemGroup } from '@/types/systemGroups';

let globalCurrentUser: User | null = null;
let globalRoles: SystemGroup[] = [];

export const setGlobalPermissionState = (user: User | null, roles: SystemGroup[]) => {
  globalCurrentUser = user;
  globalRoles = roles;
};

export const createPermissionUtils = (users: User[], roles: SystemGroup[]) => {
  setGlobalPermissionState(users[0] || null, roles);
};

export const hasPermission = (userId: string, permission: string): boolean => {
  try {
    if (!permission || typeof permission !== 'string' || permission.trim() === '') {
      return false;
    }

    if (!globalCurrentUser || !globalCurrentUser.id || globalCurrentUser.id !== userId) {
      return false;
    }

    // Check for admin role first
    if (globalCurrentUser.role_id === 1) {
      console.log('🔒 hasPermission: Admin user, granting permission:', permission);
      return true;
    }

    const basicPermissions = [
      'dashboard:read', 
      'trips:read', 
      'companies:read',
      'vans:read',
      'users:read'
    ];
    
    if (basicPermissions.includes(permission)) {
      return true;
    }

    if (!Array.isArray(globalRoles) || globalRoles.length === 0) {
      return basicPermissions.includes(permission);
    }

    // Use role_id field to match with user's role_id
    const userRole = globalRoles.find(role => role.role_id === globalCurrentUser.role_id);
    if (!userRole) {
      return basicPermissions.includes(permission);
    }

    return Array.isArray(userRole.permissions) && userRole.permissions.includes(permission);

  } catch (error) {
    console.error('🔒 hasPermission error:', error);
    
    // Fallback for admin users
    if (globalCurrentUser?.role_id === 1) {
      return true;
    }
    
    const basicPermissions = ['dashboard:read', 'trips:read', 'companies:read', 'vans:read', 'users:read'];
    return basicPermissions.includes(permission);
  }
};

export const getUserRole = (userId: string): SystemGroup | null => {
  try {
    if (!globalCurrentUser || globalCurrentUser.id !== userId) {
      return null;
    }
    
    if (!Array.isArray(globalRoles)) {
      return null;
    }
    
    // Use role_id field consistently
    const role = globalRoles.find(r => r.role_id === globalCurrentUser.role_id);
    return role || null;
  } catch (error) {
    console.error('🔒 getUserRole error:', error);
    return null;
  }
};

export const canUserPerformAction = (userId: string, action: string): boolean => {
  try {
    // Check admin first
    if (globalCurrentUser?.role_id === 1) {
      return true;
    }
    
    const userRole = getUserRole(userId);
    if (!userRole) {
      return false;
    }
    
    return Array.isArray(userRole.permissions) && userRole.permissions.includes(action);
  } catch (error) {
    console.error('🔒 canUserPerformAction error:', error);
    return globalCurrentUser?.role_id === 1;
  }
};
