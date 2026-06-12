import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt, Unique, Default } from 'sequelize-typescript';

export interface UserAttributes {
  id: number;
  username: string;
  password: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: number;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'avatar' | 'phone' | 'email' | 'role' | 'status'> {
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  status?: number;
}

@Table({ tableName: 'sys_user' })
export default class User extends Model<UserAttributes, UserCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Unique
  @Column({ type: DataType.STRING(50), allowNull: false, comment: '用户名' })
  username!: string;

  @Column({ type: DataType.STRING(255), allowNull: false, comment: '密码（哈希）' })
  password!: string;

  @Column({ type: DataType.STRING(50), allowNull: false, comment: '昵称' })
  nickname!: string;

  @Column({ type: DataType.STRING(100), comment: '邮箱' })
  email?: string;

  @Column({ type: DataType.STRING(20), comment: '手机号' })
  phone?: string;

  @Column({ type: DataType.STRING(500), comment: '头像URL' })
  avatar?: string;

  @Default('user')
  @Column({ type: DataType.STRING(20), allowNull: false, comment: '角色: admin/user' })
  role!: string;

  @Default(1)
  @Column({ type: DataType.TINYINT, allowNull: false, comment: '状态: 1启用 0禁用' })
  status!: number;

  @Column({ type: DataType.DATE, comment: '最后登录时间' })
  lastLoginAt?: Date;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  updatedAt!: Date;

  toJSON(): Omit<UserAttributes, 'password'> {
    const values = { ...this.get() } as any;
    delete values.password;
    return values;
  }
}
