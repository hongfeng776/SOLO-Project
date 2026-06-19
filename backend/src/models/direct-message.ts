import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class DirectMessage extends Model<InferAttributes<DirectMessage>, InferCreationAttributes<DirectMessage>> {
  declare id: CreationOptional<number>
  declare conversationId: number
  declare senderId: number
  declare senderName: string
  declare senderAvatar: CreationOptional<string>
  declare receiverId: number
  declare receiverName: string
  declare receiverAvatar: CreationOptional<string>
  declare content: string
  declare contentType: CreationOptional<number>
  declare status: CreationOptional<number>
  declare readStatus: CreationOptional<number>
  declare readTime: CreationOptional<Date | null>
  declare riskLevel: CreationOptional<number>
  declare violationType: CreationOptional<string>
  declare violationDetail: CreationOptional<string>
  declare sensitiveWords: CreationOptional<string>
  declare intercepted: CreationOptional<number>
  declare ip: CreationOptional<string>
  declare deviceInfo: CreationOptional<string>
  declare userAgent: CreationOptional<string>
  declare deletedBySender: CreationOptional<number>
  declare deletedByReceiver: CreationOptional<number>
  declare deleteTimeSender: CreationOptional<Date | null>
  declare deleteTimeReceiver: CreationOptional<Date | null>
  declare isReported: CreationOptional<number>
  declare reportCount: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

DirectMessage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    conversationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '会话ID'
    },
    senderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '发送者ID'
    },
    senderName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '发送者名称'
    },
    senderAvatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '发送者头像'
    },
    receiverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '接收者ID'
    },
    receiverName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '接收者名称'
    },
    receiverAvatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '接收者头像'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '消息内容'
    },
    contentType: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '消息类型 1文本 2图片 3语音 4视频 5链接 6系统消息'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '消息状态 0待审核 1已发送正常 2已拦截 3已撤回 4已删除'
    },
    readStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '读取状态 0未读 1已读'
    },
    readTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '阅读时间'
    },
    riskLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '风险等级 0正常 1轻微 2中度 3重度'
    },
    violationType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '违规类型'
    },
    violationDetail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '违规详情'
    },
    sensitiveWords: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '命中敏感词'
    },
    intercepted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否被自动拦截 0否 1是'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '发送IP'
    },
    deviceInfo: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
      comment: '设备信息 JSON'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: 'User-Agent'
    },
    deletedBySender: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '发送者删除 0否 1是'
    },
    deletedByReceiver: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '接收者删除 0否 1是'
    },
    deleteTimeSender: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发送者删除时间'
    },
    deleteTimeReceiver: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '接收者删除时间'
    },
    isReported: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否被举报 0否 1是'
    },
    reportCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '举报次数'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_direct_message',
    modelName: 'DirectMessage',
    indexes: [
      { fields: ['conversation_id'] },
      { fields: ['sender_id', 'create_time'] },
      { fields: ['receiver_id', 'create_time'] },
      { fields: ['status', 'risk_level'] },
      { fields: ['intercepted', 'create_time'] },
      { fields: ['is_reported', 'report_count'] }
    ]
  }
)

export default DirectMessage
