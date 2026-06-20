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
  tableName: 'monitor_rule',
  comment: '监控规则配置表'
})
export class MonitorRule extends Model<MonitorRule> {
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
    comment: '规则编码'
  })
  rule_code!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '规则名称'
  })
  rule_name!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '规则类型 1高频交易监控 2异地交易监控 3大额异动监控 4夜间异常监控'
  })
  rule_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '监控维度 1频次 2金额 3地域 4时间 5设备 6场景'
  })
  dimension!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否启用 0禁用 1启用'
  })
  is_enabled!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '优先级(数值越大优先级越高)'
  })
  priority!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '阈值配置(JSON)'
  })
  threshold_config?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '风险等级映射(JSON)'
  })
  risk_level_mapping?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '预警动作 1仅预警 2预警+拦截 3预警+拦截+强制复核'
  })
  alert_action!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否必选规则 0否 1是'
  })
  is_required!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '规则说明'
  })
  description?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序'
  })
  sort_order!: number;

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
    comment: '累计触发次数'
  })
  trigger_count!: number;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: MonitorRule) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
