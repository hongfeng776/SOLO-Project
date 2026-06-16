import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'admins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Admin extends Model<Admin> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名',
  })
  username!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '密码',
  })
  password!: string;

  @Column({
    type: DataType.STRING(50),
    comment: '昵称',
  })
  nickname?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '头像',
  })
  avatar?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '角色：1-超级管理员 2-普通管理员',
  })
  role?: number;

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
