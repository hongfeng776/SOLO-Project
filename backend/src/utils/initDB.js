require('dotenv').config()
const { sequelize } = require('../config/database')
const { User, Role, CapacityType, Driver, Passenger, Vehicle, Order, FinanceStatement, FinanceSettlement, Coupon, RiskRule, MarketingCampaign, MarketingAuditLog, Notification, Ticket } = require('../models')
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

    await Coupon.bulkCreate([
      {
        id: 1,
        name: '新用户立减10元',
        code: 'NEWUSER10',
        type: 3,
        discount: 10.00,
        minAmount: 0.01,
        totalCount: 10000,
        usedCount: 3256,
        perLimit: 1,
        startTime: new Date('2024-01-01'),
        endTime: new Date('2025-12-31'),
        status: 1,
        description: '新用户注册即享立减10元优惠'
      },
      {
        id: 2,
        name: '满50减8',
        code: 'FULL50OFF8',
        type: 1,
        discount: 8.00,
        minAmount: 50.00,
        totalCount: 5000,
        usedCount: 1892,
        perLimit: 3,
        startTime: new Date('2024-06-01'),
        endTime: new Date('2025-06-30'),
        status: 1,
        description: '满50元立减8元，可领3次'
      },
      {
        id: 3,
        name: '8折折扣券',
        code: 'DISCOUNT80',
        type: 2,
        discount: 8.00,
        minAmount: 20.00,
        totalCount: 3000,
        usedCount: 876,
        perLimit: 2,
        startTime: new Date('2024-03-01'),
        endTime: new Date('2025-09-30'),
        status: 1,
        description: '乘车享8折优惠，最高减免15元'
      }
    ])
    console.log('优惠券数据初始化完成')

    await RiskRule.bulkCreate([
      {
        id: 1,
        name: '高频下单检测',
        code: 'HIGH_FREQ_ORDER',
        type: 3,
        category: 1,
        condition: { timeWindow: 600, maxOrders: 5 },
        threshold: 5,
        action: 2,
        severity: 3,
        status: 1,
        hitCount: 128,
        description: '同一乘客10分钟内下单超过5次视为刷单风险'
      },
      {
        id: 2,
        name: '异常价格检测',
        code: 'ABNORMAL_PRICE',
        type: 1,
        category: 5,
        condition: { deviationRate: 0.5 },
        threshold: 50,
        action: 4,
        severity: 2,
        status: 1,
        hitCount: 56,
        description: '订单实际费用与预估偏差超过50%需人工审核'
      },
      {
        id: 3,
        name: '高频取消检测',
        code: 'HIGH_FREQ_CANCEL',
        type: 3,
        category: 2,
        condition: { timeWindow: 3600, maxCancels: 5, cancelRate: 0.8 },
        threshold: 80,
        action: 1,
        severity: 2,
        status: 1,
        hitCount: 342,
        description: '1小时内取消5次以上或取消率超过80%发出警告'
      },
      {
        id: 4,
        name: '低评分司机检测',
        code: 'LOW_RATING_DRIVER',
        type: 2,
        category: 3,
        condition: { minRating: 3.5, minOrders: 20 },
        threshold: 3.5,
        action: 4,
        severity: 3,
        status: 1,
        hitCount: 23,
        description: '评分低于3.5且订单数超过20的司机需人工审核'
      }
    ])
    console.log('风控规则数据初始化完成')

    await MarketingCampaign.bulkCreate([
      {
        id: 1,
        name: '新用户首单优惠',
        code: 'NEW_USER_FIRST_2025',
        type: 1,
        scene: 1,
        couponId: 1,
        subsidyAmount: 10.00,
        maxSubsidyPerOrder: 10.00,
        discountRate: 0.9,
        budget: 100000.00,
        dailyBudget: 2000.00,
        usedBudget: 32560.00,
        startTime: new Date('2025-01-01'),
        endTime: new Date('2025-12-31'),
        targetUser: 2,
        userLevelMin: 0,
        registerDaysMax: 30,
        cities: null,
        cityTierConfig: null,
        vehicleTypes: ['快车', '专车'],
        minOrderAmount: 0,
        perUserLimit: 1,
        perDayLimit: 0,
        totalCount: 10000,
        receiveCount: 3256,
        useCount: 3180,
        mutuallyExclusive: true,
        exclusiveScenes: [2, 3, 4],
        sourceCampaignId: null,
        rules: { firstOrderOnly: true, maxSubsidy: 10 },
        status: 2,
        participantCount: 3256,
        orderCount: 3180,
        creatorId: 1,
        creatorName: '超级管理员',
        onlineTime: new Date('2025-01-01 08:00:00'),
        description: '新用户首次下单立减10元，仅限快车/专车使用'
      },
      {
        id: 2,
        name: '元旦出行红包',
        code: 'NEWYEAR_GIFT_2025',
        type: 2,
        scene: 2,
        couponId: null,
        subsidyAmount: 5.00,
        maxSubsidyPerOrder: 8.00,
        discountRate: 0.95,
        budget: 200000.00,
        dailyBudget: 5000.00,
        usedBudget: 89600.00,
        startTime: new Date('2024-12-25'),
        endTime: new Date('2025-01-15'),
        targetUser: 1,
        cities: ['北京', '上海', '广州', '深圳', '杭州', '成都'],
        cityTierConfig: JSON.stringify({
          tier1: { subsidy: 5, ceiling: 8, discount: 0.95 },
          tier2: { subsidy: 4, ceiling: 6, discount: 0.96 },
          tier3: { subsidy: 3, ceiling: 5, discount: 0.97 },
          tier4: { subsidy: 2, ceiling: 4, discount: 0.98 }
        }),
        vehicleTypes: null,
        minOrderAmount: 15,
        perUserLimit: 3,
        perDayLimit: 1,
        totalCount: 50000,
        receiveCount: 15800,
        useCount: 13200,
        mutuallyExclusive: true,
        exclusiveScenes: [1],
        sourceCampaignId: null,
        rules: { peakHours: ['07:00-09:00', '17:00-19:00'], subsidyRate: 0.2 },
        status: 2,
        participantCount: 15800,
        orderCount: 42300,
        creatorId: 2,
        creatorName: '运营管理员',
        onlineTime: new Date('2024-12-25 00:00:00'),
        description: '元旦限时活动，早晚高峰乘车享立减红包'
      },
      {
        id: 3,
        name: '日常出行普惠补贴',
        code: 'DAILY_TRAVEL_2025Q1',
        type: 3,
        scene: 3,
        couponId: null,
        subsidyAmount: 3.00,
        maxSubsidyPerOrder: 5.00,
        discountRate: null,
        budget: 500000.00,
        dailyBudget: 8000.00,
        usedBudget: 256000.00,
        startTime: new Date('2025-01-01'),
        endTime: new Date('2025-03-31'),
        targetUser: 1,
        cities: null,
        cityTierConfig: null,
        vehicleTypes: null,
        minOrderAmount: 10,
        perUserLimit: 10,
        perDayLimit: 2,
        totalCount: 200000,
        receiveCount: 56800,
        useCount: 48200,
        mutuallyExclusive: false,
        exclusiveScenes: [],
        sourceCampaignId: null,
        rules: { maxDailyPerUser: 6 },
        status: 2,
        participantCount: 42600,
        orderCount: 98500,
        creatorId: 2,
        creatorName: '运营管理员',
        onlineTime: new Date('2025-01-01 00:00:00'),
        description: '日常出行普惠补贴，全量用户每日可享2次立减'
      },
      {
        id: 4,
        name: '流失用户召回礼包',
        code: 'RECALL_2025_JAN',
        type: 4,
        scene: 4,
        couponId: null,
        subsidyAmount: 20.00,
        maxSubsidyPerOrder: 25.00,
        discountRate: 0.85,
        budget: 150000.00,
        dailyBudget: 2500.00,
        usedBudget: 68900.00,
        startTime: new Date('2025-01-15'),
        endTime: new Date('2025-02-28'),
        targetUser: 4,
        userLevelMin: 0,
        inactiveDays: 30,
        cities: ['北京', '上海', '广州', '深圳'],
        cityTierConfig: null,
        vehicleTypes: null,
        minOrderAmount: 0,
        perUserLimit: 1,
        perDayLimit: 0,
        totalCount: 10000,
        receiveCount: 5200,
        useCount: 3800,
        mutuallyExclusive: true,
        exclusiveScenes: [1, 3],
        sourceCampaignId: null,
        rules: { mustInactiveDays: 30, validDays: 15 },
        status: 1,
        participantCount: 5200,
        orderCount: 3800,
        creatorId: 1,
        creatorName: '超级管理员',
        onlineTime: null,
        description: '30天未出行用户回归专享大礼包，首单立减20元'
      },
      {
        id: 5,
        name: '春节出行红包',
        code: 'SPRING_FESTIVAL_2025',
        type: 2,
        scene: 2,
        couponId: null,
        subsidyAmount: 8.00,
        maxSubsidyPerOrder: 12.00,
        discountRate: 0.92,
        budget: 300000.00,
        dailyBudget: 15000.00,
        usedBudget: 0.00,
        startTime: new Date('2025-01-20'),
        endTime: new Date('2025-02-10'),
        targetUser: 1,
        cities: null,
        cityTierConfig: JSON.stringify({
          tier1: { subsidy: 10, ceiling: 15, discount: 0.9 },
          tier2: { subsidy: 8, ceiling: 12, discount: 0.92 },
          tier3: { subsidy: 6, ceiling: 8, discount: 0.94 },
          tier4: { subsidy: 5, ceiling: 6, discount: 0.95 }
        }),
        vehicleTypes: null,
        minOrderAmount: 20,
        perUserLimit: 5,
        perDayLimit: 1,
        totalCount: 80000,
        receiveCount: 0,
        useCount: 0,
        mutuallyExclusive: true,
        exclusiveScenes: [3, 4],
        sourceCampaignId: 2,
        rules: { usableDays: ['除夕', '初一', '初二', '初三', '初四', '初五', '初六'] },
        status: 1,
        participantCount: 0,
        orderCount: 0,
        creatorId: 2,
        creatorName: '运营管理员',
        onlineTime: null,
        description: '春节出行七天乐，天天有红包'
      },
      {
        id: 6,
        name: '高价值用户专属福利',
        code: 'VIP_BENEFIT_JAN',
        type: 3,
        scene: 3,
        couponId: null,
        subsidyAmount: 15.00,
        maxSubsidyPerOrder: 20.00,
        discountRate: null,
        budget: 80000.00,
        dailyBudget: 1500.00,
        usedBudget: 0,
        startTime: new Date('2025-02-01'),
        endTime: new Date('2025-02-28'),
        targetUser: 5,
        userLevelMin: 5,
        cities: null,
        vehicleTypes: ['专车', '豪华车'],
        minOrderAmount: 50,
        perUserLimit: 4,
        perDayLimit: 1,
        totalCount: 5000,
        receiveCount: 0,
        useCount: 0,
        mutuallyExclusive: false,
        exclusiveScenes: [],
        sourceCampaignId: null,
        rules: { minLevel: 5 },
        status: 0,
        participantCount: 0,
        orderCount: 0,
        creatorId: 2,
        creatorName: '运营管理员',
        onlineTime: null,
        description: '高价值VIP用户专享福利，每月4次立减机会'
      }
    ])
    console.log('营销活动数据初始化完成')

    await MarketingAuditLog.bulkCreate([
      {
        id: 1,
        campaignId: 1,
        action: 'create',
        actionLabel: '创建活动',
        operatorId: 1,
        operatorName: '超级管理员',
        operatorRole: 'super_admin',
        ipAddress: '127.0.0.1',
        beforeData: null,
        afterData: JSON.stringify({ name: '新用户首单优惠', subsidyAmount: 10, budget: 100000 }),
        diffFields: JSON.stringify([
          { field: 'name', before: null, after: '新用户首单优惠', type: 'added' },
          { field: 'subsidyAmount', before: null, after: 10, type: 'added' },
          { field: 'budget', before: null, after: 100000, type: 'added' }
        ]),
        riskLevel: 0,
        validateResult: JSON.stringify({ valid: true, errors: [], warnings: [], passed: ['基础参数校验通过', '场景规则校验通过'] }),
        remark: '活动创建并自动校验通过',
        createdAt: new Date('2025-01-01 09:30:00')
      },
      {
        id: 2,
        campaignId: 1,
        action: 'online',
        actionLabel: '上线活动',
        operatorId: 1,
        operatorName: '超级管理员',
        operatorRole: 'super_admin',
        ipAddress: '127.0.0.1',
        beforeData: JSON.stringify({ status: 0 }),
        afterData: JSON.stringify({ status: 2 }),
        diffFields: JSON.stringify([
          { field: 'status', before: 0, after: 2, type: 'modified', beforeLabel: '草稿', afterLabel: '进行中' }
        ]),
        riskLevel: 0,
        validateResult: JSON.stringify({ valid: true, errors: [], warnings: [], passed: ['时段冲突检测通过', '预算充足', '人群规则合法'] }),
        remark: '活动上线审核通过',
        createdAt: new Date('2025-01-01 10:00:00')
      },
      {
        id: 3,
        campaignId: 2,
        action: 'update',
        actionLabel: '修改活动',
        operatorId: 2,
        operatorName: '运营管理员',
        operatorRole: 'operation_admin',
        ipAddress: '10.0.0.5',
        beforeData: JSON.stringify({ dailyBudget: 3000, perUserLimit: 1 }),
        afterData: JSON.stringify({ dailyBudget: 5000, perUserLimit: 3 }),
        diffFields: JSON.stringify([
          { field: 'dailyBudget', before: 3000, after: 5000, type: 'modified' },
          { field: 'perUserLimit', before: 1, after: 3, type: 'modified' }
        ]),
        riskLevel: 1,
        validateResult: JSON.stringify({
          valid: true,
          errors: [],
          warnings: [{ field: 'perUserLimit', message: '单用户领取次数较高，请注意风控' }],
          passed: ['预算比例正常', '参数更新合规']
        }),
        remark: '调整日预算和领取次数',
        createdAt: new Date('2024-12-26 14:20:00')
      },
      {
        id: 4,
        campaignId: 5,
        action: 'copy',
        actionLabel: '复制活动',
        operatorId: 2,
        operatorName: '运营管理员',
        operatorRole: 'operation_admin',
        ipAddress: '10.0.0.5',
        beforeData: null,
        afterData: JSON.stringify({ name: '春节出行红包', sourceCampaignId: 2 }),
        diffFields: JSON.stringify([
          { field: 'name', before: '元旦出行红包', after: '春节出行红包', type: 'modified' },
          { field: 'startTime', before: '2024-12-25', after: '2025-01-20', type: 'modified' },
          { field: 'sourceCampaignId', before: null, after: 2, type: 'added' }
        ]),
        riskLevel: 0,
        validateResult: JSON.stringify({ valid: true, errors: [], warnings: [], passed: ['复制活动校验通过', '继承原活动规则配置'] }),
        remark: '基于「元旦出行红包」复制创建春节活动',
        createdAt: new Date('2025-01-05 16:45:00')
      },
      {
        id: 5,
        campaignId: 6,
        action: 'validate',
        actionLabel: '高风险拦截',
        operatorId: 2,
        operatorName: '运营管理员',
        operatorRole: 'operation_admin',
        ipAddress: '10.0.0.5',
        beforeData: JSON.stringify({ subsidyAmount: 50, maxSubsidyPerOrder: 80 }),
        afterData: JSON.stringify({ subsidyAmount: 15, maxSubsidyPerOrder: 20 }),
        diffFields: JSON.stringify([
          { field: 'subsidyAmount', before: 50, after: 15, type: 'modified' },
          { field: 'maxSubsidyPerOrder', before: 80, after: 20, type: 'modified' }
        ]),
        riskLevel: 3,
        validateResult: JSON.stringify({
          valid: false,
          errors: [
            { field: 'subsidyAmount', message: '补贴金额超过场景最大限制50元', rule: 'travel_subsidy_max_20' },
            { field: 'maxSubsidyPerOrder', message: '单笔封顶超过出行补贴场景阈值', rule: 'ceiling_exceed_scene_limit' }
          ],
          warnings: [{ field: 'perUserLimit', message: '建议设置单用户上限' }],
          passed: ['时段合法', '人群配置合法']
        }),
        remark: '系统自动拦截违规补贴额度配置，已要求调整至合规范围',
        createdAt: new Date('2025-01-20 11:05:00')
      }
    ])
    console.log('营销审计日志数据初始化完成')

    await Notification.bulkCreate([
      {
        id: 1,
        title: '系统升级通知',
        content: '平台将于2024年12月20日23:00-次日02:00进行系统升级维护，届时部分功能暂不可用，请提前做好安排。',
        type: 1,
        targetType: 1,
        targetId: null,
        senderId: 1,
        senderName: '超级管理员',
        priority: 2,
        isRead: 0,
        bizType: 'system',
        bizId: null
      },
      {
        id: 2,
        title: '风控告警：高频下单',
        content: '乘客ID1003在10分钟内连续下单5次，已触发高频下单风控规则，系统已自动拦截后续下单请求。',
        type: 3,
        targetType: 2,
        targetId: 2,
        senderId: null,
        senderName: '系统',
        priority: 3,
        isRead: 0,
        bizType: 'risk',
        bizId: 1
      },
      {
        id: 3,
        title: '结算单审批通知',
        content: '司机张伟提交了本周结算单，金额¥2,580.00，请及时审批。',
        type: 4,
        targetType: 2,
        targetId: 3,
        senderId: null,
        senderName: '系统',
        priority: 2,
        isRead: 0,
        bizType: 'finance',
        bizId: 1
      }
    ])
    console.log('通知数据初始化完成')

    await Ticket.bulkCreate([
      {
        id: 1,
        ticketNo: `TK${Date.now()}0001`,
        orderId: 1,
        orderNo: orders[0]?.orderNo || '',
        passengerId: 1,
        passengerName: '小红',
        passengerPhone: '13800000010',
        driverId: 1,
        driverName: '张伟',
        type: 1,
        priority: 3,
        status: 1,
        category: '服务投诉',
        content: '司机态度恶劣，拒接电话且中途要求加价',
        handleResult: null,
        handlerId: null,
        handlerName: null,
        handleTime: null,
        remark: null
      },
      {
        id: 2,
        ticketNo: `TK${Date.now()}0002`,
        orderId: 2,
        orderNo: orders[1]?.orderNo || '',
        passengerId: 2,
        passengerName: '小明',
        passengerPhone: '13800000011',
        driverId: null,
        driverName: null,
        type: 2,
        priority: 2,
        status: 2,
        category: '费用争议',
        content: '实际费用与预估费用差异过大，要求退还差价',
        handleResult: null,
        handlerId: 2,
        handlerName: '运营管理员',
        handleTime: null,
        remark: '已联系司机核实路线'
      }
    ])
    console.log('客服工单数据初始化完成')

    console.log('\n✅ 数据库初始化完成！')
    console.log('默认账号：admin / 123456')

    process.exit(0)
  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

initDB()
