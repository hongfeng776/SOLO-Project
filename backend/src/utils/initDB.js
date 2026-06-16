require('dotenv').config()
const { sequelize } = require('../config/database')
const { User, Role, CapacityType, Driver, Passenger, Vehicle, Order, FinanceStatement, FinanceSettlement } = require('../models')
const { hashPassword } = require('../utils/jwt')

const initDB = async () => {
  try {
    console.log('开始初始化数据库...')

    await sequelize.sync({ force: true })
    console.log('数据库表创建完成')

    const hashedPassword = await hashPassword('123456')

    await Role.bulkCreate([
      { id: 1, name: '超级管理员', code: 'super_admin', description: '拥有系统所有权限', status: 1, sort: 1 },
      { id: 2, name: '运营管理员', code: 'operation_admin', description: '负责订单、运力等运营管理', status: 1, sort: 2 },
      { id: 3, name: '财务管理员', code: 'finance_admin', description: '负责财务对账和结算', status: 1, sort: 3 },
      { id: 4, name: '客服人员', code: 'customer_service', description: '处理用户投诉和咨询', status: 1, sort: 4 }
    ])
    console.log('角色数据初始化完成')

    await User.bulkCreate([
      {
        id: 1,
        username: 'admin',
        password: hashedPassword,
        nickname: '超级管理员',
        phone: '13800138000',
        email: 'admin@cxzl.com',
        roleId: 1,
        role: 'super_admin',
        status: 1,
        avatar: ''
      },
      {
        id: 2,
        username: 'operator',
        password: hashedPassword,
        nickname: '运营管理员',
        phone: '13800138001',
        email: 'operator@cxzl.com',
        roleId: 2,
        role: 'operation_admin',
        status: 1,
        avatar: ''
      }
    ])
    console.log('用户数据初始化完成')

    await CapacityType.bulkCreate([
      { id: 1, name: '快车', code: 'express', basePrice: 12, perKmPrice: 2.5, perMinPrice: 0.5, minCharge: 12, description: '经济实惠的打车选择', status: 1, sort: 1 },
      { id: 2, name: '专车', code: 'premium', basePrice: 20, perKmPrice: 4.5, perMinPrice: 0.8, minCharge: 20, description: '舒适型专车，服务更优', status: 1, sort: 2 },
      { id: 3, name: '豪华车', code: 'luxury', basePrice: 50, perKmPrice: 8.0, perMinPrice: 1.5, minCharge: 50, description: '高端豪华车型，尊享服务', status: 1, sort: 3 },
      { id: 4, name: '拼车', code: 'carpool', basePrice: 8, perKmPrice: 1.5, perMinPrice: 0.3, minCharge: 8, description: '经济拼车，与他人共享', status: 1, sort: 4 },
      { id: 5, name: '出租车', code: 'taxi', basePrice: 13, perKmPrice: 2.3, perMinPrice: 0.5, minCharge: 13, description: '巡游出租车', status: 1, sort: 5 }
    ])
    console.log('运力类型数据初始化完成')

    const drivers = []
    const driverNames = ['张伟', '王强', '李明', '刘洋', '陈杰', '杨军', '黄勇', '周涛', '吴刚', '郑华']
    for (let i = 0; i < 10; i++) {
      drivers.push({
        id: i + 1,
        name: driverNames[i],
        phone: `13900${String(i + 1).padStart(6, '0')}`,
        idCard: `1101011990${String(i + 1).padStart(4, '0')}000${i + 1}`,
        avatar: '',
        driverLicenseNo: `1101012015${String(i + 1).padStart(6, '0')}`,
        status: i < 5 ? 1 : i < 8 ? 0 : 2,
        auditStatus: i < 8 ? 1 : i < 9 ? 0 : 2,
        totalOrders: Math.floor(Math.random() * 500) + 100,
        totalIncome: (Math.random() * 50000 + 10000).toFixed(2),
        balance: (Math.random() * 5000 + 500).toFixed(2),
        rating: (4.5 + Math.random() * 0.5).toFixed(1),
        registerTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
      })
    }
    await Driver.bulkCreate(drivers)
    console.log('司机数据初始化完成')

    const vehicles = []
    const carBrands = ['大众', '丰田', '本田', '别克', '现代', '日产', '福特', '雪佛兰']
    const carModels = ['朗逸', '卡罗拉', '雅阁', '英朗', '伊兰特', '轩逸', '福克斯', '科鲁兹']
    const colors = ['黑色', '白色', '银色', '灰色', '蓝色']
    for (let i = 0; i < 10; i++) {
      vehicles.push({
        id: i + 1,
        plateNumber: `京A${String(Math.floor(Math.random() * 90000) + 10000)}`,
        brand: carBrands[i % carBrands.length],
        model: carModels[i % carModels.length],
        color: colors[i % colors.length],
        capacityType: i < 5 ? 1 : 2,
        seats: 5,
        vehicleImg: '',
        registrationDate: new Date(Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000),
        inspectionDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
        insuranceDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
        status: i < 8 ? 1 : 0,
        auditStatus: i < 8 ? 1 : 0,
        driverId: i < 8 ? i + 1 : null,
        driverName: i < 8 ? driverNames[i] : null
      })
    }
    await Vehicle.bulkCreate(vehicles)
    console.log('车辆数据初始化完成')

    const passengers = []
    const passengerNames = ['小红', '小明', '小丽', '小刚', '小美', '小强', '小雪', '小磊', '小芳', '小辉']
    for (let i = 0; i < 15; i++) {
      passengers.push({
        id: i + 1,
        nickname: `${passengerNames[i % passengerNames.length]}${i > 9 ? i : ''}`,
        phone: `13800${String(i + 10).padStart(6, '0')}`,
        avatar: '',
        gender: i % 2 === 0 ? 1 : 2,
        totalOrders: Math.floor(Math.random() * 200) + 20,
        totalSpend: (Math.random() * 10000 + 1000).toFixed(2),
        balance: (Math.random() * 500 + 50).toFixed(2),
        rating: (4.5 + Math.random() * 0.5).toFixed(1),
        status: 1,
        registerTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
      })
    }
    await Passenger.bulkCreate(passengers)
    console.log('乘客数据初始化完成')

    const orders = []
    const statuses = [1, 2, 3, 4, 5, 6]
    const addresses = [
      '北京市朝阳区望京SOHO',
      '北京市海淀区中关村',
      '北京市东城区王府井',
      '北京市西城区金融街',
      '北京市丰台区丽泽',
      '北京市通州区万达',
      '北京市大兴区亦庄',
      '北京市昌平区回龙观'
    ]
    for (let i = 0; i < 30; i++) {
      const status = statuses[i % statuses.length]
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      const acceptTime = new Date(startTime.getTime() + Math.random() * 10 * 60 * 1000)
      const pickupTime = new Date(acceptTime.getTime() + Math.random() * 15 * 60 * 1000)
      const completeTime = new Date(pickupTime.getTime() + (Math.random() * 40 + 10) * 60 * 1000)
      const distance = (Math.random() * 20 + 2).toFixed(1)
      const price = (distance * 2.5 + 12 + Math.random() * 10).toFixed(2)

      orders.push({
        id: i + 1,
        orderNo: `DD${Date.now()}${String(i).padStart(4, '0')}`,
        passengerId: (i % 15) + 1,
        passengerName: `${passengerNames[i % passengerNames.length]}`,
        passengerPhone: `13800${String((i % 15) + 10).padStart(6, '0')}`,
        driverId: status >= 2 ? (i % 8) + 1 : null,
        driverName: status >= 2 ? driverNames[i % driverNames.length] : null,
        driverPhone: status >= 2 ? `13900${String((i % 8) + 1).padStart(6, '0')}` : null,
        vehicleId: status >= 2 ? (i % 8) + 1 : null,
        vehiclePlate: status >= 2 ? vehicles[i % 8].plateNumber : null,
        capacityType: i % 5 + 1,
        startAddress: addresses[i % addresses.length],
        startLng: (116.3 + Math.random() * 0.5).toFixed(6),
        startLat: (39.9 + Math.random() * 0.3).toFixed(6),
        endAddress: addresses[(i + 3) % addresses.length],
        endLng: (116.3 + Math.random() * 0.5).toFixed(6),
        endLat: (39.9 + Math.random() * 0.3).toFixed(6),
        distance: distance,
        duration: Math.floor(distance * 4 + 10),
        estimatedPrice: price,
        actualPrice: status === 5 ? price : null,
        status: status,
        acceptTime: status >= 2 ? acceptTime : null,
        pickupTime: status >= 3 ? pickupTime : null,
        completeTime: status === 5 ? completeTime : null,
        cancelTime: status === 6 ? new Date(acceptTime.getTime() + 5 * 60 * 1000) : null,
        cancelReason: status === 6 ? '乘客取消' : null,
        createTime: startTime
      })
    }
    await Order.bulkCreate(orders)
    console.log('订单数据初始化完成')

    const statements = []
    for (let i = 0; i < 20; i++) {
      statements.push({
        id: i + 1,
        statementNo: `S${Date.now()}${String(i).padStart(4, '0')}`,
        orderNo: orders[i]?.orderNo || '',
        type: i % 4 + 1,
        amount: ((Math.random() * 100 + 10) * (i % 2 === 0 ? 1 : -1)).toFixed(2),
        balance: (Math.random() * 5000 + 1000).toFixed(2),
        relatedId: Math.floor(Math.random() * 10) + 1,
        relatedType: 'order',
        accountType: 1,
        accountId: (i % 10) + 1,
        remark: i % 2 === 0 ? '订单收入' : '订单支出',
        createTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      })
    }
    await FinanceStatement.bulkCreate(statements)
    console.log('财务流水数据初始化完成')

    const settlements = []
    for (let i = 0; i < 5; i++) {
      settlements.push({
        id: i + 1,
        settlementNo: `JS${Date.now()}${String(i).padStart(4, '0')}`,
        driverId: i + 1,
        driverName: driverNames[i],
        driverPhone: `13900${String(i + 1).padStart(6, '0')}`,
        totalAmount: (Math.random() * 5000 + 1000).toFixed(2),
        orderCount: Math.floor(Math.random() * 50) + 20,
        status: i < 3 ? 1 : 0,
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        settleTime: i < 3 ? new Date() : null,
        createTime: new Date()
      })
    }
    await FinanceSettlement.bulkCreate(settlements)
    console.log('结算单数据初始化完成')

    console.log('\n✅ 数据库初始化完成！')
    console.log('默认账号：admin / 123456')

    process.exit(0)
  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

initDB()
