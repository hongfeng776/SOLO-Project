require('dotenv').config();

const { sequelize } = require('../config/db');
const { encrypt } = require('../utils/password');

const Role = require('../models/Role');
const User = require('../models/User');
const Flight = require('../models/Flight');
const Hotel = require('../models/Hotel');
const Car = require('../models/Car');
const Ticket = require('../models/Ticket');
const Order = require('../models/Order');
const Merchant = require('../models/Merchant');

const initDB = async () => {
  try {
    console.log('开始初始化数据库...');

    await sequelize.authenticate();
    console.log('数据库连接成功！');

    await sequelize.sync({ force: true });
    console.log('表结构同步完成！');

    const adminRole = await Role.create({
      name: '超级管理员',
      code: 'admin',
      description: '拥有所有权限',
      permissions: JSON.stringify(['*'])
    });
    console.log('创建角色：超级管理员');

    const userRole = await Role.create({
      name: '普通用户',
      code: 'user',
      description: '普通用户权限',
      permissions: JSON.stringify(['user:view', 'order:*'])
    });
    console.log('创建角色：普通用户');

    const merchantRole = await Role.create({
      name: '商家',
      code: 'merchant',
      description: '商家权限',
      permissions: JSON.stringify(['product:*', 'order:view'])
    });
    console.log('创建角色：商家');

    const hashedPassword = await encrypt('123456');
    await User.create({
      username: 'admin',
      password: hashedPassword,
      nickname: '超级管理员',
      roleId: adminRole.id,
      status: 1,
      avatar: ''
    });
    console.log('创建默认管理员账户：admin/123456');

    const merchant = await Merchant.create({
      name: '测试商家',
      contact: '张先生',
      phone: '13800138000',
      address: '北京市朝阳区',
      auditStatus: 1,
      businessLicense: ''
    });
    console.log('创建测试商家');

    await Flight.bulkCreate([
      {
        flightNo: 'CA1234',
        airline: '中国国航',
        departure: '北京',
        arrival: '上海',
        departureTime: new Date('2024-06-20 08:00:00'),
        arrivalTime: new Date('2024-06-20 10:30:00'),
        price: 680.00,
        seats: 100,
        status: 1
      },
      {
        flightNo: 'MU5678',
        airline: '东方航空',
        departure: '北京',
        arrival: '广州',
        departureTime: new Date('2024-06-20 14:00:00'),
        arrivalTime: new Date('2024-06-20 17:00:00'),
        price: 890.00,
        seats: 150,
        status: 1
      }
    ]);
    console.log('创建测试机票数据');

    await Hotel.bulkCreate([
      {
        name: '北京五星大酒店',
        address: '北京市朝阳区建国路88号',
        star: 5,
        price: 588.00,
        rooms: 50,
        status: 1,
        merchantId: merchant.id
      },
      {
        name: '上海商务酒店',
        address: '上海市浦东新区陆家嘴',
        star: 4,
        price: 388.00,
        rooms: 80,
        status: 1,
        merchantId: merchant.id
      }
    ]);
    console.log('创建测试酒店数据');

    await Car.bulkCreate([
      {
        brand: '丰田',
        model: '凯美瑞',
        plateNo: '京A12345',
        pricePerDay: 288.00,
        status: 1,
        merchantId: merchant.id
      },
      {
        brand: '奔驰',
        model: 'E300',
        plateNo: '京B67890',
        pricePerDay: 588.00,
        status: 1,
        merchantId: merchant.id
      }
    ]);
    console.log('创建测试租车数据');

    await Ticket.bulkCreate([
      {
        name: '故宫博物院门票',
        scenicSpot: '故宫博物院',
        price: 60.00,
        stock: 1000,
        status: 1,
        merchantId: merchant.id
      },
      {
        name: '长城门票',
        scenicSpot: '八达岭长城',
        price: 45.00,
        stock: 2000,
        status: 1,
        merchantId: merchant.id
      }
    ]);
    console.log('创建测试票务数据');

    console.log('\n========================================');
    console.log('数据库初始化完成！');
    console.log('默认管理员账户：admin / 123456');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

initDB();
