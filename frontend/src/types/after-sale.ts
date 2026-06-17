export type DisputeType = 1 | 2 | 3
export type TicketStatus = 1 | 2 | 3 | 4 | 5
export type ReviewStep = 1 | 2 | 3

export interface EvidenceItem {
  url: string
  name?: string
  type?: 'image' | 'video' | 'file'
  size?: number
  uploadTime?: string
}

export interface AfterSaleTicket {
  id: number
  ticketNo: string
  orderId: number
  orderNo: string
  passengerId: number
  passengerName: string
  passengerPhone: string
  driverId: number | null
  driverName: string | null
  type: number
  disputeType: DisputeType
  priority: number
  status: TicketStatus
  reviewStep: ReviewStep
  category: string
  content: string
  evidences: EvidenceItem[] | null
  evidenceCount: number
  refundAmount: number
  actualRefundAmount: number
  reputationImpact: number
  handleResult: string | null
  rejectReason: string | null
  handlerId: number | null
  handlerName: string | null
  handlerRole: string | null
  assigneeId: number | null
  assigneeName: string | null
  handleTime: string | null
  deadline: string | null
  isOverdue: number
  hasException: number
  exceptionType: string | null
  exceptionDetail: string | null
  isDuplicate: number
  duplicateTicketId: number | null
  remark: string | null
  order?: {
    orderNo: string
    status: number
    estimatedPrice: number
    actualPrice: number
    distance: number
    duration: number
    startAddress: string
    endAddress: string
    completeTime: string
  }
  createTime: string
  updateTime: string
}

export interface SubmitPrerequisiteResult {
  isEligible: boolean
  orderCompleted: boolean
  withinValidPeriod: boolean
  hasDuplicateTicket: boolean
  order: any
  duplicateTicket: any | null
  messages: string[]
}

export interface SubmitValidationResult {
  errors: string[]
  warnings: string[]
  isValid: boolean
}

export interface AfterSaleSubmitResult {
  ticket: AfterSaleTicket
  prerequisites: SubmitPrerequisiteResult
  validation: SubmitValidationResult
  duplicateCheck: { isDuplicate: boolean; waitTime?: number }
}

export interface TicketAuditLogItem {
  id: number
  ticketId: number
  ticketNo: string
  orderId: number | null
  orderNo: string | null
  operationType: string
  oldStatus: number | null
  newStatus: number
  oldReviewStep: number | null
  newReviewStep: number | null
  operatorId: number | null
  operatorName: string | null
  operatorRole: string | null
  operatorIP: string | null
  assigneeId: number | null
  assigneeName: string | null
  content: string | null
  remark: string | null
  rejectReason: string | null
  refundAmount: number
  reputationImpact: number
  hasException: number
  exceptionType: string | null
  exceptionDetail: string | null
  validationResult: any | null
  createTime: string
}

export interface ProcessingValidationResult {
  isCompliant: boolean
  score: number
  exceptions: string[]
  warnings: string[]
  passItems: string[]
  exceptionType: string | null
  exceptionDetail: string | null
}

export interface TicketProcessResult {
  ticket: AfterSaleTicket
  validation: ProcessingValidationResult
  reputationImpact: number
}

export interface BatchOperationResult {
  total: number
  success: number
  failed: number
  failedOrders: Array<{ id: number; reason: string }>
}

export interface RiskCheckItem {
  type: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
}

export interface TimelineItem {
  time: string
  operator: string
  operation: string
  status: number
  content: string | null
  remark: string | null
}

export interface TicketTraceData {
  ticket: AfterSaleTicket
  order: any
  auditLogs: TicketAuditLogItem[]
  reputationRecords: ReputationRecordItem[]
  similarTickets: Array<{
    id: number
    ticketNo: string
    status: number
    createTime: string
  }>
  validation: ProcessingValidationResult
  riskChecks: RiskCheckItem[]
  submissionTimeline: TimelineItem[]
}

export interface TicketStatistics {
  pendingReview: number
  reviewing: number
  resolved: number
  rejected: number
  overdue: number
  todayCreated: number
  todayResolved: number
  resolutionRate: number
}

export interface ReputationRecordItem {
  id: number
  recordNo: string
  passengerId: number
  passengerName: string
  passengerPhone: string
  driverId: number | null
  driverName: string | null
  orderId: number | null
  orderNo: string | null
  ticketId: number | null
  ticketNo: string | null
  changeType: string
  changeDirection: 1 | -1
  beforeScore: number
  changeAmount: number
  afterScore: number
  minScoreLimit: number
  maxScoreLimit: number
  reason: string
  detail: string | null
  operatorId: number | null
  operatorName: string | null
  operatorIP: string | null
  isReversed: number
  reversedTime: string | null
  reversedBy: number | null
  reversedReason: string | null
  remark: string | null
  createTime: string
}

export interface BatchPreviewResult {
  total: number
  eligibleCount: number
  excludedCount: number
  eligible: Array<{
    id: number
    ticketNo: string
    orderNo: string
    status: number
    disputeType: number
    passengerName: string
    createTime: string
    deadline: string
    isOverdue: number
  }>
  excluded: Array<{
    id: number
    ticketNo: string
    orderNo: string
    reason: string
  }>
}
