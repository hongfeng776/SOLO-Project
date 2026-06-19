import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum ShopOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  STATUS_CHANGE = 'status_change',
  ORDER_INCOME = 'order_income',
  SETTLEMENT = 'settlement',
  REFUND = 'refund',
  PENALTY = 'penalty',
  MARKETING_FEE = 'marketing_fee',
}

export const SHOP_OPERATION_TYPE_MAP: Record<string, string> = {
  [ShopOperationType.CREATE]: '店铺创建',
  [ShopOperationType.UPDATE]: '信息修改',
  [ShopOperationType.STATUS_CHANGE]: '状态变更',
  [ShopOperationType.ORDER_INCOME]: '订单收入',
  [ShopOperationType.SETTLEMENT]: '资金结算',
  [ShopOperationType.REFUND]: '退款回退',
  [ShopOperationType.PENALTY]: '违规处罚',
  [ShopOperationType.MARKETING_FEE]: '营销费用',
};

@Table({
  tableName: 'shop_operation_ledgers',
  timestamps: false,
  indexes: [
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_operation_type', fields: ['operation_type'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class ShopOperationLedger extends Model<ShopOperationLedger> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.STRING(30), allowNull: false, comment: '操作类型' })
  operation_type!: string;

  @Column({ type: DataType.STRING(200), allowNull: false, comment: '操作标题' })
  operation_title!: string;

  @Column({ type: DataType.TEXT, comment: '操作详情' })
  operation_detail?: string;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0.00, comment: '涉及金额' })
  amount?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '涉及商品数量' })
  goods_count?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '涉及订单数量' })
  order_count?: number;

  @Column({ type: DataType.JSON, comment: '权限快照' })
  permission_snapshot?: any;

  @Column({ type: DataType.JSON, comment: '状态快照' })
  status_snapshot?: any;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @Column({ type: DataType.STRING(20), comment: '角色' })
  operator_role?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;
}
