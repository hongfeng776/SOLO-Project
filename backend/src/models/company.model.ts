import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CompanyAttributes {
  id: number;
  name: string;
  shortName?: string;
  logo?: string;
  industry?: string;
  scale?: string;
  nature?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  status: number;
  sort: number;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'status' | 'sort'> {}

class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: number;
  public name!: string;
  public shortName?: string;
  public logo?: string;
  public industry?: string;
  public scale?: string;
  public nature?: string;
  public address?: string;
  public contactPerson?: string;
  public contactPhone?: string;
  public contactEmail?: string;
  public description?: string;
  public status!: number;
  public sort!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Company.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '企业ID',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '企业名称',
    },
    shortName: {
      type: DataTypes.STRING(50),
      comment: '企业简称',
    },
    logo: {
      type: DataTypes.STRING(255),
      comment: '企业Logo',
    },
    industry: {
      type: DataTypes.STRING(50),
      comment: '所属行业',
    },
    scale: {
      type: DataTypes.STRING(50),
      comment: '企业规模',
    },
    nature: {
      type: DataTypes.STRING(50),
      comment: '企业性质',
    },
    address: {
      type: DataTypes.STRING(255),
      comment: '企业地址',
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
    description: {
      type: DataTypes.TEXT,
      comment: '企业简介',
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
  },
  {
    sequelize,
    tableName: 'company',
    comment: '企业信息表',
  }
);

export default Company;
