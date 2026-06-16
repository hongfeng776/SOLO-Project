import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  BelongsToMany
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User';
import { UserRole } from './UserRole';
import { Permission } from './Permission';
import { RolePermission } from './RolePermission';

@Table({
  tableName: 'sys_role',
  comment: '角色表'
})
export class Role extends Model<Role> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '角色名称'
  })
  name!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '角色编码'
  })
  code!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '描述'
  })
  description?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '排序'
  })
  sort?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 0禁用 1启用'
  })
  status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 1,
    comment: '数据权限 1全部 2本机构 3本机构及以下 4仅本人 5自定义'
  })
  data_scope?: number;

  @BelongsToMany(() => User, () => UserRole)
  users!: User[];

  @BelongsToMany(() => Permission, () => RolePermission)
  permissions!: Permission[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: Role) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}