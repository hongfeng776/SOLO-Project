import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ActivityOperationRecord extends Model<InferAttributes<ActivityOperationRecord>, InferCreationAttributes<ActivityOperationRecord>> {
  declare id: CreationOptional<number>
  declare operationName: string
  declare operationType: string
  declare batchType: CreationOptional<string>
  declare strategyId: CreationOptional<number>
  declare targetActivityLevel: CreationOptional<string>
  declare userScope: CreationOptional<string>
  declare userCount: CreationOptional<number>
  declare successCount: CreationOptional<number>
  declare failCount: CreationOptional<number>
  declare executeType: string
  declare executeTime: CreationOptional<Date>
  declare executeEndTime: CreationOptional<Date>
  declare status: CreationOptional<number>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare operationResult: CreationOptional<string>
  declare detail: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

ActivityOperationRecord.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    operationName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '操作名称'
    },
    operationType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作类型 batch/single/scheduled'
    },
    batchType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '批量操作类型'
    },
    strategyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '关联策略ID'
    },
    targetActivityLevel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '目标活跃度等级'
    },
    userScope: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户范围JSON（用户ID列表或条件）'
    },
    userCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '目标用户数'
    },
    successCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '成功数'
    },
    failCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '失败数'
    },
    executeType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'immediate',
      comment: '执行类型 immediate/scheduled'
    },
    executeTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '执行开始时间'
    },
    executeEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '执行结束时间'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '状态 0待处理 1执行中 2已完成 3失败 4取消 5已定时'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人名称'
    },
    operationResult: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作结果摘要'
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '详细数据JSON'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'activity_operation_record',
    modelName: 'ActivityOperationRecord'
  }
)

export default ActivityOperationRecord
