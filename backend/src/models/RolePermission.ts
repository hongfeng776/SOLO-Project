import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  ForeignKey,
  BeforeCreate,
  BeforeValidate
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Role } from './Role';
import { Permission } from './Permission';

@Table({
  tableName: 'sys_role_permission',
  comment: '角色权限关联表'
})
export class RolePermission extends Model<RolePermission> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '角色ID'
  })
  role_id!: string;

  @ForeignKey(() => Permission)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '权限ID'
  })
  permission_id!: string;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: RolePermission) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
