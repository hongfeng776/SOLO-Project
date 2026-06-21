import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'
import {
  CampaignType
} from '@/enums/business'

class ActivityTemplate extends Model<InferAttributes<ActivityTemplate>, InferCreationAttributes<ActivityTemplate>> {
  declare id: CreationOptional<number>
  declare name: string
  declare description: string
  declare coverImage: string
  declare type: string
  declare scenes: string
  declare durationDays: CreationOptional<number>
  declare participantScopeType: string
  declare participantScopeConfig: string
  declare participantThreshold: CreationOptional<number>
  declare maxParticipants: CreationOptional<number>
  declare rewardRules: string
  declare rewardBudget: CreationOptional<number>
  declare rewardRatio: CreationOptional<number>
  declare rules: string
  declare priority: CreationOptional<number>
  declare homePageDisplay: CreationOptional<number>
  declare entryHighlightConfig: string
  declare useCount: CreationOptional<number>
  declare status: CreationOptional<number>
  declare creatorId: CreationOptional<number>
  declare creatorName: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

ActivityTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '模板名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
      comment: '模板描述'
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '默认封面图'
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: CampaignType.PROMOTION,
      comment: '活动类型'
    },
    scenes: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '[]',
      comment: '默认适配场景JSON数组'
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      comment: '默认活动时长（天）'
    },
    participantScopeType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'all_users',
      comment: '默认参与范围类型'
    },
    participantScopeConfig: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '{}',
      comment: '默认参与范围配置JSON'
    },
    participantThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '默认参与门槛'
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: '默认最大参与人数'
    },
    rewardRules: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]',
      comment: '默认奖励规则JSON数组'
    },
    rewardBudget: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '默认奖励总预算'
    },
    rewardRatio: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      comment: '默认奖励配比'
    },
    rules: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
      comment: '默认活动规则说明'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '默认优先级'
    },
    homePageDisplay: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '默认首页是否展示 0否 1是'
    },
    entryHighlightConfig: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '{}',
      comment: '默认入口高亮配置JSON'
    },
    useCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '使用次数'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态 0禁用 1启用'
    },
    creatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '创建人ID'
    },
    creatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '创建人名称'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '备注'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_activity_template',
    modelName: 'ActivityTemplate',
    indexes: [
      { fields: ['type', 'status'] },
      { fields: ['creator_id'] }
    ]
  }
)

export default ActivityTemplate
