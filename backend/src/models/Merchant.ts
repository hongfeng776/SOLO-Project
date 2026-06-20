import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum MerchantSettleStatus {
  PENDING_SUBMIT = 0,
  PENDING_AUDIT = 1,
  AUDIT_APPROVED = 2,
  AUDIT_REJECTED = 3,
  QUALIFICATION_EXPIRED = 4,
  QUALIFICATION_ABNORMAL = 5,
  DISABLED = 6,
}

export const MERCHANT_SETTLE_STATUS_MAP: Record<number, string> = {
  [MerchantSettleStatus.PENDING_SUBMIT]: '待提交',
  [MerchantSettleStatus.PENDING_AUDIT]: '待审核',
  [MerchantSettleStatus.AUDIT_APPROVED]: '审核通过',
  [MerchantSettleStatus.AUDIT_REJECTED]: '审核驳回',
  [MerchantSettleStatus.QUALIFICATION_EXPIRED]: '资质过期',
  [MerchantSettleStatus.QUALIFICATION_ABNORMAL]: '资质异常',
  [MerchantSettleStatus.DISABLED]: '已禁用',
};

@Table({
  tableName: 'merchants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Merchant extends Model<Merchant> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '商家名称',
  })
  name!: string;

  @Column({
    type: DataType.STRING(100),
    comment: '店铺名称',
    unique: true,
  })
  shop_name?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '店铺Logo URL',
  })
  shop_logo?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '店铺Banner图 URL',
  })
  shop_banner?: string;

  @Column({
    type: DataType.TEXT,
    comment: '店铺简介',
  })
  shop_intro?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '店铺主营类目',
  })
  shop_category?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '店铺二级类目',
  })
  shop_sub_category?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '店铺标签(逗号分隔)',
  })
  shop_tags?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '店铺等级：1-新店 2-铜牌 3-银牌 4-金牌 5-钻石',
  })
  shop_level?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '店铺状态：1-正常 2-停业 3-整改 4-封禁',
  })
  shop_status?: number;

  @Column({
    type: DataType.STRING(1000),
    comment: '店铺状态变更原因',
  })
  shop_status_reason?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '状态来源：merchant商家 platform违规 system系统',
  })
  shop_status_source?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '订单接单权限：0-禁止 1-允许',
  })
  order_accept_permission?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '营销活动参与资格：0-无资格 1-有资格',
  })
  marketing_participate_permission?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '结算功能：0-关闭 1-开启',
  })
  settlement_permission?: number;

  @Column({
    type: DataType.DATEONLY,
    comment: '开店日期',
  })
  shop_open_date?: Date;

  @Column({
    type: DataType.STRING(50),
    comment: '店铺所在省份',
  })
  shop_province?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '店铺所在城市',
  })
  shop_city?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '店铺所在区县',
  })
  shop_district?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '店铺详细地址',
  })
  shop_address?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '客服电话',
  })
  customer_service_phone?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '客服工作时间',
  })
  customer_service_hours?: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '经营时长(天)',
  })
  shop_operation_duration_days?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '联系人',
  })
  contact?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '联系电话',
  })
  phone?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '地址',
  })
  address?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '法人姓名',
  })
  legal_person?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '法人身份证号',
  })
  legal_id_card?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '营业执照号',
  })
  business_license_no?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '统一社会信用代码',
  })
  credit_code?: string;

  @Column({
    type: DataType.DATEONLY,
    comment: '营业执照有效期起始',
  })
  license_valid_from?: Date;

  @Column({
    type: DataType.DATEONLY,
    comment: '营业执照有效期终止',
  })
  license_valid_to?: Date;

  @Column({
    type: DataType.STRING(500),
    comment: '营业执照图片URL',
  })
  license_image_url?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '法人身份证正面URL',
  })
  legal_id_front_url?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '法人身份证反面URL',
  })
  legal_id_back_url?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    comment: '注册资本(万元)',
  })
  registered_capital?: number;

  @Column({
    type: DataType.DATEONLY,
    comment: '成立日期',
  })
  establish_date?: Date;

  @Column({
    type: DataType.TEXT,
    comment: '经营范围',
  })
  business_scope?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '入驻状态：0-待提交 1-待审核 2-审核通过 3-审核驳回 4-资质过期 5-资质异常 6-已禁用',
  })
  settle_status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '店铺开通权限：0-未开通 1-已开通',
  })
  shop_open_status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '商品上架权限：0-无权限 1-有权限',
  })
  goods_publish_permission?: number;

  @Column({
    type: DataType.STRING(100),
    comment: '行业类型',
  })
  industry_type?: string;

  @Column({
    type: DataType.STRING(2000),
    comment: '资质备注',
  })
  qualification_remark?: string;

  @Column({
    type: DataType.STRING(1000),
    comment: '审核原因/驳回原因',
  })
  audit_reason?: string;

  @Column({
    type: DataType.DATE,
    comment: '最后审核时间',
  })
  last_audit_time?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 100,
    comment: '商家信用分',
  })
  credit_score?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '待结算金额',
  })
  pending_settle_amount?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '累计已结算金额',
  })
  total_settle_amount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '累计商品销量',
  })
  total_sales_count?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '售后处理次数',
  })
  after_sale_handle_count?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '累计退款金额',
  })
  total_refund_amount?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '已扣减结算金额（退款回退）',
  })
  deducted_settle_amount?: number;

  @Column({
    type: DataType.STRING(100),
    comment: '银行开户名',
  })
  bank_account_name?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '银行账号',
  })
  bank_account_no?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '开户银行名称',
  })
  bank_name?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '开户支行名称',
  })
  bank_branch_name?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '银行卡认证状态：0-未认证 1-认证中 2-认证通过 3-认证失败',
  })
  bank_verify_status?: number;

  @Column({
    type: DataType.DECIMAL(14, 2),
    defaultValue: 0,
    comment: '可结算余额',
  })
  available_settle_balance?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '已提现次数',
  })
  settle_withdraw_count?: number;

  @Column({
    type: DataType.DATE,
    comment: '最近结算时间',
  })
  last_settle_time?: Date;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  updated_at!: Date;
}
