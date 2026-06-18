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
import { CustomerProfileBatch } from './CustomerProfileBatch';

@Table({
  tableName: 'biz_customer_profile_batch_item',
  comment: '客户档案批量导入明细表'
})
export class CustomerProfileBatchItem extends Model<CustomerProfileBatchItem> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @ForeignKey(() => CustomerProfileBatch)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '批次ID'
  })
  batch_id!: string;

  @BelongsTo(() => CustomerProfileBatch)
  batch?: CustomerProfileBatch;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '行号'
  })
  row_index!: number;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '生成的档案ID'
  })
  profile_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '客户姓名'
  })
  customer_name?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '证件号码'
  })
  id_card_no?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '证件类型'
  })
  id_type?: number;

  @Column({
    type: DataType.STRING(16),
    allowNull: true,
    comment: '性别'
  })
  gender?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '手机号'
  })
  mobile?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '户籍地址'
  })
  registered_address?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '居住地址'
  })
  residential_address?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '职业'
  })
  occupation?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '工作单位'
  })
  employer?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '资产规模'
  })
  total_assets?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '月均交易频次'
  })
  monthly_transaction_count?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '留存天数'
  })
  retention_days?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '处理结果 0未处理 1成功 2失败 3待完善 4异常待复核'
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
    comment: '错误信息列表，JSON格式'
  })
  error_fields?: string;

  @Column({
    type: DataType.STRING(1024),
    allowNull: true,
    comment: '缺失字段列表，JSON格式'
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
  static generateId(instance: CustomerProfileBatchItem) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
