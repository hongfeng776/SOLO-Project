export enum FinanceType {
  INCOME = 1,
  EXPENSE = 2,
  REFUND = 3,
  WITHDRAW = 4
}

export const FinanceTypeMap: Record<number, string> = {
  [FinanceType.INCOME]: '收入',
  [FinanceType.EXPENSE]: '支出',
  [FinanceType.REFUND]: '退款',
  [FinanceType.WITHDRAW]: '提现'
}

export const FinanceTypeColorMap: Record<number, string> = {
  [FinanceType.INCOME]: '#67c23a',
  [FinanceType.EXPENSE]: '#f56c6c',
  [FinanceType.REFUND]: '#e6a23c',
  [FinanceType.WITHDRAW]: '#409eff'
}

export enum SettlementStatus {
  PENDING = 0,
  COMPLETED = 1,
  FAILED = 2
}

export const SettlementStatusMap: Record<number, string> = {
  [SettlementStatus.PENDING]: '待结算',
  [SettlementStatus.COMPLETED]: '已结算',
  [SettlementStatus.FAILED]: '结算失败'
}
