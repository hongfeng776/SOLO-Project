import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'permission_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class PermissionConfig extends Model<PermissionConfig> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(100),
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
    comment: '权限类型：operation-操作功能 activity-活动参与 order-订单相关 marketing-营销相关',
  })
  permission_type!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '权限等级：1-基础权限 2-高级权限 3-特殊权限',
  })
  permission_level?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '最低用户等级要求：1-普通 2-银卡 3-金卡 4-钻石 5-至尊',
  })
  min_user_level?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 2,
    comment: '最大允许风险等级：0-低 1-中 2-高',
  })
  max_risk_level?: number;

  @Column({
    type: DataType.STRING(255),
    defaultValue: '1',
    comment: '允许的用户状态，逗号分隔：1-正常 2-冻结 3-注销',
  })
  allowed_status?: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: '排序',
  })
  sort_order?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @Column({
    type: DataType.STRING(255),
    comment: '权限描述',
  })
  description?: string;

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
