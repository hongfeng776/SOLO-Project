export enum TicketType {
  COMPLAINT = 1,
  REFUND = 2,
  ABNORMAL = 3,
  CONSULT = 4
}

export const TicketTypeMap: Record<number, string> = {
  [TicketType.COMPLAINT]: '投诉',
  [TicketType.REFUND]: '退款',
  [TicketType.ABNORMAL]: '异常',
  [TicketType.CONSULT]: '咨询'
}

export enum TicketPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4
}

export const TicketPriorityMap: Record<number, string> = {
  [TicketPriority.LOW]: '低',
  [TicketPriority.MEDIUM]: '中',
  [TicketPriority.HIGH]: '高',
  [TicketPriority.URGENT]: '紧急'
}

export const TicketPriorityColorMap: Record<number, string> = {
  [TicketPriority.LOW]: '#67c23a',
  [TicketPriority.MEDIUM]: '#409eff',
  [TicketPriority.HIGH]: '#e6a23c',
  [TicketPriority.URGENT]: '#f56c6c'
}

export enum TicketStatus {
  PENDING = 1,
  PROCESSING = 2,
  RESOLVED = 3,
  CLOSED = 4
}

export const TicketStatusMap: Record<number, string> = {
  [TicketStatus.PENDING]: '待处理',
  [TicketStatus.PROCESSING]: '处理中',
  [TicketStatus.RESOLVED]: '已解决',
  [TicketStatus.CLOSED]: '已关闭'
}
