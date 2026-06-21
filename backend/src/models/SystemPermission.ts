import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'system_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SystemPermission extends Model<SystemPermission> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: '权限编码',
  })
  permission_code!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '权限名称',
  })
  permission_name!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '权限分组：basic-基础 marketing-营销 order-下单 review-评价 activity-活动 info-信息管理',
  })
  permission_group!: string;

  @Column({
    type: DataType.STRING(255),
    comment: '权限描述',
  })
  permission_desc?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '最低用户等级要求：1-普通 2-银卡 3-金卡 4-钻石 5-至尊',
  })
  required_level?: number;

  @Column({
    type: DataType.STRING(100),
    defaultValue: '1',
    comment: '允许的账号状态：1-正常 2-冻结 3-注销，逗号分隔',
  })
  allowed_status?: string;

  @Column({
    type: DataType.STRING(100),
    defaultValue: '0,1',
    comment: '允许的风险等级：0-低 1-中 2-高，逗号分隔',
  })
  allowed_risk_levels?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否默认权限：0-否 1-是',
  })
  is_default?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否系统权限：0-否 1-是（不可删除）',
  })
  is_system?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序值',
  })
  sort_order?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  updated_at!: Date;
}
