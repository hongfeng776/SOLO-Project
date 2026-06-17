import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class NoteOpsLog extends Model<InferAttributes<NoteOpsLog>, InferCreationAttributes<NoteOpsLog>> {
  declare id: CreationOptional<number>
  declare noteId: number
  declare noteTitle: string
  declare operatorId: number
  declare operatorName: string
  declare operatorRole: string
  declare previousStatus: number
  declare newStatus: number
  declare previousFlowLevel: CreationOptional<number>
  declare newFlowLevel: CreationOptional<number>
  declare previousFlowUnlocked: CreationOptional<number>
  declare newFlowUnlocked: CreationOptional<number>
  declare previousIsHot: CreationOptional<number>
  declare newIsHot: CreationOptional<number>
  declare reason: CreationOptional<string>
  declare isAbnormal: CreationOptional<number>
  declare abnormalReason: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

NoteOpsLog.init(
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
      comment: '笔记标题'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作人姓名'
    },
    operatorRole: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '操作人角色: normal_ops/super_ops/admin'
    },
    previousStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '操作前状态'
    },
    newStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '操作后状态'
    },
    previousFlowLevel: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作前流量等级'
    },
    newFlowLevel: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作后流量等级'
    },
    previousFlowUnlocked: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作前流量解锁状态'
    },
    newFlowUnlocked: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作后流量解锁状态'
    },
    previousIsHot: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作前是否热门'
    },
    newIsHot: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作后是否热门'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '操作原因/备注'
    },
    isAbnormal: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否异常操作 0否 1是'
    },
    abnormalReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '异常原因'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_note_ops_log',
    modelName: 'NoteOpsLog',
    indexes: [
      { fields: ['note_id', 'create_time'] },
      { fields: ['operator_id', 'create_time'] },
      { fields: ['is_abnormal'] }
    ]
  }
)

export default NoteOpsLog
