import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class InteractionAnomalyLog extends Model<InferAttributes<InteractionAnomalyLog>, InferCreationAttributes<InteractionAnomalyLog>> {
  declare id: CreationOptional<number>
  declare interactionDataId: number
  declare noteId: number
  declare dataType: string
  declare action: number
  declare anomalyType: CreationOptional<string>
  declare anomalyDetail: CreationOptional<string>
  declare beforeTotalCount: CreationOptional<number>
  declare afterTotalCount: CreationOptional<number>
  declare beforeRealCount: CreationOptional<number>
  declare afterRealCount: CreationOptional<number>
  declare beforeHotScore: CreationOptional<number>
  declare afterHotScore: CreationOptional<number>
  declare beforeFlowLevel: CreationOptional<number>
  declare afterFlowLevel: CreationOptional<number>
  declare beforeWeightScore: CreationOptional<number>
  declare afterWeightScore: CreationOptional<number>
  declare userId: CreationOptional<number>
  declare userName: CreationOptional<string>
  declare userRiskLevel: CreationOptional<number>
  declare userViolationCount: CreationOptional<number>
  declare sourceIp: CreationOptional<string>
  declare sourceDevice: CreationOptional<string>
  declare handlerId: CreationOptional<number | null>
  declare handlerName: CreationOptional<string>
  declare handleNote: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

InteractionAnomalyLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    interactionDataId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '互动数据ID'
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '笔记ID'
    },
    dataType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '互动类型 like/favorite/share/comment'
    },
    action: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '操作 0自动检测异常 1人工标记异常 2批量校准 3批量清零 4批量标记优质 5权重联动 6恢复'
    },
    anomalyType: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
      comment: '异常类型'
    },
    anomalyDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '异常明细JSON'
    },
    beforeTotalCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作前总数'
    },
    afterTotalCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作后总数'
    },
    beforeRealCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作前真实数'
    },
    afterRealCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作后真实数'
    },
    beforeHotScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '操作前热度'
    },
    afterHotScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '操作后热度'
    },
    beforeFlowLevel: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作前流量等级'
    },
    afterFlowLevel: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作后流量等级'
    },
    beforeWeightScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '操作前权重分'
    },
    afterWeightScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '操作后权重分'
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '关联用户ID'
    },
    userName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '关联用户名'
    },
    userRiskLevel: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '关联用户风险等级'
    },
    userViolationCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联用户违规次数'
    },
    sourceIp: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '来源IP'
    },
    sourceDevice: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '来源设备'
    },
    handlerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作人ID'
    },
    handlerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作人姓名'
    },
    handleNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '操作备注'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_interaction_anomaly_log',
    modelName: 'InteractionAnomalyLog',
    indexes: [
      { fields: ['interaction_data_id'] },
      { fields: ['note_id', 'action'] },
      { fields: ['action', 'create_time'] },
      { fields: ['anomaly_type', 'create_time'] },
      { fields: ['user_id', 'create_time'] }
    ]
  }
)

export default InteractionAnomalyLog
