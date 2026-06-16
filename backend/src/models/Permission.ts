import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  BelongsToMany,
  ForeignKey,
  HasMany
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Role } from './Role';
import { RolePermission } from './RolePermission';

@Table({
  tableName: 'sys_permission',
  comment: '权限表'
})
export class Permission extends Model<Permission> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @ForeignKey(() => Permission)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '父级ID'
  })
  parent_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '权限名称'
  })
  name!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '权限编码'
  })
  code!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '类型 1目录 2菜单 3按钮'
  })
  type!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '路由地址'
  })
  path?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '图标'
  })
  icon?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '组件路径'
  })
  component?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '排序'
  })
  sort?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 1,
    comment: '是否显示 0隐藏 1显示'
  })
  visible?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 0禁用 1启用'
  })
  status!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '重定向地址'
  })
  redirect?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '权限标识'
  })
  perms?: string;

  @BelongsToMany(() => Role, () => RolePermission)
  roles!: Role[];

  @HasMany(() => Permission, { foreignKey: 'parent_id' })
  children?: Permission[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: Permission) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}