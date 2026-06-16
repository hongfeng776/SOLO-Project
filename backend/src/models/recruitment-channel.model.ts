import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RecruitmentChannelAttributes {
  id: number;
  name: string;
  code: string;
  type?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  cooperationMode?: string;
  cost?: number;
  status: number;
  sort: number;
  remark?: string;
}

interface RecruitmentChannelCreationAttributes
  extends Optional<RecruitmentChannelAttributes, 'id' | 'status' | 'sort'> {}

class RecruitmentChannel
  extends Model<RecruitmentChannelAttributes, RecruitmentChannelCreationAttributes>
  implements RecruitmentChannelAttributes
{
  public id!: number;
  public name!: string;
  public code!: string;
  public type?: string;
  public contactPerson?: string;
  public contactPhone?: string;
  public contactEmail?: string;
  public cooperationMode?: string;
  public cost?: number;
  public status!: number;
  public sort!: number;
  public remark?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

RecruitmentChannel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '渠道ID',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '渠道名称',
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '渠道编码',
    },
    type: {
      type: DataTypes.STRING(50),
      comment: '渠道类型',
    },
    contactPerson: {
      type: DataTypes.STRING(50),
      comment: '联系人',
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      comment: '联系电话',
    },
    contactEmail: {
      type: DataTypes.STRING(100),
      comment: '联系邮箱',
    },
    cooperationMode: {
      type: DataTypes.STRING(50),
      comment: '合作方式',
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      comment: '渠道费用',
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态 0-禁用 1-启用',
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'recruitment_channel',
    comment: '招聘渠道表',
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default RecruitmentChannel;
