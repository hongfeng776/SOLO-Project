import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum ShopStatus {
  NORMAL = 1,
  CLOSED = 2,
  RECTIFY = 3,
  BANNED = 4,
}

export const SHOP_STATUS_MAP: Record<number, string> = {
  [ShopStatus.NORMAL]: '正常营业',
  [ShopStatus.CLOSED]: '停业整顿',
  [ShopStatus.RECTIFY]: '违规整改',
  [ShopStatus.BANNED]: '平台封禁',
};

export enum ShopStatusSource {
  MERCHANT = 'merchant',
  PLATFORM = 'platform',
  SYSTEM = 'system',
}

export const SHOP_STATUS_SOURCE_MAP: Record<string, string> = {
  [ShopStatusSource.MERCHANT]: '商家主动',
  [ShopStatusSource.PLATFORM]: '平台违规',
  [ShopStatusSource.SYSTEM]: '系统自动',
};

export enum ShopLevel {
  NEW = 1,
  BRONZE = 2,
  SILVER = 3,
  GOLD = 4,
  DIAMOND = 5,
}

export const SHOP_LEVEL_MAP: Record<number, string> = {
  [ShopLevel.NEW]: '新店',
  [ShopLevel.BRONZE]: '铜牌',
  [ShopLevel.SILVER]: '银牌',
  [ShopLevel.GOLD]: '金牌',
  [ShopLevel.DIAMOND]: '钻石',
};

@Table({
  tableName: 'shop_status_change_logs',
  timestamps: false,
  indexes: [
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_status_source', fields: ['status_source'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class ShopStatusChangeLog extends Model<ShopStatusChangeLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, defaultValue: 1, comment: '变更前状态' })
  status_before!: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, defaultValue: 1, comment: '变更后状态' })
  status_after!: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'platform', comment: '来源' })
  status_source!: string;

  @Column({ type: DataType.STRING(1000), allowNull: false, comment: '变更原因' })
  change_reason!: string;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '接单权限变更前' })
  order_permission_before?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '接单权限变更后' })
  order_permission_after?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '营销权限变更前' })
  marketing_permission_before?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '营销权限变更后' })
  marketing_permission_after?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '结算权限变更前' })
  settlement_permission_before?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '结算权限变更后' })
  settlement_permission_after?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '受影响商品数量' })
  affected_goods_count?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '受影响订单数量' })
  affected_order_count?: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @Column({ type: DataType.DATE, comment: '生效时间' })
  effective_time?: Date;

  @Column({ type: DataType.STRING(1000), comment: '备注' })
  remark?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;
}
