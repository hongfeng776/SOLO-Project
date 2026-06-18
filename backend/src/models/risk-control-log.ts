import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class RiskControlLog extends Model<InferAttributes<RiskControlLog>, InferCreationAttributes<RiskControlLog>> {
  declare id: CreationOptional<number>
  declare userId: number
  declare userName: string
  declare violationType: string
  declare riskLevel: number
  declare behaviorDetail: CreationOptional<string>
  declare frequencyData: CreationOptional<string>
  declare timeRange: CreationOptional<string>
  declare contentCompliance: CreationOptional<string>
  declare intercepted: CreationOptional<number>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare autoHandled: CreationOptional<number>
  declare handleResult: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

RiskControlLog.init(
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
    violationType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '违规类型'
    },
    riskLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '风险等级 0正常 1轻微 2中度 3重度'
    },
    behaviorDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '行为详情JSON'
    },
    frequencyData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '频次数据JSON'
    },
    timeRange: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '操作时段范围'
    },
    contentCompliance: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '内容合规性JSON'
    },
    intercepted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否已拦截 0否 1是'
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
    autoHandled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否自动处理 0否 1是'
    },
    handleResult: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '处理结果'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'risk_control_log',
    modelName: 'RiskControlLog'
  }
)

export default RiskControlLog
