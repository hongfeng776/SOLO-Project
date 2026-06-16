require('dotenv').config();
const { hashPassword } = require('../utils/auth');
const { sequelize, syncDatabase } = require('../config/database');
const { Role, User } = require('../models');

const initData = async () => {
  console.log('[DB Init] 开始初始化数据库...');
  await syncDatabase(true);

  console.log('[DB Init] 创建初始角色...');
  const [superAdmin, admin, auditor, copyrightMgr, adMgr, activityMgr, viewer] = await Role.bulkCreate([
    {
      role_code: 'SUPER_ADMIN',
      role_name: '超级管理员',
      description: '拥有系统全部权限',
      permissions: ['*'],
      sort_order: 1,
      status: 1,
      created_by: 0,
    },
    {
      role_code: 'ADMIN',
      role_name: '管理员',
      description: '拥有大部分管理权限',
      permissions: ['user:*', 'role:view', 'content:*', 'copyright:*', 'ad:*', 'activity:*'],
      sort_order: 2,
      status: 1,
      created_by: 0,
    },
    {
      role_code: 'CONTENT_AUDITOR',
      role_name: '内容审核员',
      description: '负责内容审核与管理',
      permissions: ['content:view', 'content:audit', 'content:update'],
      sort_order: 3,
      status: 1,
      created_by: 0,
    },
    {
      role_code: 'COPYRIGHT_MANAGER',
      role_name: '版权管理员',
      description: '负责版权信息管理',
      permissions: ['copyright:*', 'content:view'],
      sort_order: 4,
      status: 1,
      created_by: 0,
    },
    {
      role_code: 'AD_MANAGER',
      role_name: '广告管理员',
      description: '负责广告投放管理',
      permissions: ['ad:*', 'content:view'],
      sort_order: 5,
      status: 1,
      created_by: 0,
    },
    {
      role_code: 'ACTIVITY_MANAGER',
      role_name: '活动运营',
      description: '负责营销活动策划与管理',
      permissions: ['activity:*', 'content:view'],
      sort_order: 6,
      status: 1,
      created_by: 0,
    },
    {
      role_code: 'VIEWER',
      role_name: '访客',
      description: '只读权限',
      permissions: ['content:view', 'copyright:view', 'ad:view', 'activity:view'],
      sort_order: 99,
      status: 1,
      created_by: 0,
    },
  ]);

  console.log('[DB Init] 创建初始用户...');
  const hashedPassword = await hashPassword('admin123456');
  await User.bulkCreate([
    {
      username: 'admin',
      password: hashedPassword,
      real_name: '超级管理员',
      email: 'admin@qiying.com',
      phone: '13800138000',
      role_id: superAdmin.id,
      department: '技术部',
      status: 1,
      created_by: 0,
    },
    {
      username: 'auditor01',
      password: hashedPassword,
      real_name: '内容审核员',
      email: 'auditor@qiying.com',
      phone: '13800138001',
      role_id: auditor.id,
      department: '内容部',
      status: 1,
      created_by: 0,
    },
  ]);

  console.log('\n========================================');
  console.log('[DB Init] 数据库初始化完成!');
  console.log('[DB Init] 管理员账号: admin / admin123456');
  console.log('[DB Init] 审核员账号: auditor01 / admin123456');
  console.log('========================================\n');

  process.exit(0);
};

initData().catch((err) => {
  console.error('[DB Init] 初始化失败:', err);
  process.exit(1);
});
