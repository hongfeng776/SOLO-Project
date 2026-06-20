import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ParseStatus } from '../constants/recruitment.enum';

interface ResumeParseLogAttributes {
  id: number;
  resumeId: number;
  parseStatus: ParseStatus;
  parseTime?: Date;
  parseDuration?: number;
  parsedFields?: string;
  failedFields?: string;
  errorMessage?: string;
  parseAttempts: number;
  parserVersion?: string;
  rawContent?: string;
  operatorId?: number;
  operatorName?: string;
}

interface ResumeParseLogCreationAttributes extends Optional<ResumeParseLogAttributes, 'id' | 'parseAttempts'> {}

class ResumeParseLog extends Model<ResumeParseLogAttributes, ResumeParseLogCreationAttributes> implements ResumeParseLogAttributes {
  public id!: number;
  public resumeId!: number;
  public parseStatus!: ParseStatus;
  public parseTime?: Date;
  public parseDuration?: number;
  public parsedFields?: string;
  public failedFields?: string;
  public errorMessage?: string;
  public parseAttempts!: number;
  public parserVersion?: string;
  public rawContent?: string;
  public operatorId?: number;
  public operatorName?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ResumeParseLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '解析记录ID',
    },
    resumeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '简历ID',
    },
    parseStatus: {
      type: DataTypes.ENUM('pending', 'success', 'partial', 'failed'),
      defaultValue: ParseStatus.PENDING,
      comment: '解析状态 pending-待解析 success-解析成功 partial-部分解析 failed-解析失败',
    },
    parseTime: {
      type: DataTypes.DATE,
      comment: '解析时间',
    },
    parseDuration: {
      type: DataTypes.INTEGER,
      comment: '解析耗时(毫秒)',
    },
    parsedFields: {
      type: DataTypes.TEXT,
      comment: '成功解析的字段（JSON数组）',
    },
    failedFields: {
      type: DataTypes.TEXT,
      comment: '解析失败的字段（JSON数组）',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      comment: '错误信息',
    },
    parseAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '解析尝试次数',
    },
    parserVersion: {
      type: DataTypes.STRING(50),
      comment: '解析器版本',
    },
    rawContent: {
      type: DataTypes.TEXT('long'),
      comment: '原始解析内容',
    },
    operatorId: {
      type: DataTypes.INTEGER,
      comment: '操作人ID',
    },
    operatorName: {
      type: DataTypes.STRING(50),
      comment: '操作人姓名',
    },
  },
  {
    sequelize,
    tableName: 'resume_parse_log',
    comment: '简历解析记录表',
    indexes: [
      { fields: ['resumeId'] },
      { fields: ['parseStatus'] },
      { fields: ['parseTime'] },
    ],
  }
);

export default ResumeParseLog;
