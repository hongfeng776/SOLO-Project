const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Merchant = require('./Merchant');

const BusinessTravel = sequelize.define('BusinessTravel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '商旅定制ID'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '方案标题'
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    },
    comment: '用户ID'
  },
  contactName: {
    type: DataTypes.STRING(50),
    comment: '联系人姓名'
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    comment: '联系电话'
  },
  departureCity: {
    type: DataTypes.STRING(100),
    comment: '出发城市'
  },
  arrivalCity: {
    type: DataTypes.STRING(100),
    comment: '目的城市'
  },
  departureDate: {
    type: DataTypes.DATE,
    comment: '出发日期'
  },
  returnDate: {
    type: DataTypes.DATE,
    comment: '返回日期'
  },
  travelType: {
    type: DataTypes.TINYINT,
    comment: '差旅类型: 1-商务出行, 2-团队建设, 3-会议考察'
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '预算金额'
  },
  requirements: {
    type: DataTypes.TEXT,
    comment: '需求描述'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态: 0-待确认, 1-方案设计中, 2-待审批, 3-已确认, 4-已取消, 5-已完成'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    references: {
      model: Merchant,
      key: 'id'
    },
    comment: '商家ID'
  },
  assignedManager: {
    type: DataTypes.STRING(50),
    comment: '指派经理'
  }
}, {
  tableName: 'business_travels',
  comment: '商旅定制表',
  timestamps: true,
  paranoid: true
});

BusinessTravel.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(BusinessTravel, { foreignKey: 'userId', as: 'businessTravels' });

BusinessTravel.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Merchant.hasMany(BusinessTravel, { foreignKey: 'merchantId', as: 'businessTravels' });

module.exports = BusinessTravel;
