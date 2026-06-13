require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User');

const initDatabase = async () => {
  try {
    console.log('开始初始化数据库...');

    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ force: false });
    console.log('数据表同步完成');

    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (adminExists) {
      console.log('管理员账号已存在，跳过创建');
    } else {
      await User.create({
        username: 'admin',
        password: 'admin123',
        nickname: '系统管理员',
        email: 'admin@hongjing.com',
        role: 'admin',
        status: 1
      });
      console.log('默认管理员账号创建成功');
      console.log('用户名: admin');
      console.log('密码: admin123');
    }

    console.log('数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    process.exit(1);
  }
};

initDatabase();
