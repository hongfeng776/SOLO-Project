import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'register_channels',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class RegisterChannel extends Model<RegisterChannel> {
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
    comment: '渠道编码',
  })
  channel_code!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '渠道名称',
  })
  channel_name!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否需要审核：0-否 1-是',
  })
  need_audit?: number;

  @Column({
    type: DataType.STRING(255),
    comment: '描述',
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
