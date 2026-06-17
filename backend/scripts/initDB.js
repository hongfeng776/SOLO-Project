require('dotenv').config();

const { sequelize } = require('../config/db');
const { encrypt } = require('../utils/password');

const Role = require('../models/Role')
const User = require('../models/User')
const Flight = require('../models/Flight')
const Hotel = require('../models/Hotel')
const Car = require('../models/Car')
const Ticket = require('../models/Ticket')
const Order = require('../models/Order')
const Merchant = require('../models/Merchant')
const BusinessTravel = require('../models/BusinessTravel')
const Coupon = require('../models/Coupon')
const OrderLog = require('../models/OrderLog')
const Approval = require('../models/Approval')
const PaymentFlow = require('../models/PaymentFlow')
const PaymentDeduction = require('../models/PaymentDeduction')
const PaymentFee = require('../models/PaymentFee')

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

    const operatorRole = await Role.create({
      name: '运营人员',
      code: 'operator',
      description: '普通运营人员权限',
      permissions: JSON.stringify(['order:view', 'order:edit', 'order:confirm'])
    });
    console.log('创建角色：运营人员');

    const riskOperatorRole = await Role.create({
      name: '风控人员',
      code: 'risk_operator',
      description: '风控人员权限',
      permissions: JSON.stringify(['order:view', 'order:abnormal'])
    });
    console.log('创建角色：风控人员');

    const hashedPassword = await encrypt('123456');
    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      nickname: '超级管理员',
      roleId: adminRole.id,
      status: 1,
      avatar: '',
      phone: '13800000000'
    });
    console.log('创建默认管理员账户：admin/123456');

    const normalUser = await User.create({
      username: 'user1',
      password: hashedPassword,
      nickname: '测试用户',
      roleId: userRole.id,
      status: 1,
      avatar: '',
      phone: '13800001111'
    });
    console.log('创建测试用户：user1/123456');

    const operatorUser = await User.create({
      username: 'operator1',
      password: hashedPassword,
      nickname: '运营专员小王',
      roleId: operatorRole.id,
      status: 1,
      avatar: '',
      phone: '13800002222'
    });
    console.log('创建运营人员：operator1/123456');

    const riskOperatorUser = await User.create({
      username: 'risk1',
      password: hashedPassword,
      nickname: '风控专员小李',
      roleId: riskOperatorRole.id,
      status: 1,
      avatar: '',
      phone: '13800003333'
    });
    console.log('创建风控人员：risk1/123456');

    const merchant = await Merchant.create({
      name: '测试商家',
      contact: '张先生',
      phone: '13800138000',
      address: '北京市朝阳区',
      auditStatus: 1,
      businessLicense: 'https://example.com/license.jpg',
      violationLevel: 0,
      violationCount: 0,
      businessType: 'flight',
      status: 1,
      email: 'merchant@example.com',
      scope: '机票、酒店预订',
      settledAt: new Date()
    });
    console.log('创建测试商家');

    const merchant2 = await Merchant.create({
      name: '租车服务商',
      contact: '李女士',
      phone: '13900139000',
      address: '上海市浦东新区',
      auditStatus: 1,
      businessLicense: 'https://example.com/license2.jpg',
      violationLevel: 0,
      violationCount: 0,
      businessType: 'car',
      status: 1,
      email: 'car@example.com',
      scope: '自驾租车、商务用车',
      settledAt: new Date()
    });
    console.log('创建租车商家');

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
        merchantId: merchant2.id
      },
      {
        brand: '奔驰',
        model: 'E300',
        plateNo: '京B67890',
        pricePerDay: 588.00,
        status: 1,
        merchantId: merchant2.id
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

    const now = new Date()
    const createDate = (offsetMinutes) => new Date(now.getTime() + offsetMinutes * 60 * 1000)

    await Order.bulkCreate([
      {
        orderNo: 'ORD20240620001',
        userId: normalUser.id,
        category: 'flight',
        productId: 1,
        productName: 'CA1234 北京-上海',
        amount: 680.00,
        contactName: '测试用户',
        contactPhone: '13800001111',
        quantity: 1,
        unitPrice: 680.00,
        status: 1,
        payTime: createDate(-60),
        merchantId: merchant.id,
        source: 'app',
        isAbnormal: 0,
        isLocked: 1,
        lockReason: '支付成功，履约锁定',
        lockTime: createDate(-60),
        archiveStatus: 0,
        paymentMode: 'instant',
        paymentChannel: 'wechat',
        paymentExpireTime: createDate(-30),
        paidAmount: 680.00,
        remainingAmount: 0.00,
        installmentCount: null,
        isHighPriority: 0,
        paymentTimeoutExempt: 0,
        lastRemindTime: null,
        remindCount: 0
      },
      {
        orderNo: 'ORD20240620002',
        userId: normalUser.id,
        category: 'hotel',
        productId: 1,
        productName: '北京五星大酒店',
        amount: 588.00,
        contactName: '测试用户',
        contactPhone: '13800001111',
        quantity: 1,
        unitPrice: 588.00,
        status: 0,
        merchantId: merchant.id,
        source: 'wechat',
        isAbnormal: 0,
        isLocked: 0,
        archiveStatus: 0,
        paymentMode: null,
        paymentChannel: null,
        paymentExpireTime: createDate(25),
        paidAmount: 0.00,
        remainingAmount: 588.00,
        installmentCount: null,
        isHighPriority: 0,
        paymentTimeoutExempt: 0,
        lastRemindTime: createDate(-120),
        remindCount: 1
      },
      {
        orderNo: 'ORD20240620003',
        userId: normalUser.id,
        category: 'car',
        productId: 1,
        productName: '丰田凯美瑞',
        amount: 864.00,
        contactName: '测试用户',
        contactPhone: '13800001111',
        quantity: 3,
        unitPrice: 288.00,
        status: 1,
        payTime: createDate(-40),
        merchantId: merchant2.id,
        source: 'web',
        isAbnormal: 0,
        isLocked: 1,
        lockReason: '支付成功，履约锁定',
        lockTime: createDate(-40),
        archiveStatus: 0,
        paymentMode: 'instant',
        paymentChannel: 'alipay',
        paymentExpireTime: createDate(-10),
        paidAmount: 864.00,
        remainingAmount: 0.00,
        installmentCount: null,
        isHighPriority: 0,
        paymentTimeoutExempt: 0,
        lastRemindTime: null,
        remindCount: 0
      },
      {
        orderNo: 'ORD20240620004',
        userId: normalUser.id,
        category: 'ticket',
        productId: 1,
        productName: '故宫博物院门票',
        amount: 120.00,
        contactName: '测试用户',
        contactPhone: '13800001111',
        quantity: 2,
        unitPrice: 60.00,
        status: 4,
        payTime: createDate(-180),
        merchantId: merchant.id,
        source: 'offline',
        isAbnormal: 0,
        isLocked: 0,
        archiveStatus: 0,
        paymentMode: 'instant',
        paymentChannel: 'balance',
        paymentExpireTime: createDate(-150),
        paidAmount: 120.00,
        remainingAmount: 0.00,
        installmentCount: null,
        isHighPriority: 0,
        paymentTimeoutExempt: 0,
        lastRemindTime: null,
        remindCount: 0
      },
      {
        orderNo: 'ORD20240620005',
        userId: normalUser.id,
        category: 'flight',
        productId: 2,
        productName: 'MU5678 北京-广州',
        amount: 890.00,
        contactName: '测试用户',
        contactPhone: '13800001111',
        quantity: 1,
        unitPrice: 890.00,
        status: 3,
        payTime: createDate(-200),
        merchantId: merchant.id,
        source: 'third_party',
        isAbnormal: 0,
        isLocked: 0,
        archiveStatus: 0,
        paymentMode: 'instant',
        paymentChannel: 'unionpay',
        paymentExpireTime: createDate(-170),
        paidAmount: 890.00,
        remainingAmount: 0.00,
        installmentCount: null,
        isHighPriority: 0,
        paymentTimeoutExempt: 0,
        lastRemindTime: null,
        remindCount: 0
      },
      {
        orderNo: 'ORD20240620006',
        userId: normalUser.id,
        category: 'hotel',
        productId: 2,
        productName: '上海商务酒店',
        amount: 776.00,
        contactName: '测试用户',
        contactPhone: '13800001111',
        quantity: 2,
        unitPrice: 388.00,
        status: 1,
        payTime: createDate(-90),
        merchantId: merchant.id,
        source: 'app',
        isAbnormal: 1,
        abnormalReason: '价格异常，低于市场价30%',
        isLocked: 1,
        lockReason: '支付成功，履约锁定',
        lockTime: createDate(-90),
        archiveStatus: 0,
        paymentMode: 'instant',
        paymentChannel: 'credit_card',
        paymentExpireTime: createDate(-60),
        paidAmount: 776.00,
        remainingAmount: 0.00,
        installmentCount: null,
        isHighPriority: 1,
        paymentTimeoutExempt: 0,
        lastRemindTime: null,
        remindCount: 0
      },
      {
        orderNo: 'ORD20240620007',
        userId: normalUser.id,
        category: 'flight',
        productId: 1,
        productName: 'CA1234 北京-上海',
        amount: 680.00,
        contactName: '测试用户',
        contactPhone: '13800001111',
        quantity: 1,
        unitPrice: 680.00,
        status: 2,
        merchantId: merchant.id,
        source: 'wechat',
        isAbnormal: 0,
        isLocked: 0,
        archiveStatus: 1,
        archiveTime: createDate(-300),
        paymentMode: null,
        paymentChannel: null,
        paymentExpireTime: createDate(-280),
        paidAmount: 0.00,
        remainingAmount: 680.00,
        installmentCount: null,
        isHighPriority: 0,
        paymentTimeoutExempt: 0,
        lastRemindTime: createDate(-290),
        remindCount: 2
      },
      {
        orderNo: 'ORD20240620008',
        userId: normalUser.id,
        category: 'car',
        productId: 2,
        productName: '奔驰E300',
        amount: 1764.00,
        contactName: '测试用户',
        contactPhone: '13800001111',
        quantity: 3,
        unitPrice: 588.00,
        status: 1,
        payTime: createDate(-100),
        merchantId: merchant2.id,
        source: 'app',
        isAbnormal: 0,
        isLocked: 1,
        lockReason: '核心字段变更自动锁定：amount',
        lockTime: createDate(-50),
        archiveStatus: 0,
        paymentMode: 'installment',
        paymentChannel: 'credit_card',
        paymentExpireTime: createDate(60 * 24 * 30),
        paidAmount: 1764.00,
        remainingAmount: 0.00,
        installmentCount: 3,
        isHighPriority: 0,
        paymentTimeoutExempt: 0,
        lastRemindTime: null,
        remindCount: 0
      }
    ])
    console.log('创建测试订单数据')

    await BusinessTravel.bulkCreate([
      {
        title: '北京-上海商务出行方案',
        userId: normalUser.id,
        contactName: '测试用户',
        contactPhone: '13800001111',
        departureCity: '北京',
        arrivalCity: '上海',
        departureDate: new Date('2024-07-01'),
        returnDate: new Date('2024-07-03'),
        travelType: 1,
        budget: 5000.00,
        requirements: '需要往返机票+酒店住宿+接送机服务',
        status: 1,
        merchantId: merchant.id,
        assignedManager: '王经理'
      }
    ]);
    console.log('创建测试商旅定制数据');

    await Coupon.bulkCreate([
      {
        name: '机票满减券',
        code: 'CPNFLY100',
        type: 1,
        category: 'flight',
        amount: 100.00,
        minAmount: 500.00,
        totalStock: 100,
        usedStock: 0,
        remainStock: 100,
        startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 1
      },
      {
        name: '酒店折扣券',
        code: 'CPNHOTEL88',
        type: 2,
        category: 'hotel',
        amount: 0.85,
        minAmount: 300.00,
        totalStock: 50,
        usedStock: 0,
        remainStock: 50,
        startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 1
      },
      {
        name: '租车立减券',
        code: 'CPNCAR50',
        type: 3,
        category: 'car',
        amount: 50.00,
        minAmount: 0,
        totalStock: 200,
        usedStock: 0,
        remainStock: 200,
        startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        status: 0
      }
    ]);
    console.log('创建测试优惠券数据');

    await OrderLog.bulkCreate([
      {
        orderId: 1,
        orderNo: 'ORD20240620001',
        action: 'create',
        fromStatus: null,
        toStatus: 0,
        operatorId: normalUser.id,
        operatorName: '测试用户',
        operatorRole: 'user',
        remark: '用户下单'
      },
      {
        orderId: 1,
        orderNo: 'ORD20240620001',
        action: 'pay',
        fromStatus: 0,
        toStatus: 1,
        operatorId: normalUser.id,
        operatorName: '测试用户',
        operatorRole: 'user',
        remark: '支付成功'
      },
      {
        orderId: 2,
        orderNo: 'ORD20240620002',
        action: 'create',
        fromStatus: null,
        toStatus: 0,
        operatorId: normalUser.id,
        operatorName: '测试用户',
        operatorRole: 'user',
        remark: '用户下单'
      },
      {
        orderId: 3,
        orderNo: 'ORD20240620003',
        action: 'create',
        fromStatus: null,
        toStatus: 0,
        operatorId: normalUser.id,
        operatorName: '测试用户',
        operatorRole: 'user',
        remark: '用户下单'
      },
      {
        orderId: 3,
        orderNo: 'ORD20240620003',
        action: 'pay',
        fromStatus: 0,
        toStatus: 1,
        operatorId: normalUser.id,
        operatorName: '测试用户',
        operatorRole: 'user',
        remark: '支付成功'
      },
      {
        orderId: 6,
        orderNo: 'ORD20240620006',
        action: 'mark_abnormal',
        fromStatus: 1,
        toStatus: 1,
        operatorId: riskOperatorUser.id,
        operatorName: '风控专员小李',
        operatorRole: 'risk_operator',
        changes: JSON.stringify({ isAbnormal: { old: 0, new: 1 }, abnormalReason: { old: '', new: '价格异常，低于市场价30%' } }),
        remark: '批量标记异常'
      },
      {
        orderId: 8,
        orderNo: 'ORD20240620008',
        action: 'edit',
        fromStatus: 1,
        toStatus: 1,
        operatorId: admin.id,
        operatorName: '超级管理员',
        operatorRole: 'admin',
        changes: JSON.stringify({ amount: { old: 1500, new: 1764 } }),
        remark: '订单信息编辑'
      }
    ]);
    console.log('创建测试订单日志数据');

    await Approval.bulkCreate([
      {
        type: 'business_travel',
        businessId: 1,
        title: '商旅定制审批: 北京-上海商务出行方案',
        applicantId: normalUser.id,
        applicantName: '测试用户',
        status: 0
      },
      {
        type: 'merchant',
        businessId: merchant.id,
        title: '商家审核: 测试商家',
        applicantId: null,
        applicantName: '张先生',
        status: 1,
        approverId: admin.id,
        approverName: '超级管理员',
        approveRemark: '资质齐全，审核通过',
        approveTime: new Date()
      }
    ])
    console.log('创建测试审批数据')

    const flowTime = (offsetMin) => new Date(now.getTime() + offsetMin * 60 * 1000)

    await PaymentFlow.bulkCreate([
      {
        orderId: 1,
        orderNo: 'ORD20240620001',
        flowNo: 'FLW20240620000001001',
        payType: 'instant',
        channel: 'wechat',
        transactionId: 'WX42000012345678901234567890AB',
        totalAmount: 680.00,
        discountAmount: 0,
        couponId: null,
        couponAmount: 0,
        pointsAmount: 0,
        feeAmount: 4.08,
        feeRate: 0.006,
        actualAmount: 684.08,
        status: 1,
        failCode: null,
        failReason: null,
        isRepeated: 0,
        isFake: 0,
        isAbnormal: 0,
        abnormalReasons: null,
        paidAt: flowTime(-60),
        expiredAt: flowTime(-30),
        createdAt: flowTime(-65),
        updatedAt: flowTime(-60)
      },
      {
        orderId: 2,
        orderNo: 'ORD20240620002',
        flowNo: 'FLW20240620000002001',
        payType: 'instant',
        channel: 'wechat',
        transactionId: null,
        totalAmount: 588.00,
        discountAmount: 88.20,
        couponId: 2,
        couponAmount: 88.20,
        pointsAmount: 0,
        feeAmount: 2.99,
        feeRate: 0.006,
        actualAmount: 502.79,
        status: 0,
        failCode: null,
        failReason: null,
        isRepeated: 0,
        isFake: 0,
        isAbnormal: 0,
        abnormalReasons: null,
        paidAt: null,
        expiredAt: flowTime(25),
        createdAt: flowTime(-5),
        updatedAt: flowTime(-5)
      },
      {
        orderId: 3,
        orderNo: 'ORD20240620003',
        flowNo: 'FLW20240620000003001',
        payType: 'instant',
        channel: 'alipay',
        transactionId: '202406201234567890123456',
        totalAmount: 864.00,
        discountAmount: 50,
        couponId: null,
        couponAmount: 0,
        pointsAmount: 0,
        feeAmount: 4.88,
        feeRate: 0.006,
        actualAmount: 818.88,
        status: 1,
        failCode: null,
        failReason: null,
        isRepeated: 0,
        isFake: 0,
        isAbnormal: 0,
        abnormalReasons: null,
        paidAt: flowTime(-40),
        expiredAt: flowTime(-10),
        createdAt: flowTime(-45),
        updatedAt: flowTime(-40)
      },
      {
        orderId: 5,
        orderNo: 'ORD20240620005',
        flowNo: 'FLW20240620000005001',
        payType: 'instant',
        channel: 'unionpay',
        transactionId: '20240620123456780001',
        totalAmount: 890.00,
        discountAmount: 0,
        couponId: null,
        couponAmount: 0,
        pointsAmount: 0,
        feeAmount: 4.45,
        feeRate: 0.005,
        actualAmount: 894.45,
        status: 1,
        failCode: null,
        failReason: null,
        isRepeated: 0,
        isFake: 0,
        isAbnormal: 0,
        abnormalReasons: null,
        paidAt: flowTime(-200),
        expiredAt: flowTime(-170),
        createdAt: flowTime(-210),
        updatedAt: flowTime(-200)
      },
      {
        orderId: 6,
        orderNo: 'ORD20240620006',
        flowNo: 'FLW20240620000006001',
        payType: 'instant',
        channel: 'credit_card',
        transactionId: 'CC-PAY-20240620-88889999',
        totalAmount: 776.00,
        discountAmount: 232.80,
        couponId: null,
        couponAmount: 0,
        pointsAmount: 0,
        feeAmount: 5.43,
        feeRate: 0.01,
        actualAmount: 548.63,
        status: 1,
        failCode: null,
        failReason: null,
        isRepeated: 0,
        isFake: 0,
        isAbnormal: 1,
        abnormalReasons: JSON.stringify(['抵扣比例异常: 实际30.00%，上限30%']),
        paidAt: flowTime(-90),
        expiredAt: flowTime(-60),
        createdAt: flowTime(-95),
        updatedAt: flowTime(-90)
      },
      {
        orderId: 8,
        orderNo: 'ORD20240620008',
        flowNo: 'FLW20240620000008001',
        payType: 'installment',
        channel: 'credit_card',
        transactionId: 'CC-PAY-20240620-INST-001',
        totalAmount: 588.00,
        discountAmount: 0,
        couponId: null,
        couponAmount: 0,
        pointsAmount: 0,
        feeAmount: 14.70,
        feeRate: 0.025,
        actualAmount: 602.70,
        status: 1,
        failCode: null,
        failReason: null,
        isRepeated: 0,
        isFake: 0,
        isAbnormal: 0,
        abnormalReasons: null,
        paidAt: flowTime(-100),
        expiredAt: flowTime(60 * 24 * 30),
        createdAt: flowTime(-105),
        updatedAt: flowTime(-100)
      },
      {
        orderId: 8,
        orderNo: 'ORD20240620008',
        flowNo: 'FLW20240620000008002',
        payType: 'installment',
        channel: 'credit_card',
        transactionId: 'CC-PAY-20240620-INST-002',
        totalAmount: 588.00,
        discountAmount: 0,
        couponId: null,
        couponAmount: 0,
        pointsAmount: 0,
        feeAmount: 14.70,
        feeRate: 0.025,
        actualAmount: 602.70,
        status: 1,
        failCode: null,
        failReason: null,
        isRepeated: 0,
        isFake: 0,
        isAbnormal: 0,
        abnormalReasons: null,
        paidAt: flowTime(-80),
        expiredAt: flowTime(60 * 24 * 60),
        createdAt: flowTime(-105),
        updatedAt: flowTime(-80)
      },
      {
        orderId: 8,
        orderNo: 'ORD20240620008',
        flowNo: 'FLW20240620000008003',
        payType: 'installment',
        channel: 'credit_card',
        transactionId: null,
        totalAmount: 588.00,
        discountAmount: 0,
        couponId: null,
        couponAmount: 0,
        pointsAmount: 0,
        feeAmount: 14.70,
        feeRate: 0.025,
        actualAmount: 602.60,
        status: 0,
        failCode: null,
        failReason: null,
        isRepeated: 0,
        isFake: 0,
        isAbnormal: 0,
        abnormalReasons: null,
        paidAt: null,
        expiredAt: flowTime(60 * 24 * 90),
        createdAt: flowTime(-105),
        updatedAt: flowTime(-105)
      },
      {
        orderId: 1,
        orderNo: 'ORD20240620001',
        flowNo: 'FLW20240620000001002',
        payType: 'instant',
        channel: 'wechat',
        transactionId: 'WX42000012345678901234567890AB',
        totalAmount: 680.00,
        discountAmount: 0,
        couponId: null,
        couponAmount: 0,
        pointsAmount: 0,
        feeAmount: 4.08,
        feeRate: 0.006,
        actualAmount: 684.08,
        status: 2,
        failCode: 'repeated_payment',
        failReason: '检测到重复支付',
        isRepeated: 1,
        isFake: 0,
        isAbnormal: 0,
        abnormalReasons: null,
        paidAt: null,
        expiredAt: flowTime(-25),
        createdAt: flowTime(-55),
        updatedAt: flowTime(-55)
      },
      {
        orderId: 7,
        orderNo: 'ORD20240620007',
        flowNo: 'FLW20240620000007001',
        payType: 'instant',
        channel: 'wechat',
        transactionId: 'FAKE-TX-123',
        totalAmount: 680.00,
        discountAmount: 0,
        couponId: null,
        couponAmount: 0,
        pointsAmount: 0,
        feeAmount: 4.08,
        feeRate: 0.006,
        actualAmount: 684.08,
        status: 2,
        failCode: 'fake_transaction',
        failReason: '交易号格式校验失败，疑似虚假流水',
        isRepeated: 0,
        isFake: 1,
        isAbnormal: 0,
        abnormalReasons: null,
        paidAt: null,
        expiredAt: flowTime(-270),
        createdAt: flowTime(-285),
        updatedAt: flowTime(-280)
      }
    ])
    console.log('创建测试支付流水数据')

    await PaymentDeduction.bulkCreate([
      {
        orderId: 2,
        flowId: 2,
        deductionType: 'coupon',
        deductionSource: '2',
        deductionName: '酒店折扣券(85折)',
        deductionAmount: 88.20,
        deductionRate: 0.85,
        applicableAmount: 300.00,
        ruleSnapshot: JSON.stringify({ type: 'discount', category: 'hotel', amount: 0.85, minAmount: 300 })
      },
      {
        orderId: 6,
        flowId: 5,
        deductionType: 'activity',
        deductionSource: 'ACT-HOTEL-30OFF',
        deductionName: '高端商旅活动满减',
        deductionAmount: 232.80,
        deductionRate: null,
        applicableAmount: 700.00,
        ruleSnapshot: JSON.stringify({ type: 'activity', category: 'hotel', amount: 232.8, minAmount: 700 })
      },
      {
        orderId: 3,
        flowId: 3,
        deductionType: 'member_discount',
        deductionSource: 'GOLD_MEMBER',
        deductionName: '黄金会员立减50',
        deductionAmount: 50.00,
        deductionRate: null,
        applicableAmount: 500.00,
        ruleSnapshot: JSON.stringify({ type: 'member', level: 'gold', amount: 50 })
      }
    ])
    console.log('创建测试抵扣记录数据')

    await PaymentFee.bulkCreate([
      {
        orderId: 1,
        flowId: 1,
        feeType: 'channel',
        feeName: '微信支付渠道手续费',
        feeBase: 680.00,
        feeRate: 0.006,
        fixedFee: 0,
        feeAmount: 4.08,
        payer: 'user'
      },
      {
        orderId: 2,
        flowId: 2,
        feeType: 'channel',
        feeName: '微信支付渠道手续费',
        feeBase: 499.80,
        feeRate: 0.006,
        fixedFee: 0,
        feeAmount: 2.99,
        payer: 'user'
      },
      {
        orderId: 3,
        flowId: 3,
        feeType: 'channel',
        feeName: '支付宝渠道手续费',
        feeBase: 814.00,
        feeRate: 0.006,
        fixedFee: 0,
        feeAmount: 4.88,
        payer: 'user'
      },
      {
        orderId: 5,
        flowId: 4,
        feeType: 'channel',
        feeName: '银联支付渠道手续费',
        feeBase: 890.00,
        feeRate: 0.005,
        fixedFee: 0,
        feeAmount: 4.45,
        payer: 'user'
      },
      {
        orderId: 6,
        flowId: 5,
        feeType: 'channel',
        feeName: '信用卡渠道手续费',
        feeBase: 543.20,
        feeRate: 0.01,
        fixedFee: 0,
        feeAmount: 5.43,
        payer: 'user'
      },
      {
        orderId: 8,
        flowId: 6,
        feeType: 'installment',
        feeName: '第1期信用卡分期手续费(2.5%)',
        feeBase: 588.00,
        feeRate: 0.025,
        fixedFee: 0,
        feeAmount: 14.70,
        payer: 'user'
      },
      {
        orderId: 8,
        flowId: 7,
        feeType: 'installment',
        feeName: '第2期信用卡分期手续费(2.5%)',
        feeBase: 588.00,
        feeRate: 0.025,
        fixedFee: 0,
        feeAmount: 14.70,
        payer: 'user'
      },
      {
        orderId: 8,
        flowId: 8,
        feeType: 'installment',
        feeName: '第3期信用卡分期手续费(2.5%)',
        feeBase: 588.00,
        feeRate: 0.025,
        fixedFee: 0,
        feeAmount: 14.70,
        payer: 'user'
      },
      {
        orderId: 9,
        flowId: 9,
        feeType: 'channel',
        feeName: '微信支付渠道手续费',
        feeBase: 680.00,
        feeRate: 0.006,
        fixedFee: 0,
        feeAmount: 4.08,
        payer: 'user'
      },
      {
        orderId: 10,
        flowId: 10,
        feeType: 'channel',
        feeName: '微信支付渠道手续费',
        feeBase: 680.00,
        feeRate: 0.006,
        fixedFee: 0,
        feeAmount: 4.08,
        payer: 'user'
      }
    ])
    console.log('创建测试手续费明细数据')

    console.log('\n========================================')
    console.log('数据库初始化完成！');
    console.log('默认管理员账户：admin / 123456');
    console.log('测试用户账户：user1 / 123456');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

initDB();
