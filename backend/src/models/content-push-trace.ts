import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum PushTraceEventType {
  MATCH_CHECK = 'match_check',
  PUSH_READY = 'push_ready',
  PUSH_START = 'push_start',
  EXPOSURE_DELIVERED = 'exposure_delivered',
  EXPOSURE_VALID = 'exposure_valid',
  EXPOSURE_INVALID = 'exposure_invalid',
  CLICK_TRACKED = 'click_tracked',
  INTERACT_TRACKED = 'interact_tracked',
  PUSH_PAUSE = 'push_pause',
  PUSH_RESUME = 'push_resume',
  PUSH_FINISH = 'push_finish',
  PUSH_TERMINATE = 'push_terminate',
  ANOMALY_DETECTED = 'anomaly_detected',
  ANOMALY_BLOCKED = 'anomaly_blocked',
  RULE_ADJUST = 'rule_adjust',
  STRENGTH_CHANGE = 'strength_change'
}

export enum PushTraceAnomalyType {
  FAKE_EXPOSURE = 'fake_exposure',
  INVALID_EXPOSURE = 'invalid_exposure',
  CLICK_FRAUD = 'click_fraud',
  BRUSH_TRAFFIC = 'brush_traffic',
  IP_CLUSTER = 'ip_cluster',
  DEVICE_ABNORMAL = 'device_abnormal',
  TIMEOUT_DELIVERY = 'timeout_delivery',
  DATA_MISMATCH = 'data_mismatch'
}

class ContentPushTrace extends Model<InferAttributes<ContentPushTrace>, InferCreationAttributes<ContentPushTrace>> {
  declare id: CreationOptional<number>
  declare traceId: string
  declare taskId: number
  declare noteId: number
  declare userId: CreationOptional<number | null>
  declare userTag: CreationOptional<string>
  declare eventType: string
  declare eventDetail: CreationOptional<string>
  declare deliveryChannel: CreationOptional<string>
  declare exposureAmount: CreationOptional<number>
  declare clickAmount: CreationOptional<number>
  declare interactAmount: CreationOptional<number>
  declare duration: CreationOptional<number>
  declare ipAddress: CreationOptional<string>
  declare deviceId: CreationOptional<string>
  declare anomalyType: CreationOptional<string>
  declare anomalyDetail: CreationOptional<string>
  declare anomalyScore: CreationOptional<number>
  declare isBlocked: CreationOptional<number>
  declare operatorId: CreationOptional<number | null>
  declare operatorName: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare traceData: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

ContentPushTrace.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    traceId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      comment: '链路追踪ID TR+时间戳+6位'
    },
    taskId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '推送任务ID'
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '笔记ID'
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '触达用户ID'
    },
    userTag: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '用户标签快照'
    },
    eventType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '事件类型'
    },
    eventDetail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '事件说明'
    },
    deliveryChannel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '投放渠道:homepage/discover/recommend/hot/follow'
    },
    exposureAmount: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '本次曝光量'
    },
    clickAmount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '本次点击量'
    },
    interactAmount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '本次互动量'
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '曝光时长(ms)'
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: 'IP地址'
    },
    deviceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '设备指纹'
    },
    anomalyType: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: '',
      comment: '异常类型编码'
    },
    anomalyDetail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '异常详细说明'
    },
    anomalyScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '异常分 0-100'
    },
    isBlocked: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否被拦截 0否 1是'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    traceData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '完整链路数据 JSON'
    },
    createTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'biz_content_push_trace',
    indexes: [
      { fields: ['traceId'], unique: true },
      { fields: ['taskId'] },
      { fields: ['noteId'] },
      { fields: ['userId'] },
      { fields: ['eventType'] },
      { fields: ['isBlocked'] },
      { fields: ['anomalyType'] },
      { fields: ['createTime'] },
      { fields: ['ipAddress'] },
      { fields: ['deviceId'] }
    ]
  }
)

export default ContentPushTrace
