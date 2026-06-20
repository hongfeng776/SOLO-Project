import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { MatchLevel, ResumeTag, ScreenAction } from '../constants/recruitment.enum';

interface ResumeScreenLogAttributes {
  id: number;
  resumeId: number;
  jobId: number;
  action: ScreenAction;
  screenConditions?: string;
  matchLevelBefore?: MatchLevel;
  matchLevelAfter?: MatchLevel;
  matchScoreBefore?: number;
  matchScoreAfter?: number;
  tagBefore?: ResumeTag;
  tagAfter?: ResumeTag;
  conflictDetected?: boolean;
  conflictReason?: string;
  isDuplicateScreen?: boolean;
  operatorId?: number;
  operatorName?: string;
  remark?: string;
}

interface ResumeScreenLogCreationAttributes extends Optional<ResumeScreenLogAttributes, 'id'> {}

class ResumeScreenLog extends Model<ResumeScreenLogAttributes, ResumeScreenLogCreationAttributes> implements ResumeScreenLogAttributes {
  public id!: number;
  public resumeId!: number;
  public jobId!: number;
  public action!: ScreenAction;
  public screenConditions?: string;
  public matchLevelBefore?: MatchLevel;
  public matchLevelAfter?: MatchLevel;
  public matchScoreBefore?: number;
  public matchScoreAfter?: number;
  public tagBefore?: ResumeTag;
  public tagAfter?: ResumeTag;
  public conflictDetected?: boolean;
  public conflictReason?: string;
  public isDuplicateScreen?: boolean;
  public operatorId?: number;
  public operatorName?: string;
  public remark?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ResumeScreenLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '筛选记录ID',
    },
    resumeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '简历ID',
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '岗位ID',
    },
    action: {
      type: DataTypes.ENUM('screen', 'match', 'tag', 'batch_screen', 'batch_tag', 'refresh_match'),
      allowNull: false,
      comment: '操作类型 screen-筛选 match-匹配 tag-标记 batch_screen-批量筛选 batch_tag-批量标记 refresh_match-刷新匹配',
    },
    screenConditions: {
      type: DataTypes.TEXT,
      comment: '筛选条件（JSON格式）',
    },
    matchLevelBefore: {
      type: DataTypes.ENUM('high', 'medium', 'low', 'none'),
      comment: '操作前匹配等级',
    },
    matchLevelAfter: {
      type: DataTypes.ENUM('high', 'medium', 'low', 'none'),
      comment: '操作后匹配等级',
    },
    matchScoreBefore: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '操作前匹配分值',
    },
    matchScoreAfter: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '操作后匹配分值',
    },
    tagBefore: {
      type: DataTypes.ENUM('quality', 'follow_up', 'invalid'),
      comment: '操作前简历标记',
    },
    tagAfter: {
      type: DataTypes.ENUM('quality', 'follow_up', 'invalid'),
      comment: '操作后简历标记',
    },
    conflictDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否检测到筛选规则冲突',
    },
    conflictReason: {
      type: DataTypes.TEXT,
      comment: '冲突原因',
    },
    isDuplicateScreen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否重复筛选操作',
    },
    operatorId: {
      type: DataTypes.INTEGER,
      comment: '操作人ID',
    },
    operatorName: {
      type: DataTypes.STRING(50),
      comment: '操作人姓名',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'resume_screen_log',
    comment: '简历筛选匹配记录表',
    indexes: [
      { fields: ['resumeId'] },
      { fields: ['jobId'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
    ],
  }
);

export default ResumeScreenLog;
