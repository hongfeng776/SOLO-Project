const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')
const AfterSale = require('./AfterSale')
const Order = require('./Order')

const AfterSaleAudit = sequelize.define('AfterSaleAudit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '审核记录ID'
  },
  afterSaleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: AfterSale,
      key: 'id'
    },
    comment: '售后申请ID'
  },
  afterSaleNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '售后单号'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    },
    comment: '订单ID'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    comment: '操作人姓名'
  },
  operatorRole: {
    type: DataTypes.STRING(20),
    comment: '操作人角色'
  },
  auditAction: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '审核动作: submit-申请, apply-通过, reject-驳回, postpone-暂缓, close-关闭'
  },
  auditStatus: {
    type: DataTypes.TINYINT,
    comment: '审核后对应售后状态: 0-待审核, 1-审核通过, 2-审核驳回, 3-退款中, 4-已退款, 5-已关闭, 6-暂缓处理'
  },
  auditRemark: {
    type: DataTypes.STRING(500),
    comment: '审核备注'
  },
  changes: {
    type: DataTypes.TEXT,
    comment: '变更字段JSON'
  }
}, {
  tableName: 'after_sale_audits',
  comment: '售后审核记录表',
  timestamps: true,
  updatedAt: false,
  paranoid: false
})

AfterSaleAudit.belongsTo(AfterSale, { foreignKey: 'afterSaleId', as: 'afterSale' })
AfterSale.hasMany(AfterSaleAudit, { foreignKey: 'afterSaleId', as: 'audits' })

AfterSaleAudit.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
Order.hasMany(AfterSaleAudit, { foreignKey: 'orderId', as: 'afterSaleAudits' })

module.exports = AfterSaleAudit
