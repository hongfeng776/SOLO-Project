import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum ServiceEvaluationType {
  TIMELINESS = 'timeliness',
  DAMAGE = 'damage',
  LOSS = 'loss',
  ATTITUDE = 'attitude',
  COMPLAINT = 'complaint',
  OVERALL = 'overall',
}

@Table({
  tableName: 'logistics_service_evaluations',
  timestamps: false,
  indexes: [
    {
      name: 'idx_provider_id',
      fields: ['provider_id'],
    },
    {
      name: 'idx_evaluation_type',
      fields: ['evaluation_type'],
    },
    {
      name: 'idx_order_id',
      fields: ['order_id'],
    },
    {
      name: 'idx_rating',
      fields: ['rating'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
    {
      name: 'uk_evaluation_no',
      fields: ['evaluation_no'],
      unique: true,
    },
  ],
})
export class LogisticsServiceEvaluation extends Model<LogisticsServiceEvaluation> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    unique: true,
    comment: '评价编号',
  })
  evaluation_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '物流服务商ID',
  })
  provider_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '关联订单ID',
  })
  order_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '关联订单号',
  })
  order_no?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '关联发货记录ID',
  })
  shipment_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '评价类型：timeliness-时效 damage-破损 loss-丢失 attitude-服务态度 complaint-投诉 overall-综合',
  })
  evaluation_type?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '评分：1-5星',
  })
  rating!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '时效评分（小时，实际-承诺，正数为超时）',
  })
  timeliness_score?: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '是否存在破损',
  })
  has_damage?: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '是否存在丢失',
  })
  has_loss?: boolean;

  @Column({
    type: DataType.DECIMAL(14, 2),
    comment: '赔付金额（元）',
  })
  compensation_amount?: number;

  @Column({
    type: DataType.TEXT,
    comment: '评价内容',
  })
  content?: string;

  @Column({
    type: DataType.STRING(200),
    comment: '评价图片URL（多个逗号分隔）',
  })
  image_urls?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '评价人ID',
  })
  evaluator_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '评价人名称',
  })
  evaluator_name?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '评价人类型：0-用户 1-平台 2-商家',
  })
  evaluator_type?: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '是否已申诉处理',
  })
  is_appealed?: boolean;

  @Column({
    type: DataType.STRING(500),
    comment: '申诉处理结果',
  })
  appeal_result?: string;

  @Column({
    type: DataType.DATE,
    comment: '申诉处理时间',
  })
  appeal_handled_at?: Date;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
