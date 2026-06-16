import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'biz_audit_rule',
  comment: '审核规则表'
})
export class AuditRule extends Model<AuditRule> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '规则名称'
  })
  name!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '规则编码'
  })
  code!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '业务类型'
  })
  biz_type!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '规则类型 1金额规则 2条件规则'
  })
  rule_type!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '最小金额'
  })
  min_amount?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '最大金额'
  })
  max_amount?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '条件表达式'
  })
  condition_expression?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '审核级别 1一级 2二级 3三级'
  })
  audit_level!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '审核人ID列表(逗号分隔)'
  })
  auditor_ids?: string;

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

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: AuditRule) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}