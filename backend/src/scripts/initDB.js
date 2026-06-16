require('dotenv').config();
const { hashPassword } = require('../utils/auth');
const { sequelize, syncDatabase } = require('../config/database');
const { Role, User, Content, Comment, Member, Message } = require('../models');

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
  const [adminUser, auditorUser, normalUser] = await User.bulkCreate([
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
    {
      username: 'user01',
      password: hashedPassword,
      real_name: '普通用户',
      email: 'user01@qiying.com',
      phone: '13800138002',
      role_id: viewer.id,
      department: '运营部',
      status: 1,
      created_by: 0,
    },
  ]);

  console.log('[DB Init] 创建测试内容...');
  const [movie, tvSeries, variety] = await Content.bulkCreate([
    {
      content_title: '流浪地球3',
      content_category: 1,
      content_description: '科幻巨制，人类再次面对太阳危机',
      director: '郭帆',
      area: '中国大陆',
      language: '普通话',
      release_year: 2025,
      duration: 148,
      audit_status: 2,
      status: 1,
      rating: 9.2,
      play_count: 580000,
      created_by: adminUser.id,
    },
    {
      content_title: '繁花似锦',
      content_category: 2,
      content_description: '都市情感剧，讲述三姐妹的成长故事',
      area: '中国大陆',
      language: '普通话',
      release_year: 2025,
      total_episodes: 40,
      updated_episodes: 32,
      audit_status: 2,
      status: 1,
      rating: 8.5,
      play_count: 320000,
      is_vip: 1,
      created_by: adminUser.id,
    },
    {
      content_title: '快乐大本营2025',
      content_category: 3,
      content_description: '经典综艺焕新回归',
      area: '中国大陆',
      language: '普通话',
      audit_status: 2,
      status: 1,
      rating: 7.8,
      play_count: 150000,
      created_by: adminUser.id,
    },
  ]);

  console.log('[DB Init] 创建测试评论...');
  await Comment.bulkCreate([
    {
      content_id: movie.id,
      user_id: adminUser.id,
      comment_content: '特效太震撼了，国产科幻的骄傲！',
      like_count: 256,
      is_top: 1,
      is_hot: 1,
      comment_status: 1,
      violation_level: 0,
      audit_status: 1,
      auditor_id: auditorUser.id,
      audit_time: new Date(),
      source: 'web',
    },
    {
      content_id: tvSeries.id,
      user_id: auditorUser.id,
      comment_content: '剧情很精彩，每周都在追更新',
      like_count: 89,
      comment_status: 1,
      violation_level: 0,
      audit_status: 1,
      auditor_id: auditorUser.id,
      audit_time: new Date(),
      source: 'ios',
    },
    {
      content_id: movie.id,
      user_id: adminUser.id,
      comment_content: '免费领取VIP会员，加微信xxx',
      like_count: 0,
      comment_status: 3,
      violation_level: 2,
      violation_type: 'spam',
      filter_result: { spam: true, keywords: ['免费领取', '加微信'] },
      audit_status: 2,
      audit_remark: '垃圾广告评论',
      auditor_id: auditorUser.id,
      audit_time: new Date(),
      source: 'h5',
    },
    {
      content_id: variety.id,
      user_id: auditorUser.id,
      comment_content: '这期嘉宾阵容太强了，笑到停不下来',
      like_count: 45,
      is_hot: 1,
      comment_status: 1,
      violation_level: 0,
      audit_status: 1,
      auditor_id: auditorUser.id,
      audit_time: new Date(),
      source: 'android',
    },
    {
      content_id: tvSeries.id,
      user_id: adminUser.id,
      comment_content: '演员演技太差了，浪费时间',
      like_count: 3,
      comment_status: 3,
      violation_level: 1,
      violation_type: 'abuse',
      filter_result: { abuse: true, score: 0.72 },
      audit_status: 2,
      audit_remark: '辱骂攻击',
      auditor_id: auditorUser.id,
      audit_time: new Date(),
      source: 'web',
    },
  ]);

  console.log('[DB Init] 创建测试会员...');
  await Member.bulkCreate([
    {
      user_id: adminUser.id,
      member_no: 'VIP20250001',
      member_level: 2,
      member_status: 1,
      start_date: new Date('2025-01-01'),
      expire_date: new Date('2026-01-01'),
      auto_renew: 1,
      balance: 128.50,
      total_spent: 599.00,
      points: 3200,
      total_points: 5800,
      coupon_count: 3,
      current_plan: 'svip_year',
      plan_price: 299.00,
      plan_duration: 365,
      privileges: ['无广告', '4K画质', '独家内容', '优先客服'],
      last_active_at: new Date(),
    },
    {
      user_id: auditorUser.id,
      member_no: 'VIP20250002',
      member_level: 1,
      member_status: 1,
      start_date: new Date('2025-03-15'),
      expire_date: new Date('2025-09-15'),
      auto_renew: 0,
      balance: 35.00,
      total_spent: 198.00,
      points: 1200,
      total_points: 2400,
      coupon_count: 1,
      current_plan: 'vip_month',
      plan_price: 30.00,
      plan_duration: 30,
      privileges: ['无广告', '高清画质'],
      last_active_at: new Date(),
    },
    {
      user_id: normalUser.id,
      member_no: 'VIP20250003',
      member_level: 0,
      member_status: 0,
      start_date: new Date('2024-06-01'),
      expire_date: new Date('2024-12-01'),
      auto_renew: 0,
      balance: 0,
      total_spent: 30.00,
      points: 0,
      total_points: 500,
      coupon_count: 0,
      remark: '已过期普通用户',
    },
  ]);

  console.log('[DB Init] 创建测试消息...');
  await Message.bulkCreate([
    {
      message_type: 1,
      title: '系统维护通知',
      content: '系统将于本周六凌晨2:00-4:00进行维护升级，届时服务将暂停，请提前做好安排。',
      is_broadcast: 1,
      is_read: 0,
      priority: 1,
      push_channel: 'in_app',
      push_status: 1,
      push_time: new Date(),
    },
    {
      message_type: 3,
      title: '版权到期预警',
      content: '《流浪地球3》独家版权将于30天后到期，请及时续约或安排内容下架。',
      receiver_id: adminUser.id,
      is_read: 0,
      priority: 2,
      link_type: 'copyright',
      link_id: 1,
      push_channel: 'in_app,email',
      push_status: 1,
      push_time: new Date(),
    },
    {
      message_type: 2,
      title: '内容审核通知',
      content: '您提交的内容《新片预告》已审核通过，可正常上架展示。',
      receiver_id: auditorUser.id,
      is_read: 1,
      read_time: new Date(),
      priority: 0,
      link_type: 'content',
      link_id: 1,
      push_channel: 'in_app',
      push_status: 1,
      push_time: new Date(),
    },
    {
      message_type: 4,
      title: '春节特惠活动上线',
      content: '春节限定优惠活动已上线，VIP年费5折限时抢购！',
      is_broadcast: 1,
      is_read: 0,
      priority: 1,
      link_type: 'activity',
      link_id: 1,
      push_channel: 'in_app,push',
      push_status: 1,
      push_time: new Date(),
    },
    {
      message_type: 3,
      title: '版权侵权预警',
      content: '监测到第三方平台存在《繁花似锦》未授权播放行为，请及时处理。',
      receiver_id: adminUser.id,
      is_read: 0,
      priority: 2,
      link_type: 'copyright',
      link_id: 2,
      push_channel: 'in_app,email,sms',
      push_status: 1,
      push_time: new Date(),
    },
  ]);

  console.log('\n========================================');
  console.log('[DB Init] 数据库初始化完成!');
  console.log('[DB Init] 管理员账号: admin / admin123456');
  console.log('[DB Init] 审核员账号: auditor01 / admin123456');
  console.log('[DB Init] 普通用户: user01 / admin123456');
  console.log('========================================\n');

  process.exit(0);
};

initData().catch((err) => {
  console.error('[DB Init] 初始化失败:', err);
  process.exit(1);
});
