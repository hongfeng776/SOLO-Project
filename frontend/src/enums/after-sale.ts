export enum DisputeType {
  FEE_DISPUTE = 1,
  SERVICE_COMPLAINT = 2,
  LOST_ITEM = 3
}

export const DisputeTypeMap: Record<number, string> = {
  [DisputeType.FEE_DISPUTE]: '费用争议',
  [DisputeType.SERVICE_COMPLAINT]: '服务投诉',
  [DisputeType.LOST_ITEM]: '物品遗失'
}

export const DisputeTypeColorMap: Record<number, string> = {
  [DisputeType.FEE_DISPUTE]: '#e6a23c',
  [DisputeType.SERVICE_COMPLAINT]: '#f56c6c',
  [DisputeType.LOST_ITEM]: '#67c23a'
}

export const DisputeTypeIconMap: Record<number, string> = {
  [DisputeType.FEE_DISPUTE]: 'Wallet',
  [DisputeType.SERVICE_COMPLAINT]: 'Warning',
  [DisputeType.LOST_ITEM]: 'Goods'
}

export enum TicketStatus {
  PENDING_REVIEW = 1,
  REVIEWING = 2,
  RESOLVED = 3,
  REJECTED = 4,
  CLOSED = 5
}

export const TicketStatusMap: Record<number, string> = {
  [TicketStatus.PENDING_REVIEW]: '待审核',
  [TicketStatus.REVIEWING]: '审核中',
  [TicketStatus.RESOLVED]: '已解决',
  [TicketStatus.REJECTED]: '已驳回',
  [TicketStatus.CLOSED]: '已关闭'
}

export const TicketStatusColorMap: Record<number, string> = {
  [TicketStatus.PENDING_REVIEW]: '#e6a23c',
  [TicketStatus.REVIEWING]: '#409eff',
  [TicketStatus.RESOLVED]: '#67c23a',
  [TicketStatus.REJECTED]: '#f56c6c',
  [TicketStatus.CLOSED]: '#909399'
}

export enum ReviewStep {
  FIRST = 1,
  SECOND = 2,
  FINAL = 3
}

export const ReviewStepMap: Record<number, string> = {
  [ReviewStep.FIRST]: '初审',
  [ReviewStep.SECOND]: '复核',
  [ReviewStep.FINAL]: '终审'
}

export const TicketPriorityMap: Record<number, string> = {
  1: '低',
  2: '中',
  3: '高',
  4: '紧急'
}

export const TicketPriorityColorMap: Record<number, string> = {
  1: '#909399',
  2: '#409eff',
  3: '#e6a23c',
  4: '#f56c6c'
}

export const OperationTypeMap: Record<string, string> = {
  create: '创建工单',
  submit: '提交售后',
  assign: '指派审核',
  process: '开始审核',
  resolve: '解决工单',
  reject: '驳回工单',
  close: '关闭工单',
  urge: '工单催办',
  review: '复核工单'
}

export const OperationTypeColorMap: Record<string, string> = {
  create: '#909399',
  submit: '#409eff',
  assign: '#e6a23c',
  process: '#67c23a',
  resolve: '#13ce66',
  reject: '#f56c6c',
  close: '#909399',
  urge: '#ff9800',
  review: '#9b59b6'
}

export const ReputationChangeTypeMap: Record<string, string> = {
  order_complete: '订单完成',
  order_cancel: '订单取消',
  ticket_resolve: '售后解决',
  ticket_reject: '售后驳回',
  violation: '违规处罚',
  reward: '奖励',
  TICKET_RESOLVED_REFUND: '售后退款',
  TICKET_RESOLVED_COMPLAINT: '投诉成立',
  TICKET_REJECTED_FALSE: '恶意售后',
  TICKET_REJECTED_NORMAL: '售后驳回',
  TICKET_DUPLICATE: '重复提交'
}

export const ReputationChangeDirectionMap: Record<number, string> = {
  1: '+',
  [-1]: '-'
}

export const AFTER_SALE_VALID_DAYS = 30
export const MAX_EVIDENCE_COUNT = 9
export const MIN_EVIDENCE_COUNT = 1
export const MAX_REFUND_AMOUNT = 500
export const REFUND_OVER_LIMIT_RATIO = 1.5
