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
  BelongsTo
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { CorporateProfileBatch } from './CorporateProfileBatch';

@Table({
  tableName: 'biz_corporate_profile_batch_item',
  comment: '对公客户批量更新明细表'
})
export class CorporateProfileBatchItem extends Model<CorporateProfileBatchItem> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @ForeignKey(() => CorporateProfileBatch)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '批次ID'
  })
  batch_id!: string;

  @BelongsTo(() => CorporateProfileBatch)
  batch?: CorporateProfileBatch;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '行号'
  })
  row_index!: number;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '对公客户ID'
  })
  profile_id?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '企业名称'
  })
  enterprise_name?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '统一社会信用代码'
  })
  credit_code?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '经营状态'
  })
  business_status?: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '行业分类'
  })
  industry_type?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '注册资本'
  })
  registered_capital?: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '资质信息'
  })
  qualification_info?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '风控等级'
  })
  risk_level?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '处理结果 0未处理 1成功 2失败 3待完善 4待复核'
  })
  process_result!: number;

  @Column({
    type: DataType.STRING(1024),
    allowNull: true,
    comment: '处理结果描述'
  })
  process_message?: string;

  @Column({
    type: DataType.STRING(1024),
    allowNull: true,
    comment: '错误字段JSON'
  })
  error_fields?: string;

  @Column({
    type: DataType.STRING(1024),
    allowNull: true,
    comment: '缺失字段JSON'
  })
  missing_fields?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 1有效 0无效'
  })
  status!: number;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: CorporateProfileBatchItem) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
