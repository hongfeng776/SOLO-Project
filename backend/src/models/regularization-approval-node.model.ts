import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { RegularizationApprovalNode } from '../constants/recruitment.enum';

interface RegularizationApprovalNodeRecordAttributes {
  id: number;
  regularizationId: number;
  nodeKey: RegularizationApprovalNode;
  nodeName?: string;
  nodeIndex: number;
  nodeStatus: 'pending' | 'approved' | 'rejected' | 'skipped';
  approverId?: number;
  approverName?: string;
  approverRole?: string;
  approveTime?: Date;
  opinion?: string;
  attachments?: any;
  version?: number;
  remark?: string;
}

interface RegularizationApprovalNodeRecordCreationAttributes
  extends Optional<RegularizationApprovalNodeRecordAttributes, 'id' | 'nodeStatus' | 'version'> {}

class RegularizationApprovalNodeRecord extends Model<
  RegularizationApprovalNodeRecordAttributes,
  RegularizationApprovalNodeRecordCreationAttributes
> implements RegularizationApprovalNodeRecordAttributes {
  public id!: number;
  public regularizationId!: number;
  public nodeKey!: RegularizationApprovalNode;
  public nodeName?: string;
  public nodeIndex!: number;
  public nodeStatus!: 'pending' | 'approved' | 'rejected' | 'skipped';
  public approverId?: number;
  public approverName?: string;
  public approverRole?: string;
  public approveTime?: Date;
  public opinion?: string;
  public attachments?: any;
  public version?: number;
  public remark?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

RegularizationApprovalNodeRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '审批节点记录ID',
    },
    regularizationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '转正申请ID',
    },
    nodeKey: {
      type: DataTypes.ENUM('dept_head', 'hr', 'hr_super', 'finance', 'admin'),
      allowNull: false,
      comment: '节点标识 dept_head部门负责人 hr HR hr_super HR主管 finance财务 admin管理员',
    },
    nodeName: {
      type: DataTypes.STRING(50),
      comment: '节点名称',
    },
    nodeIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '节点顺序索引',
    },
    nodeStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'skipped'),
      defaultValue: 'pending',
      comment: '节点状态 pending待审批 approved已通过 rejected已驳回 skipped已跳过',
    },
    approverId: {
      type: DataTypes.INTEGER,
      comment: '审批人用户ID',
    },
    approverName: {
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
    opinion: {
      type: DataTypes.TEXT,
      comment: '审批意见',
    },
    attachments: {
      type: DataTypes.JSON,
      comment: '审批附件(JSON数组)',
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '版本号(乐观锁)',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'regularization_approval_node',
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
      { fields: ['approverId'] },
      { fields: ['regularizationId', 'nodeIndex'], unique: false },
    ],
  }
);

export default RegularizationApprovalNodeRecord;
export type {
  RegularizationApprovalNodeRecordAttributes,
  RegularizationApprovalNodeRecordCreationAttributes,
};
