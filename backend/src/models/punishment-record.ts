import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class PunishmentRecord extends Model<InferAttributes<PunishmentRecord>, InferCreationAttributes<PunishmentRecord>> {
  declare id: CreationOptional<number>
  declare userId: number
  declare userName: string
  declare punishmentType: string
  declare riskLevel: number
  declare violationType: string
  declare reason: string
  declare reasonDetail: CreationOptional<string>
  declare status: CreationOptional<number>
  declare startTime: CreationOptional<Date>
  declare endTime: CreationOptional<Date>
  declare duration: CreationOptional<number>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare revokeOperatorId: CreationOptional<number>
  declare revokeOperatorName: CreationOptional<string>
  declare revokeTime: CreationOptional<Date>
  declare revokeReason: CreationOptional<string>
  declare rectificationResult: CreationOptional<string>
  declare riskControlLogId: CreationOptional<number>
  declare isDuplicate: CreationOptional<number>
  declare isExcessive: CreationOptional<number>
  declare reviewReport: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

PunishmentRecord.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '用户ID'
    },
    userName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '用户名'
    },
    punishmentType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '处罚类型 warning/temp_restrict/flow_limit/content_downgrade/temp_ban/permanent_ban'
    },
    riskLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '风险等级'
    },
    violationType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '违规类型'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '处罚原因'
    },
    reasonDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '原因详情'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '处罚状态 0生效 1解除 2过期 3申诉'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '处罚开始时间'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '处罚结束时间'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '处罚时长(分钟)'
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
    revokeOperatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '解除操作人ID'
    },
    revokeOperatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '解除操作人名称'
    },
    revokeTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '解除时间'
    },
    revokeReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '解除原因'
    },
    rectificationResult: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '整改结果JSON'
    },
    riskControlLogId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '关联风控日志ID'
    },
    isDuplicate: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否重复处罚 0否 1是'
    },
    isExcessive: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否过度处罚 0否 1是'
    },
    reviewReport: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '复盘报告JSON'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'punishment_record',
    modelName: 'PunishmentRecord'
  }
)

export default PunishmentRecord
