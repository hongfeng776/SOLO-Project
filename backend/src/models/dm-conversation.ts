import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class DmConversation extends Model<InferAttributes<DmConversation>, InferCreationAttributes<DmConversation>> {
  declare id: CreationOptional<number>
  declare participantAId: number
  declare participantAName: string
  declare participantAAvatar: CreationOptional<string>
  declare participantBId: number
  declare participantBName: string
  declare participantBAvatar: CreationOptional<string>
  declare lastMessageId: CreationOptional<number>
  declare lastMessageContent: CreationOptional<string>
  declare lastMessageTime: CreationOptional<Date | null>
  declare messageCount: CreationOptional<number>
  declare unreadCountA: CreationOptional<number>
  declare unreadCountB: CreationOptional<number>
  declare violationCount: CreationOptional<number>
  declare riskLevel: CreationOptional<number>
  declare isBlockedByA: CreationOptional<number>
  declare isBlockedByB: CreationOptional<number>
  declare isMutedByA: CreationOptional<number>
  declare isMutedByB: CreationOptional<number>
  declare blockReasonA: CreationOptional<string>
  declare blockReasonB: CreationOptional<string>
  declare status: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

DmConversation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    participantAId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '参与者A用户ID（较小ID方）'
    },
    participantAName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '参与者A用户名'
    },
    participantAAvatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '参与者A头像'
    },
    participantBId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '参与者B用户ID（较大ID方）'
    },
    participantBName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '参与者B用户名'
    },
    participantBAvatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '参与者B头像'
    },
    lastMessageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '最后一条消息ID'
    },
    lastMessageContent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '最后一条消息内容预览'
    },
    lastMessageTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后一条消息时间'
    },
    messageCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '消息总数'
    },
    unreadCountA: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'A方未读数'
    },
    unreadCountB: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'B方未读数'
    },
    violationCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '违规消息数'
    },
    riskLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '风险等级 0正常 1轻微 2中度 3重度'
    },
    isBlockedByA: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '被A方拉黑 0否 1是'
    },
    isBlockedByB: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '被B方拉黑 0否 1是'
    },
    isMutedByA: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'A方免打扰 0否 1是'
    },
    isMutedByB: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'B方免打扰 0否 1是'
    },
    blockReasonA: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
      comment: 'A方拉黑原因'
    },
    blockReasonB: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
      comment: 'B方拉黑原因'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '会话状态 0封禁 1正常 2限制私信'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_dm_conversation',
    modelName: 'DmConversation',
    indexes: [
      { fields: ['participant_a_id', 'participant_b_id'], unique: true },
      { fields: ['risk_level', 'status'] },
      { fields: ['violation_count'], order: 'DESC' },
      { fields: ['last_message_time'], order: 'DESC' }
    ]
  }
)

export default DmConversation
