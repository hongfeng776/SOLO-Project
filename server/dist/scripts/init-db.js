"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const models_1 = require("../models");
const enum_1 = require("../constants/enum");
const logger_1 = __importDefault(require("../utils/logger"));
require("../models/OperationLog.model");
require("../models/ChannelExtension.model");
require("../models/CommissionRule.model");
require("../models/RoleDeletionLog.model");
const initDatabase = async () => {
    try {
        logger_1.default.info('Starting database initialization...');
        await database_1.sequelize.authenticate();
        logger_1.default.info('Database connected successfully');
        await database_1.sequelize.sync({ force: false });
        logger_1.default.info('Database tables synchronized');
        const adminRole = await models_1.Role.findOrCreate({
            where: { code: 'admin' },
            defaults: {
                code: 'admin',
                name: '超级管理员',
                description: '系统超级管理员，拥有所有权限',
                status: 1,
            },
        });
        const userRole = await models_1.Role.findOrCreate({
            where: { code: 'user' },
            defaults: {
                code: 'user',
                name: '普通用户',
                description: '普通用户，拥有基础权限',
                status: 1,
            },
        });
        logger_1.default.info('Roles initialized');
        const permissions = [
            { code: 'dashboard', name: '仪表盘', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/dashboard', icon: 'DataAnalysis', sort: 1 },
            { code: 'channel', name: '渠道管理', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/channel', icon: 'Connection', sort: 2 },
            { code: 'channel:list', name: '渠道列表', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 1 },
            { code: 'channel:create', name: '新增渠道', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 2 },
            { code: 'channel:update', name: '编辑渠道', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 3 },
            { code: 'channel:delete', name: '删除渠道', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 4 },
            { code: 'promoter', name: '推客管理', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/promoter', icon: 'User', sort: 3 },
            { code: 'promoter:list', name: '推客列表', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 1 },
            { code: 'promoter:create', name: '新增推客', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 2 },
            { code: 'promoter:update', name: '编辑推客', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 3 },
            { code: 'promoter:delete', name: '删除推客', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 4 },
            { code: 'order', name: '订单管理', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/order', icon: 'List', sort: 4 },
            { code: 'order:list', name: '订单列表', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 1 },
            { code: 'order:create', name: '新增订单', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 2 },
            { code: 'order:update', name: '编辑订单', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 3 },
            { code: 'order:delete', name: '删除订单', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 4 },
            { code: 'commission', name: '佣金管理', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/commission', icon: 'Money', sort: 5 },
            { code: 'commission:list', name: '佣金列表', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 1 },
            { code: 'marketing', name: '营销活动', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/marketing', icon: 'Promotion', sort: 6 },
            { code: 'marketing:list', name: '活动列表', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 1 },
            { code: 'marketing:create', name: '新增活动', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 2 },
            { code: 'marketing:update', name: '编辑活动', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 3 },
            { code: 'marketing:delete', name: '删除活动', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 4 },
            { code: 'withdraw', name: '提现管理', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/withdraw', icon: 'Wallet', sort: 7 },
            { code: 'withdraw:list', name: '提现列表', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 1 },
            { code: 'withdraw:audit', name: '审核提现', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 2 },
            { code: 'permission', name: '权限管理', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/permission', icon: 'Lock', sort: 8 },
            { code: 'permission:role', name: '角色管理', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/permission/role', icon: 'UserFilled', sort: 1 },
            { code: 'permission:menu', name: '权限菜单', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/permission/menu', icon: 'Menu', sort: 2 },
            { code: 'log', name: '操作日志', type: enum_1.PermissionType.MENU, parentId: undefined, path: '/log', icon: 'Document', sort: 9 },
            { code: 'log:list', name: '日志列表', type: enum_1.PermissionType.BUTTON, parentId: undefined, sort: 1 },
        ];
        for (const perm of permissions) {
            await models_1.Permission.findOrCreate({
                where: { code: perm.code },
                defaults: perm,
            });
        }
        logger_1.default.info('Permissions initialized');
        const allPermissions = await models_1.Permission.findAll();
        for (const perm of allPermissions) {
            await models_1.RolePermission.findOrCreate({
                where: { roleId: adminRole[0].id, permissionId: perm.id },
                defaults: { roleId: adminRole[0].id, permissionId: perm.id },
            });
        }
        logger_1.default.info('Role permissions initialized');
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
        const hashedPassword = await bcryptjs_1.default.hash('admin123456', saltRounds);
        const adminUser = await models_1.User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                password: hashedPassword,
                nickname: '超级管理员',
                role: enum_1.UserRole.ADMIN,
                status: enum_1.UserStatus.ACTIVE,
                email: 'admin@utuilianmeng.com',
                phone: '13800138000',
            },
        });
        await models_1.UserRole.findOrCreate({
            where: { userId: adminUser[0].id, roleId: adminRole[0].id },
            defaults: { userId: adminUser[0].id, roleId: adminRole[0].id },
        });
        logger_1.default.info('Default admin user created: admin / admin123456');
        logger_1.default.info('Database initialization completed successfully!');
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Database initialization failed:', error);
        process.exit(1);
    }
};
initDatabase();
//# sourceMappingURL=init-db.js.map