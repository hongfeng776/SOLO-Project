const { sequelize, DataTypes } = require('../config/database');

const Copyright = sequelize.define('copyright', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  copyright_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '版权编号',
  },
  copyright_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '版权名称',
  },
  copyright_type: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '版权类型 1:独家 2:非独家 3:代理 4:公共',
  },
  supplier_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '供应方/版权方名称',
  },
  supplier_contact: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '供应方联系人',
  },
  supplier_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '供应方联系电话',
  },
  contract_no: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '合同编号',
  },
  contract_file: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '合同文件URL',
  },
  authorization_file: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '授权文件URL',
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '授权开始日期',
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '授权结束日期',
  },
  territories: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '授权地区',
  },
  license_fee: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '授权费用',
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'CNY',
    comment: '货币单位',
  },
  payment_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '付款状态 0:未支付 1:部分支付 2:已支付',
  },
  content_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '关联内容数量',
  },
  copyright_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '版权说明',
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '附件列表(JSON)',
    get() {
      const value = this.getDataValue('attachments');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('attachments', JSON.stringify(value || []));
    },
  },
  status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态 1:生效中 0:已失效 2:即将到期',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '创建人ID',
  },
  updated_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '更新人ID',
  },
}, {
  tableName: 'biz_copyright',
  comment: '版权信息表',
  indexes: [
    { fields: ['copyright_type'] },
    { fields: ['status'] },
    { fields: ['end_date'] },
  ],
});

module.exports = { Copyright };
