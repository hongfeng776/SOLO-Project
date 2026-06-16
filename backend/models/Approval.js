const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Approval = sequelize.define('Approval', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '审批ID'
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '审批类型: merchant/product/coupon/refund/business_travel'
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联业务ID'
  },
  title: {
    type: DataTypes.STRING(255),
    comment: '审批标题'
  },
  applicantId: {
    type: DataTypes.INTEGER,
    comment: '申请人ID'
  },
  applicantName: {
    type: DataTypes.STRING(50),
    comment: '申请人姓名'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态: 0-待审批, 1-已通过, 2-已拒绝'
  },
  approverId: {
    type: DataTypes.INTEGER,
    comment: '审批人ID'
  },
  approverName: {
    type: DataTypes.STRING(50),
    comment: '审批人姓名'
  },
  approveRemark: {
    type: DataTypes.STRING(500),
    comment: '审批备注'
  },
  approveTime: {
    type: DataTypes.DATE,
    comment: '审批时间'
  }
}, {
  tableName: 'approvals',
  comment: '审批流程表',
  timestamps: true,
  paranoid: true
});

Approval.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });
User.hasMany(Approval, { foreignKey: 'applicantId', as: 'appliedApprovals' });

Approval.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
User.hasMany(Approval, { foreignKey: 'approverId', as: 'approvedApprovals' });

module.exports = Approval;
