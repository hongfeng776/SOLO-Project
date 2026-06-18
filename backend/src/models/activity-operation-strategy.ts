import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ActivityOperationStrategy extends Model<InferAttributes<ActivityOperationStrategy>, InferCreationAttributes<ActivityOperationStrategy>> {
  declare id: CreationOptional<number>
  declare strategyName: string
  declare strategyType: string
  declare targetActivityLevel: string
  declare targetCondition: CreationOptional<string>
  declare content: CreationOptional<string>
  declare benefits: CreationOptional<string>
  declare triggerMode: string
  declare triggerTime: CreationOptional<Date>
  declare status: CreationOptional<number>
  declare priority: CreationOptional<number>
  declare autoApply: CreationOptional<number>
  declare applyCount: CreationOptional<number>
  declare successCount: CreationOptional<number>
  declare failCount: CreationOptional<number>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

ActivityOperationStrategy.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    strategyName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '策略名称'
    },
    strategyType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '策略类型'
    },
    targetActivityLevel: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '目标活跃度等级'
    },
    targetCondition: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '目标条件JSON'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '策略内容/消息模板'
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '权益配置JSON'
    },
    triggerMode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'immediate',
      comment: '触发方式 immediate/scheduled'
    },
    triggerTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '定时触发时间'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态 0停用 1启用'
    },
    priority: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '优先级'
    },
    autoApply: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否自动适配 0否 1是'
    },
    applyCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '应用次数'
    },
    successCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '成功次数'
    },
    failCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '失败次数'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '创建人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '创建人名称'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'activity_operation_strategy',
    modelName: 'ActivityOperationStrategy'
  }
)

export default ActivityOperationStrategy
