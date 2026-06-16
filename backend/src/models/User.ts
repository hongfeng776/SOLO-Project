import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BelongsToMany,
  BelongsTo,
  ForeignKey
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Role } from './Role';
import { UserRole } from './UserRole';
import { Organization } from './Organization';

@Table({
  tableName: 'sys_user',
  comment: '用户表'
})
export class User extends Model<User> {
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
    unique: true,
    comment: '用户名'
  })
  username!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '密码(加密)'
  })
  password!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '真实姓名'
  })
  real_name?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    validate: { isEmail: true },
    comment: '邮箱'
  })
  email?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '手机号'
  })
  phone?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '头像URL'
  })
  avatar?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 0,
    comment: '性别 0未知 1男 2女'
  })
  gender?: number;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '所属机构ID'
  })
  org_id?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 0禁用 1启用'
  })
  status!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '最后登录时间'
  })
  last_login_at?: Date;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '最后登录IP'
  })
  last_login_ip?: string;

  @BelongsToMany(() => Role, () => UserRole)
  roles!: Role[];

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BeforeCreate
  static generateId(instance: User) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}