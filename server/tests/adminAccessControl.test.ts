import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdminAccessControlService } from '../adminAccessControlService';
import { db } from '../db';
import bcrypt from 'bcryptjs';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  }
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  }
}));

describe('Admin Access Control Tests', () => {
  let accessControlService: AdminAccessControlService;

  beforeEach(() => {
    vi.clearAllMocks();
    accessControlService = new AdminAccessControlService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      const roleData = {
        name: 'content_moderator',
        displayName: 'Content Moderator',
        description: 'Manages content approval and moderation',
        level: 3,
        permissions: { content: ['read', 'approve', 'reject'] },
        resourcePermissions: { products: ['read', 'approve'] },
        isSystemRole: false,
        isActive: true
      };

      // Mock no existing role
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue([])
          })
        })
      });

      // Mock successful insert
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue([{ id: 'role-1', ...roleData }])
        })
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.insert as any).mockImplementation(mockInsert);

      const result = await accessControlService.createRole(roleData, 'admin-1');

      expect(result).toEqual({ id: 'role-1', ...roleData });
      expect(db.insert).toHaveBeenCalled();
    });

    it('should throw error if role name already exists', async () => {
      const roleData = {
        name: 'existing_role',
        displayName: 'Existing Role',
        description: 'Test role',
        level: 2,
        permissions: {},
        resourcePermissions: {},
        isSystemRole: false,
        isActive: true
      };

      // Mock existing role
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue([{ id: 'existing-role', name: 'existing_role' }])
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      await expect(
        accessControlService.createRole(roleData, 'admin-1')
      ).rejects.toThrow("Role with name 'existing_role' already exists");
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const roleId = 'role-1';
      const updates = {
        displayName: 'Updated Role Name',
        description: 'Updated description'
      };

      const existingRole = {
        id: roleId,
        name: 'test_role',
        displayName: 'Test Role',
        isSystemRole: false
      };

      const updatedRole = { ...existingRole, ...updates };

      // Mock existing role
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue([existingRole])
          })
        })
      });

      // Mock successful update
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([updatedRole])
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.update as any).mockImplementation(mockUpdate);

      const result = await accessControlService.updateRole(roleId, updates, 'admin-1');

      expect(result).toEqual(updatedRole);
      expect(db.update).toHaveBeenCalled();
    });

    it('should throw error when trying to update system role name', async () => {
      const roleId = 'system-role-1';
      const updates = {
        name: 'new_system_role_name',
        level: 10
      };

      const existingRole = {
        id: roleId,
        name: 'system_admin',
        isSystemRole: true
      };

      // Mock existing system role
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue([existingRole])
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      await expect(
        accessControlService.updateRole(roleId, updates, 'admin-1')
      ).rejects.toThrow('Cannot modify name or level of system roles');
    });

    it('should throw error if role not found', async () => {
      const roleId = 'non-existent-role';
      const updates = { displayName: 'Updated Name' };

      // Mock no role found
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue([])
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      await expect(
        accessControlService.updateRole(roleId, updates, 'admin-1')
      ).rejects.toThrow('Role not found');
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      const roleId = 'role-1';
      const existingRole = {
        id: roleId,
        name: 'test_role',
        displayName: 'Test Role',
        isSystemRole: false
      };

      // Mock existing role
      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue([existingRole])
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue([]) // No assigned users
            })
          })
        });

      // Mock successful delete
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.delete as any).mockImplementation(mockDelete);

      await accessControlService.deleteRole(roleId, 'admin-1');

      expect(db.delete).toHaveBeenCalled();
    });

    it('should throw error when trying to delete system role', async () => {
      const roleId = 'system-role-1';
      const existingRole = {
        id: roleId,
        name: 'system_admin',
        isSystemRole: true
      };

      // Mock existing system role
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue([existingRole])
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      await expect(
        accessControlService.deleteRole(roleId, 'admin-1')
      ).rejects.toThrow('Cannot delete system roles');
    });

    it('should throw error if role is assigned to users', async () => {
      const roleId = 'role-1';
      const existingRole = {
        id: roleId,
        name: 'test_role',
        isSystemRole: false
      };

      const assignedUser = { id: 'user-1', roleId: roleId };

      // Mock existing role and assigned user
      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue([existingRole])
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue([assignedUser])
            })
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      await expect(
        accessControlService.deleteRole(roleId, 'admin-1')
      ).rejects.toThrow('Cannot delete role that is assigned to users');
    });
  });

  describe('createAdminUser', () => {
    it('should create admin user successfully', async () => {
      const userData = {
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'password123',
        roleId: 'role-1',
        requireMfa: false,
        sessionTimeoutMinutes: 480
      };

      const hashedPassword = 'hashed_password';
      const newUser = { id: 'user-1', email: userData.email, role: 'admin' };
      const newAdminUser = { id: 'admin-user-1', userId: 'user-1', roleId: userData.roleId };
      const role = { id: 'role-1', displayName: 'Test Role' };

      // Mock bcrypt hash
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);

      // Mock transaction
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          select: vi.fn(),
          insert: vi.fn()
        };

        // Mock no existing user
        tx.select
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue([])
              })
            })
          })
          // Mock role exists
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue([role])
              })
            })
          });

        // Mock successful inserts
        tx.insert
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockReturnValue([newUser])
            })
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockReturnValue([newAdminUser])
            })
          });

        return callback(tx);
      });

      (db.transaction as any).mockImplementation(mockTransaction);

      const result = await accessControlService.createAdminUser(userData, 'creator-1');

      expect(result.user).toEqual(newUser);
      expect(result.adminUser).toEqual(newAdminUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@test.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'password123',
        roleId: 'role-1'
      };

      const existingUser = { id: 'user-1', email: userData.email };

      // Mock transaction with existing user
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue([existingUser])
              })
            })
          })
        };

        return callback(tx);
      });

      (db.transaction as any).mockImplementation(mockTransaction);

      await expect(
        accessControlService.createAdminUser(userData, 'creator-1')
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('validatePermission', () => {
    it('should return true for valid permission', async () => {
      const request = {
        adminUserId: 'admin-1',
        resource: 'products',
        action: 'approve'
      };

      const adminUserData = [{
        adminUser: {
          id: 'admin-1',
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'role-1',
          permissions: null,
          resourcePermissions: {
            products: ['read', 'approve', 'reject'],
            suppliers: ['read']
          }
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(adminUserData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await accessControlService.validatePermission(request);

      expect(result).toBe(true);
    });

    it('should return true for admin with all permissions', async () => {
      const request = {
        adminUserId: 'admin-1',
        resource: 'anything',
        action: 'anything'
      };

      const adminUserData = [{
        adminUser: {
          id: 'admin-1',
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'role-1',
          permissions: { all: true },
          resourcePermissions: {}
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(adminUserData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await accessControlService.validatePermission(request);

      expect(result).toBe(true);
    });

    it('should return false for invalid permission', async () => {
      const request = {
        adminUserId: 'admin-1',
        resource: 'products',
        action: 'delete'
      };

      const adminUserData = [{
        adminUser: {
          id: 'admin-1',
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'role-1',
          permissions: null,
          resourcePermissions: {
            products: ['read', 'approve'] // No delete permission
          }
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(adminUserData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await accessControlService.validatePermission(request);

      expect(result).toBe(false);
    });

    it('should return false for inactive or locked user', async () => {
      const request = {
        adminUserId: 'admin-1',
        resource: 'products',
        action: 'read'
      };

      // Mock no admin user found (inactive/locked filtered out)
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue([])
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await accessControlService.validatePermission(request);

      expect(result).toBe(false);
    });

    it('should check user additional permissions as fallback', async () => {
      const request = {
        adminUserId: 'admin-1',
        resource: 'products',
        action: 'delete'
      };

      const adminUserData = [{
        adminUser: {
          id: 'admin-1',
          isActive: true,
          isLocked: false,
          additionalPermissions: {
            products: ['delete'] // User has additional delete permission
          }
        },
        role: {
          id: 'role-1',
          permissions: null,
          resourcePermissions: {
            products: ['read', 'approve'] // Role doesn't have delete
          }
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(adminUserData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await accessControlService.validatePermission(request);

      expect(result).toBe(true);
    });

    it('should handle wildcard permissions', async () => {
      const request = {
        adminUserId: 'admin-1',
        resource: 'anything',
        action: 'read'
      };

      const adminUserData = [{
        adminUser: {
          id: 'admin-1',
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'role-1',
          permissions: null,
          resourcePermissions: {
            '*': ['read'] // Wildcard read permission
          }
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(adminUserData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await accessControlService.validatePermission(request);

      expect(result).toBe(true);
    });
  });

  describe('logAdminActivity', () => {
    it('should log admin activity successfully', async () => {
      const activityData = {
        adminUserId: 'admin-1',
        action: 'create_role',
        description: 'Created new role',
        category: 'system_configuration',
        entityType: 'role',
        entityId: 'role-1',
        riskLevel: 'medium' as const
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await accessControlService.logAdminActivity(activityData);

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle logging errors gracefully', async () => {
      const activityData = {
        adminUserId: 'admin-1',
        action: 'test_action',
        description: 'Test action',
        category: 'test',
        riskLevel: 'low' as const
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.reject(new Error('Database error')))
      });

      (db.insert as any).mockImplementation(mockInsert);

      // Should not throw error
      await expect(
        accessControlService.logAdminActivity(activityData)
      ).resolves.toBeUndefined();
    });
  });

  describe('getAdminActivityLogs', () => {
    it('should retrieve admin activity logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          adminUserId: 'admin-1',
          adminName: 'John Doe',
          adminEmail: 'john@test.com',
          action: 'create_role',
          description: 'Created new role',
          category: 'system_configuration',
          riskLevel: 'medium',
          createdAt: new Date()
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockReturnValue(mockLogs)
              })
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await accessControlService.getAdminActivityLogs();

      expect(result).toEqual(mockLogs);
    });

    it('should filter logs by admin user ID', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          adminUserId: 'admin-1',
          action: 'test_action'
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockReturnValue(mockLogs)
                })
              })
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await accessControlService.getAdminActivityLogs('admin-1', 50, 0);

      expect(result).toEqual(mockLogs);
    });
  });

  describe('getRoleHierarchy', () => {
    it('should build role hierarchy correctly', async () => {
      const mockRoles = [
        { id: 'role-1', name: 'super_admin', parentRoleId: null, level: 10 },
        { id: 'role-2', name: 'admin', parentRoleId: 'role-1', level: 8 },
        { id: 'role-3', name: 'moderator', parentRoleId: 'role-2', level: 5 }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue(mockRoles)
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const hierarchy = await accessControlService.getRoleHierarchy();

      expect(hierarchy).toHaveLength(1); // One root role
      expect(hierarchy[0].id).toBe('role-1');
      expect(hierarchy[0].children).toHaveLength(1);
      expect(hierarchy[0].children[0].id).toBe('role-2');
      expect(hierarchy[0].children[0].children).toHaveLength(1);
      expect(hierarchy[0].children[0].children[0].id).toBe('role-3');
    });
  });
});