import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class InteractionAbnormalLog extends Model<
  InferAttributes<InteractionAbnormalLog>,
  InferCreationAttributes<InteractionAbnormalLog>
> {
  declare id: CreationOptional<number>
  declare noteId: number
  declare noteTitle: string
  declare interactionType: string
  declare abnormalType: string
  declare abnormalReason: string
  declare severity: number
  declare abnormalCount: number
  declare sourceType: string
  declare status: CreationOptional<number>
  declare handlerId: CreationOptional<number | null>
  declare handlerName: CreationOptional<string>
  declare handleNote: CreationOptional<string>
  declare handleTime: CreationOptional<Date | null>
  declare relatedUserIds: CreationOptional<string>
  declare relatedIp: CreationOptional<string>
  declare riskLevel: CreationOptional<number>
  declare impactValue: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

InteractionAbnormalLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '笔记ID'
    },
    noteTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '笔记标题'
    },
    interactionType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '互动类型 like/favorite/share/comment/view/all'
    },
    abnormalType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '异常类型 rapid_surge/fake_interaction/machine_brush/no_user_trace/repeat_interaction'
    },
    abnormalReason: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '异常原因描述'
    },
    severity: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '严重程度 1轻微 2中等 3严重'
    },
    abnormalCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '异常互动数量'
    },
    sourceType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'auto',
      comment: '来源 auto自动检测/manual人工标记/batch批量'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '处理状态 0待处理 1已校准 2已清理 3已忽略 4待复核'
    },
    handlerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '处理人ID'
    },
    handlerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '处理人姓名'
    },
    handleNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '处理备注'
    },
    handleTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '处理时间'
    },
    relatedUserIds: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '关联异常用户ID列表，逗号分隔'
    },
    relatedIp: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '关联异常IP'
    },
    riskLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '风险等级 0正常 1轻微 2中度 3重度'
    },
    impactValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '影响热度权重值'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_interaction_abnormal_log',
    modelName: 'InteractionAbnormalLog',
    indexes: [
      { fields: ['note_id', 'create_time'] },
      { fields: ['abnormal_type', 'create_time'] },
      { fields: ['severity', 'status'] },
      { fields: ['status', 'create_time'] },
      { fields: ['interaction_type', 'create_time'] },
      { fields: ['risk_level', 'create_time'] },
      { fields: ['source_type', 'create_time'] }
    ]
  }
)

export default InteractionAbnormalLog
