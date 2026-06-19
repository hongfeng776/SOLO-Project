import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  Index,
  ForeignKey,
  BelongsTo,
  HasMany
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';
import { CorporateProfileBatchItem } from './CorporateProfileBatchItem';

@Table({
  tableName: 'biz_corporate_profile_batch',
  comment: '对公客户批量更新批次表'
})
export class CorporateProfileBatch extends Model<CorporateProfileBatch> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: '批次编号'
  })
  batch_no!: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '归属机构ID'
  })
  org_id?: string;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '批次名称'
  })
  batch_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '更新类型 1经营信息 2资质信息 3风控等级 4综合更新'
  })
  update_type!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总记录数'
  })
  total_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '成功数'
  })
  success_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '失败数'
  })
  fail_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '待完善数'
  })
  need_complete_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '人工复核数'
  })
  review_count!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '导入文件URL'
  })
  file_url?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '文件名'
  })
  file_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '批次状态 0待处理 1处理中 2已完成 3部分完成 4已取消'
  })
  status!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '失败原因'
  })
  fail_reason?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '创建人ID'
  })
  creator_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '创建人姓名'
  })
  creator_name?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '创建时间'
  })
  import_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '完成时间'
  })
  finish_time?: Date;

  @HasMany(() => CorporateProfileBatchItem, { foreignKey: 'batch_id', constraints: false })
  items?: CorporateProfileBatchItem[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: CorporateProfileBatch) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
