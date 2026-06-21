import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { RegularizationApprovalNode } from '../constants/recruitment.enum';

interface RegularizationApprovalRecordAttributes {
  id: number;
  regularizationId: number;
  nodeKey?: RegularizationApprovalNode;
  nodeName?: string;
  nodeIndex?: number;
  nodeStatus?: 'pending' | 'approved' | 'rejected' | 'skipped';
  approverUserId?: number;
  approverUserName?: string;
  approverRole?: string;
  approveTime?: Date;
  approveOpinion?: string;
  approveAction?: 'approve' | 'reject' | 'transfer' | 'skip';
  approveAttachments?: any;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string;
  userAgent?: string;
}

interface RegularizationApprovalRecordCreationAttributes
  extends Optional<RegularizationApprovalRecordAttributes, 'id'> {}

class RegularizationApprovalRecord
  extends Model<RegularizationApprovalRecordAttributes, RegularizationApprovalRecordCreationAttributes>
  implements RegularizationApprovalRecordAttributes
{
  public id!: number;
  public regularizationId!: number;
  public nodeKey?: RegularizationApprovalNode;
  public nodeName?: string;
  public nodeIndex?: number;
  public nodeStatus?: 'pending' | 'approved' | 'rejected' | 'skipped';
  public approverUserId?: number;
  public approverUserName?: string;
  public approverRole?: string;
  public approveTime?: Date;
  public approveOpinion?: string;
  public approveAction?: 'approve' | 'reject' | 'transfer' | 'skip';
  public approveAttachments?: any;
  public beforeData?: any;
  public afterData?: any;
  public ipAddress?: string;
  public userAgent?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

RegularizationApprovalRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '审批记录ID',
    },
    regularizationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '转正记录ID',
    },
    nodeKey: {
      type: DataTypes.ENUM('dept_head', 'hr', 'hr_super', 'finance', 'admin'),
      comment: '审批节点标识',
    },
    nodeName: {
      type: DataTypes.STRING(50),
      comment: '审批节点名称',
    },
    nodeIndex: {
      type: DataTypes.INTEGER,
      comment: '审批节点顺序',
    },
    nodeStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'skipped'),
      comment: '节点状态 pending待审批 approved已通过 rejected已驳回 skipped已跳过',
    },
    approverUserId: {
      type: DataTypes.INTEGER,
      comment: '审批人用户ID',
    },
    approverUserName: {
      type: DataTypes.STRING(50),
      comment: '审批人姓名',
    },
    approverRole: {
      type: DataTypes.STRING(30),
      comment: '审批人角色',
    },
    approveTime: {
      type: DataTypes.DATE,
      comment: '审批时间',
    },
    approveOpinion: {
      type: DataTypes.TEXT,
      comment: '审批意见',
    },
    approveAction: {
      type: DataTypes.ENUM('approve', 'reject', 'transfer', 'skip'),
      comment: '审批动作 approve通过 reject驳回 transfer转办 skip跳过',
    },
    approveAttachments: {
      type: DataTypes.JSON,
      comment: '审批附件(JSON数组)',
    },
    beforeData: {
      type: DataTypes.JSON,
      comment: '审批前数据(JSON)',
    },
    afterData: {
      type: DataTypes.JSON,
      comment: '审批后数据(JSON)',
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      comment: '操作IP地址',
    },
    userAgent: {
      type: DataTypes.STRING(500),
      comment: '操作UA',
    },
  },
  {
    sequelize,
    tableName: 'regularization_approval_record',
    comment: '转正审批节点记录表',
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['regularizationId'] },
      { fields: ['nodeKey'] },
      { fields: ['nodeIndex'] },
      { fields: ['nodeStatus'] },
      { fields: ['approverUserId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default RegularizationApprovalRecord;
export type { RegularizationApprovalRecordAttributes, RegularizationApprovalRecordCreationAttributes };
