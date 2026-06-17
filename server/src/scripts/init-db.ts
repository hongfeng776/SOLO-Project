import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { User, Role, Permission, UserRole, RolePermission } from '../models';
import { UserRole as UserRoleEnum, UserStatus, PermissionType, PermissionModule } from '../constants/enum';
import Logger from '../utils/logger';
import '../models/Permission.model';
import '../models/OperationLog.model';
import '../models/ChannelExtension.model';
import '../models/CommissionRule.model';
import '../models/RoleDeletionLog.model';

const initDatabase = async (): Promise<void> => {
  try {
    Logger.info('Starting database initialization...');

    await sequelize.authenticate();
    Logger.info('Database connected successfully');

    await sequelize.sync({ force: false });
    Logger.info('Database tables synchronized');

    const adminRole = await Role.findOrCreate({
      where: { code: 'admin' },
      defaults: {
        code: 'admin',
        name: '超级管理员',
        description: '系统超级管理员，拥有所有权限',
        status: 1,
      },
    });

    const userRole = await Role.findOrCreate({
      where: { code: 'user' },
      defaults: {
        code: 'user',
        name: '普通用户',
        description: '普通用户，拥有基础权限',
        status: 1,
      },
    });

    Logger.info('Roles initialized');

    const permissions = [
      { code: 'dashboard', name: '仪表盘', type: PermissionType.MENU, parentId: undefined, path: '/dashboard', icon: 'DataAnalysis', sort: 1, module: PermissionModule.DASHBOARD, level: 1, isSystem: true },
      { code: 'channel', name: '渠道管理', type: PermissionType.MENU, parentId: undefined, path: '/channel', icon: 'Connection', sort: 2, module: PermissionModule.CHANNEL, level: 1, isSystem: true },
      { code: 'channel:list', name: '渠道列表', type: PermissionType.BUTTON, parentId: undefined, sort: 1, module: PermissionModule.CHANNEL, level: 2, isSystem: true },
      { code: 'channel:create', name: '新增渠道', type: PermissionType.BUTTON, parentId: undefined, sort: 2, module: PermissionModule.CHANNEL, level: 2, isSystem: true },
      { code: 'channel:update', name: '编辑渠道', type: PermissionType.BUTTON, parentId: undefined, sort: 3, module: PermissionModule.CHANNEL, level: 2, isSystem: true },
      { code: 'channel:delete', name: '删除渠道', type: PermissionType.BUTTON, parentId: undefined, sort: 4, module: PermissionModule.CHANNEL, level: 2, isSystem: true },
      { code: 'promoter', name: '推客管理', type: PermissionType.MENU, parentId: undefined, path: '/promoter', icon: 'User', sort: 3, module: PermissionModule.PROMOTER, level: 1, isSystem: true },
      { code: 'promoter:list', name: '推客列表', type: PermissionType.BUTTON, parentId: undefined, sort: 1, module: PermissionModule.PROMOTER, level: 2, isSystem: true },
      { code: 'promoter:create', name: '新增推客', type: PermissionType.BUTTON, parentId: undefined, sort: 2, module: PermissionModule.PROMOTER, level: 2, isSystem: true },
      { code: 'promoter:update', name: '编辑推客', type: PermissionType.BUTTON, parentId: undefined, sort: 3, module: PermissionModule.PROMOTER, level: 2, isSystem: true },
      { code: 'promoter:delete', name: '删除推客', type: PermissionType.BUTTON, parentId: undefined, sort: 4, module: PermissionModule.PROMOTER, level: 2, isSystem: true },
      { code: 'order', name: '订单管理', type: PermissionType.MENU, parentId: undefined, path: '/order', icon: 'List', sort: 4, module: PermissionModule.ORDER, level: 1, isSystem: true },
      { code: 'order:list', name: '订单列表', type: PermissionType.BUTTON, parentId: undefined, sort: 1, module: PermissionModule.ORDER, level: 2, isSystem: true },
      { code: 'order:create', name: '新增订单', type: PermissionType.BUTTON, parentId: undefined, sort: 2, module: PermissionModule.ORDER, level: 2, isSystem: true },
      { code: 'order:update', name: '编辑订单', type: PermissionType.BUTTON, parentId: undefined, sort: 3, module: PermissionModule.ORDER, level: 2, isSystem: true },
      { code: 'order:delete', name: '删除订单', type: PermissionType.BUTTON, parentId: undefined, sort: 4, module: PermissionModule.ORDER, level: 2, isSystem: true },
      { code: 'commission', name: '佣金管理', type: PermissionType.MENU, parentId: undefined, path: '/commission', icon: 'Money', sort: 5, module: PermissionModule.COMMISSION, level: 1, isSystem: true },
      { code: 'commission:list', name: '佣金列表', type: PermissionType.BUTTON, parentId: undefined, sort: 1, module: PermissionModule.COMMISSION, level: 2, isSystem: true },
      { code: 'marketing', name: '营销活动', type: PermissionType.MENU, parentId: undefined, path: '/marketing', icon: 'Promotion', sort: 6, module: PermissionModule.MARKETING, level: 1, isSystem: true },
      { code: 'marketing:list', name: '活动列表', type: PermissionType.BUTTON, parentId: undefined, sort: 1, module: PermissionModule.MARKETING, level: 2, isSystem: true },
      { code: 'marketing:create', name: '新增活动', type: PermissionType.BUTTON, parentId: undefined, sort: 2, module: PermissionModule.MARKETING, level: 2, isSystem: true },
      { code: 'marketing:update', name: '编辑活动', type: PermissionType.BUTTON, parentId: undefined, sort: 3, module: PermissionModule.MARKETING, level: 2, isSystem: true },
      { code: 'marketing:delete', name: '删除活动', type: PermissionType.BUTTON, parentId: undefined, sort: 4, module: PermissionModule.MARKETING, level: 2, isSystem: true },
      { code: 'withdraw', name: '提现管理', type: PermissionType.MENU, parentId: undefined, path: '/withdraw', icon: 'Wallet', sort: 7, module: PermissionModule.WITHDRAW, level: 1, isSystem: true },
      { code: 'withdraw:list', name: '提现列表', type: PermissionType.BUTTON, parentId: undefined, sort: 1, module: PermissionModule.WITHDRAW, level: 2, isSystem: true },
      { code: 'withdraw:audit', name: '审核提现', type: PermissionType.BUTTON, parentId: undefined, sort: 2, module: PermissionModule.WITHDRAW, level: 2, isSystem: true },
      { code: 'permission', name: '权限管理', type: PermissionType.MENU, parentId: undefined, path: '/permission', icon: 'Lock', sort: 8, module: PermissionModule.SYSTEM, level: 1, isSystem: true },
      { code: 'permission:role', name: '角色管理', type: PermissionType.MENU, parentId: undefined, path: '/permission/role', icon: 'UserFilled', sort: 1, module: PermissionModule.SYSTEM, level: 2, isSystem: true },
      { code: 'permission:menu', name: '权限菜单', type: PermissionType.MENU, parentId: undefined, path: '/permission/menu', icon: 'Menu', sort: 2, module: PermissionModule.SYSTEM, level: 2, isSystem: true },
      { code: 'log', name: '操作日志', type: PermissionType.MENU, parentId: undefined, path: '/log', icon: 'Document', sort: 9, module: PermissionModule.LOG, level: 1, isSystem: true },
      { code: 'log:list', name: '日志列表', type: PermissionType.BUTTON, parentId: undefined, sort: 1, module: PermissionModule.LOG, level: 2, isSystem: true },
    ];

    for (const perm of permissions) {
      await Permission.findOrCreate({
        where: { code: perm.code },
        defaults: perm,
      });
    }

    Logger.info('Permissions initialized');

    const allPermissions = await Permission.findAll();
    for (const perm of allPermissions) {
      await RolePermission.findOrCreate({
        where: { roleId: adminRole[0].id, permissionId: perm.id },
        defaults: { roleId: adminRole[0].id, permissionId: perm.id },
      });
    }

    Logger.info('Role permissions initialized');

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const hashedPassword = await bcrypt.hash('admin123456', saltRounds);

    const adminUser = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password: hashedPassword,
        nickname: '超级管理员',
        role: UserRoleEnum.ADMIN,
        status: UserStatus.ACTIVE,
        email: 'admin@utuilianmeng.com',
        phone: '13800138000',
      },
    });

    await UserRole.findOrCreate({
      where: { userId: adminUser[0].id, roleId: adminRole[0].id },
      defaults: { userId: adminUser[0].id, roleId: adminRole[0].id },
    });

    Logger.info('Default admin user created: admin / admin123456');

    Logger.info('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    Logger.error('Database initialization failed:', error);
    process.exit(1);
  }
};

initDatabase();
