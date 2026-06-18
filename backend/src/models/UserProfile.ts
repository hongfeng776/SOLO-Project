import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'user_profiles',
  timestamps: false,
})
export class UserProfile extends Model<UserProfile> {
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
    type: DataType.STRING(50),
    allowNull: false,
    comment: '修改字段名',
  })
  field_name!: string;

  @Column({
    type: DataType.TEXT,
    comment: '旧值',
  })
  old_value?: string;

  @Column({
    type: DataType.TEXT,
    comment: '新值',
  })
  new_value?: string;

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

  @CreatedAt
  @Column({
    type: DataType.DATE,
    comment: '操作时间',
  })
  operate_time!: Date;

  @Column({
    type: DataType.STRING(45),
    comment: '操作IP',
  })
  operate_ip?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '备注',
  })
  remark?: string;
}
