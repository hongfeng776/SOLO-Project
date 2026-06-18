import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'user_freeze_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class UserFreezeRecord extends Model<UserFreezeRecord> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '冻结类型：1-临时冻结 2-永久冻结',
  })
  freeze_type!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '冻结原因',
  })
  freeze_reason!: string;

  @Column({
    type: DataType.DATE,
    comment: '冻结时间',
  })
  freeze_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '解冻时间',
  })
  unfreeze_time?: Date;

  @Column({
    type: DataType.STRING(255),
    comment: '解冻原因',
  })
  unfreeze_reason?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人姓名',
  })
  operator_name?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：1-冻结中 2-已解冻',
  })
  status?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '备注',
  })
  remark?: string;

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
