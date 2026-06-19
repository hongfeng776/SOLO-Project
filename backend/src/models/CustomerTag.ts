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
import { Customer } from './Customer';
import { CustomerTagLog } from './CustomerTagLog';

@Table({
  tableName: 'biz_customer_tag',
  comment: '客户等级标签表'
})
export class CustomerTag extends Model<CustomerTag> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @ForeignKey(() => Customer)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '客户ID'
  })
  customer_id!: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '客户编号'
  })
  customer_no?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '客户姓名'
  })
  customer_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '客户等级 1普通 2银卡 3金卡 4白金 5钻石'
  })
  customer_level!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '标签编码'
  })
  tag_code!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '标签名称'
  })
  tag_name!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '标签类型 1等级标签 2服务标签 3营销标签 4风控标签 5特殊标签'
  })
  tag_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '标签来源 1手动调整 2系统自动 3批量赋值 4规则触发'
  })
  tag_source!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '标签状态 1有效 2失效 3待生效 4已移除'
  })
  tag_status!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '标签生效时间'
  })
  effective_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '标签失效时间'
  })
  expire_time?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '联动服务权限JSON'
  })
  service_permissions?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '联动费率优惠JSON'
  })
  fee_discounts?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '联动营销适配规则JSON'
  })
  marketing_rules?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '数据更新状态 资产数据 0未更新 1已更新'
  })
  asset_data_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '数据更新状态 交易数据 0未更新 1已更新'
  })
  transaction_data_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '数据更新状态 留存数据 0未更新 1已更新'
  })
  retention_data_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '数据更新状态 风控数据 0未更新 1已更新'
  })
  risk_data_status!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '资产数据更新时间'
  })
  asset_data_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '交易数据更新时间'
  })
  transaction_data_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '留存数据更新时间'
  })
  retention_data_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '风控数据更新时间'
  })
  risk_data_time?: Date;

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
    type: DataType.STRING(128),
    allowNull: true,
    comment: '操作人机构ID'
  })
  operator_org_id?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '操作人机构名称'
  })
  operator_org_name?: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @HasMany(() => CustomerTagLog, { foreignKey: 'tag_id', constraints: false })
  change_logs?: CustomerTagLog[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: CustomerTag) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
