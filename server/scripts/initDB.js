require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');
const OperationLog = require('../models/OperationLog');
const SilhouetteMaterial = require('../models/SilhouetteMaterial');
const VisualTemplate = require('../models/VisualTemplate');

async function initDB() {
  try {
    console.log('正在连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功');

    console.log('正在同步数据表...');
    await sequelize.sync({ force: true });
    console.log('数据表同步完成');

    console.log('正在创建默认管理员账号...');
    await User.create({
      username: 'admin',
      password: 'admin123',
      nickname: '超级管理员',
      role: 'admin',
      status: 1
    });
    console.log('默认管理员账号创建成功');
    console.log('用户名: admin');
    console.log('密码: admin123');

    console.log('数据库初始化完成！');
    process.exit(0);
  } catch (err) {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  }
}

initDB();
