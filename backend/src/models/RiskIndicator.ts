import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  Index
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'risk_indicator',
  comment: '风险指标配置表'
})
export class RiskIndicator extends Model<RiskIndicator> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '指标编码'
  })
  indicator_code!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '指标名称'
  })
  indicator_name!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '指标类别 1征信类 2交易类 3负债类 4涉诉类 5开户行为类'
  })
  category!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '指标权重(%)'
  })
  weight!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 100,
    comment: '指标满分'
  })
  max_score!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '评分规则(JSON格式)'
  })
  scoring_rule?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否必填 0否 1是'
  })
  is_required!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 0禁用 1启用'
  })
  status!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序'
  })
  sort_order!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '指标说明'
  })
  description?: string;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: RiskIndicator) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
