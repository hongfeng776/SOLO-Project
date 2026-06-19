import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class InteractionData extends Model<InferAttributes<InteractionData>, InferCreationAttributes<InteractionData>> {
  declare id: CreationOptional<number>
  declare noteId: number
  declare dataType: string
  declare totalCount: CreationOptional<number>
  declare realCount: CreationOptional<number>
  declare fakeCount: CreationOptional<number>
  declare anomalyCount: CreationOptional<number>
  declare isAnomaly: CreationOptional<number>
  declare anomalyType: CreationOptional<string>
  declare anomalyDetail: CreationOptional<string>
  declare hotScore: CreationOptional<number>
  declare originalHotScore: CreationOptional<number>
  declare weightScore: CreationOptional<number>
  declare flowLevel: CreationOptional<number>
  declare originalFlowLevel: CreationOptional<number>
  declare status: CreationOptional<number>
  declare lastCalibrationTime: CreationOptional<Date | null>
  declare lastCalibrationUserId: CreationOptional<number | null>
  declare lastCalibrationUserName: CreationOptional<string>
  declare isQuality: CreationOptional<number>
  declare qualityScore: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

InteractionData.init(
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
    dataType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '互动类型 like/favorite/share/comment'
    },
    totalCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '总互动数'
    },
    realCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '真实互动数'
    },
    fakeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '虚假互动数'
    },
    anomalyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '异常互动数'
    },
    isAnomaly: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否异常 0正常 1轻微 2中度 3重度'
    },
    anomalyType: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
      comment: '异常类型 逗号分隔：sudden_surge/no_real_trace/machine_brush/duplicate/repeated'
    },
    anomalyDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '异常明细JSON'
    },
    hotScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '当前热度分值(排除异常后)'
    },
    originalHotScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '原始热度分值(含异常)'
    },
    weightScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '流量权重分值'
    },
    flowLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '当前流量池等级 1普通 2优质 3热门'
    },
    originalFlowLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '原始流量池等级'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '0已清零 1正常 2已校准 3已标记优质'
    },
    lastCalibrationTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后校准时间'
    },
    lastCalibrationUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '最后校准人ID'
    },
    lastCalibrationUserName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '最后校准人姓名'
    },
    isQuality: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否优质互动笔记 0否 1是'
    },
    qualityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '互动质量评分 0-100'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_interaction_data',
    modelName: 'InteractionData',
    indexes: [
      { fields: ['note_id', 'data_type'], unique: true },
      { fields: ['is_anomaly', 'create_time'] },
      { fields: ['status', 'flow_level'] },
      { fields: ['is_quality', 'quality_score'] },
      { fields: ['hot_score'] }
    ]
  }
)

export default InteractionData
