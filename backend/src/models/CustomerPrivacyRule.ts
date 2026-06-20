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
import { Organization } from './Organization';

@Table({
  tableName: 'biz_customer_privacy_rule',
  comment: '客户隐私防护规则表'
})
export class CustomerPrivacyRule extends Model<CustomerPrivacyRule> {
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
    defaultValue: 0,
    comment: '适用客户等级 0全部 1普通 2银卡 3金卡 4白金 5钻石'
  })
  customer_level!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '信息敏感度级别 1低 2中 3高 4极高'
  })
  sensitivity_level!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '适用操作岗位 0全部 1柜员 2客户经理 3风控专员 4审计员 5管理员'
  })
  operator_position!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '场景类型 1日常运维查看 2业务审核查看 3风控核查查看 4审计溯源查看'
  })
  scene_type!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '脱敏规则JSON'
  })
  desensitization_rules?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '操作留存规则JSON'
  })
  retention_rules?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: '时效限制（分钟）'
  })
  time_limit!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '敏感字段列表，逗号分隔'
  })
  sensitive_fields?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否需要备案 0否 1是'
  })
  need_record!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否需要操作日志 0否 1是'
  })
  need_operation_log!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '全局生效标记 0否 1是'
  })
  is_global!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '规则状态 0禁用 1启用'
  })
  status!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '规则描述'
  })
  description?: string;

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
    comment: '生效时间'
  })
  effective_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '失效时间'
  })
  expire_time?: Date;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: CustomerPrivacyRule) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
