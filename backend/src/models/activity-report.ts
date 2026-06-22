import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ActivityReport extends Model<
  InferAttributes<ActivityReport>,
  InferCreationAttributes<ActivityReport>
> {
  declare id: CreationOptional<number>
  declare reportNo: string
  declare activityId: CreationOptional<number>
  declare activityName: CreationOptional<string>
  declare activityIds: CreationOptional<string>
  declare reportType: string
  declare reportName: string
  declare status: CreationOptional<number>
  declare customFields: CreationOptional<string>
  declare sortRule: CreationOptional<string>
  declare filterConditions: CreationOptional<string>
  declare summaryData: CreationOptional<string>
  declare comparisonData: CreationOptional<string>
  declare anomalySummary: CreationOptional<string>
  declare optimizationSuggestions: CreationOptional<string>
  declare exportStatus: CreationOptional<number>
  declare exportFileUrl: CreationOptional<string>
  declare exportFileSize: CreationOptional<number>
  declare exportExpireTime: CreationOptional<Date | null>
  declare generateProgress: CreationOptional<number>
  declare startTime: CreationOptional<Date>
  declare endTime: CreationOptional<Date>
  declare generateTime: CreationOptional<Date | null>
  declare isLocked: CreationOptional<number>
  declare lockedTime: CreationOptional<Date | null>
  declare lockOperatorId: CreationOptional<number>
  declare lockOperatorName: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare batchId: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

ActivityReport.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    reportNo: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '报表编号（唯一）'
    },
    activityId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '关联单活动ID（单活动报表）'
    },
    activityName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
      comment: '活动名称快照'
    },
    activityIds: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '多活动ID列表(JSON数组，用于批量对比报表)'
    },
    reportType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'single_review',
      comment: '报表类型 single_review/batch_compare/export/custom'
    },
    reportName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '报表名称'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '报表状态 0草稿 1自动生成 2审核中 3已锁定 4已导出 5已归档'
    },
    customFields: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '自定义字段列表(JSON数组)'
    },
    sortRule: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '排序规则(JSON)'
    },
    filterConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '筛选条件(JSON)'
    },
    summaryData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '汇总数据(JSON，含核心指标)'
    },
    comparisonData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '对比数据(JSON，批量对比时)'
    },
    anomalySummary: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '异常维度汇总(JSON)'
    },
    optimizationSuggestions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '优化建议列表(JSON数组)'
    },
    exportStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '导出状态 0待生成 1生成中 2成功 3失败 4过期'
    },
    exportFileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '导出文件下载地址'
    },
    exportFileSize: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: '导出文件大小(bytes)'
    },
    exportExpireTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '导出文件过期时间'
    },
    generateProgress: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '生成进度(0-100，用于批量导出进度条)'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '报表覆盖开始时间'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '报表覆盖结束时间'
    },
    generateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '报表生成完成时间'
    },
    isLocked: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '核心数据是否锁定 0否 1是（禁止人工修改）'
    },
    lockedTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '锁定时间'
    },
    lockOperatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '锁定操作人ID'
    },
    lockOperatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '锁定操作人名称'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '备注'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作人名称'
    },
    batchId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '批量操作关联号'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_activity_report',
    modelName: 'ActivityReport',
    paranoid: true,
    indexes: [
      { unique: true, fields: ['report_no'] },
      { fields: ['activity_id', 'create_time'] },
      { fields: ['status', 'create_time'] },
      { fields: ['export_status', 'create_time'] },
      { fields: ['report_type', 'create_time'] },
      { fields: ['is_locked', 'create_time'] }
    ]
  }
)

export default ActivityReport
