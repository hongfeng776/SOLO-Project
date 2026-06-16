import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  ForeignKey,
  HasMany,
  BelongsTo
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User';

@Table({
  tableName: 'sys_organization',
  comment: '组织机构表'
})
export class Organization extends Model<Organization> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '父级机构ID'
  })
  parent_id?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '机构名称'
  })
  name!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '机构编码'
  })
  code!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 3,
    comment: '机构类型 1总行 2分行 3支行 4网点'
  })
  org_type!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '负责人'
  })
  leader?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '联系电话'
  })
  phone?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '邮箱'
  })
  email?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '地址'
  })
  address?: string;

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

  @HasMany(() => Organization, { foreignKey: 'parent_id' })
  children?: Organization[];

  @BelongsTo(() => Organization)
  parent?: Organization;

  @HasMany(() => User, { foreignKey: 'org_id' })
  users?: User[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: Organization) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}