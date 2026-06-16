const { sequelize, DataTypes } = require('../config/database');
const { User } = require('./User');

const Member = sequelize.define('member', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    unique: true,
    comment: '关联平台用户ID',
  },
  member_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '会员编号',
  },
  member_level: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '会员等级 0:普通 1:VIP 2:SVIP 3:年度VIP 4:终身会员',
  },
  member_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '会员状态 0:过期 1:正常 2:冻结 3:待激活',
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '会员开始日期',
  },
  expire_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '会员过期日期',
  },
  auto_renew: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否自动续费 1:是 0:否',
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '账户余额',
  },
  total_spent: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '累计消费金额',
  },
  points: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '积分',
  },
  total_points: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '累计获取积分',
  },
  coupon_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '可用优惠券数量',
  },
  current_plan: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '当前套餐编码',
  },
  plan_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '套餐价格',
  },
  plan_duration: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '套餐时长(天)',
  },
  privileges: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '会员权益列表(JSON)',
    get() {
      const value = this.getDataValue('privileges');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('privileges', JSON.stringify(value || []));
    },
  },
  last_active_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后活跃时间',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
}, {
  tableName: 'biz_member',
  comment: '会员信息表',
  indexes: [
    { fields: ['member_level'] },
    { fields: ['member_status'] },
    { fields: ['expire_date'] },
    { fields: ['auto_renew'] },
  ],
});

Member.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { Member };
