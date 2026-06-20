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
import { Customer } from './Customer';
import { CorporateProfile } from './CorporateProfile';
import { Organization } from './Organization';

@Table({
  tableName: 'biz_customer_privacy_log',
  comment: '客户隐私操作日志表'
})
export class CustomerPrivacyLog extends Model<CustomerPrivacyLog> {
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
    comment: '操作流水号'
  })
  log_no!: string;

  @Index
  @ForeignKey(() => Customer)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '个人客户ID'
  })
  customer_id?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @Index
  @ForeignKey(() => CorporateProfile)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '对公客户ID'
  })
  corporate_id?: string;

  @BelongsTo(() => CorporateProfile)
  corporate_profile?: CorporateProfile;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '客户编号'
  })
  customer_no?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '客户姓名/企业名称'
  })
  customer_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '客户类型 1个人 2企业'
  })
  customer_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '客户等级 1普通 2银卡 3金卡 4白金 5钻石'
  })
  customer_level!: number;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作人ID'
  })
  operator_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作人姓名'
  })
  operator_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '操作人岗位 1柜员 2客户经理 3风控专员 4审计员 5管理员'
  })
  operator_position!: number;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '操作人机构ID'
  })
  operator_org_id?: string;

  @BelongsTo(() => Organization)
  operator_organization?: Organization;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '操作人机构名称'
  })
  operator_org_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '场景类型 1日常运维查看 2业务审核查看 3风控核查查看 4审计溯源查看'
  })
  scene_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '操作类型 1查看 2导出 3修改 4删除'
  })
  operation_type!: number;

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
    comment: '脱敏级别 1不脱敏 2部分脱敏 3完全脱敏 4加密展示'
  })
  desensitization_level!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '操作用途备案'
  })
  operation_purpose?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否拦截 0否 1是'
  })
  is_blocked!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '拦截类型 0无 1权限不足 2未备案 3违规操作 4高频访问 5批量恶意导出'
  })
  block_type!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '拦截原因'
  })
  block_reason?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否越权 0否 1是'
  })
  is_unauthorized!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否违规 0否 1是'
  })
  is_violation!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作IP地址'
  })
  operation_ip?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '操作设备信息'
  })
  operation_device?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '操作时间'
  })
  operation_time!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '操作时长（秒）'
  })
  operation_duration!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '查看记录数'
  })
  view_count!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否触发风控预警 0否 1是'
  })
  is_risk_alert!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '风控预警信息'
  })
  risk_alert_info?: string;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联规则ID'
  })
  rule_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '关联规则编码'
  })
  rule_code?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '请求参数JSON'
  })
  request_params?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '响应数据摘要'
  })
  response_summary?: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: CustomerPrivacyLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
    if (!instance.log_no) {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-10);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      instance.log_no = `PRIV${timestamp}${random}`;
    }
  }
}
