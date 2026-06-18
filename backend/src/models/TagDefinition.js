const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const TagDefinition = sequelize.define(
  'TagDefinition',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '标签ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '标签名称(唯一)'
    },
    color: {
      type: DataTypes.STRING(20),
      defaultValue: '#67C23A',
      allowNull: false,
      comment: '标签颜色HEX'
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '标签图标'
    },
    dimension: {
      type: DataTypes.ENUM('consume', 'create', 'active', 'composite'),
      defaultValue: 'composite',
      allowNull: false,
      comment: '适配维度: consume-消费 create-创作 active-活跃 composite-综合'
    },
    applicableLevels: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
      comment: '适用用户层级: [normal, vip, premium_vip]'
    },
    minConsumeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '适配条件-最低累计消费金额'
    },
    minActiveHours: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '适配条件-最低累计活跃时长(小时)'
    },
    minCreateCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '适配条件-最低累计创作数量'
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '标签描述'
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '创建人ID'
    },
    createdByName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '创建人名称'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false,
      comment: '标签状态'
    }
  },
  {
    tableName: 'tag_definitions',
    comment: '标签定义表'
  }
)

TagDefinition.DIMENSIONS = ['consume', 'create', 'active', 'composite']
TagDefinition.USER_LEVELS = ['normal', 'vip', 'premium_vip']

module.exports = TagDefinition
