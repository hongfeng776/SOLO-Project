import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  ForeignKey,
  BeforeCreate
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User';
import { Role } from './Role';

@Table({
  tableName: 'sys_user_role',
  comment: '用户角色关联表'
})
export class UserRole extends Model<UserRole> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '用户ID'
  })
  user_id!: string;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '角色ID'
  })
  role_id!: string;

  @BeforeCreate
  static generateId(instance: UserRole) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
