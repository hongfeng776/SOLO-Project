import { get, post } from '@utils/request'

export enum OpeningType {
  PERSONAL = 1,
  CORPORATE = 2
}

export const OpeningTypeText: Record<number, string> = {
  1: '个人开户',
  2: '对公开户'
}

export enum OpeningStatus {
  PENDING_PRECHECK = 0,
  PRECHECK_PASSED = 1,
  FILLING = 2,
  PENDING_REVIEW = 3,
  REVIEW_PASSED = 4,
  OPENED = 5,
  REJECTED = 6,
  CANCELLED = 7,
  DENIED = 8
}

export const OpeningStatusText: Record<number, string> = {
  0: '待预检',
  1: '预检通过待录入',
  2: '录入中',
  3: '待复核',
  4: '复核通过待开户',
  5: '已开户',
  6: '已驳回',
  7: '已取消',
  8: '已拒绝'
}

export const OpeningStatusColor: Record<number, string> = {
  0: 'info',
  1: '',
  2: 'warning',
  3: 'warning',
  4: 'primary',
  5: 'success',
  6: 'danger',
  7: 'info',
  8: 'danger'
}

export const OpeningStatusTagType: Record<number, string> = {
  0: 'info',
  1: '',
  2: 'warning',
  3: 'warning',
  4: '',
  5: 'success',
  6: 'danger',
  7: 'info',
  8: 'danger'
}

export enum OperationType {
  SUBMIT = 'submit',
  REVIEW_APPROVE = 'review_approve',
  REVIEW_REJECT = 'review_reject',
  CANCEL = 'cancel',
  VOID = 'void',
  RESUBMIT = 'resubmit',
  SUPPLEMENT = 'supplement',
  OPEN_ACCOUNT = 'open_account'
}

export const OperationTypeText: Record<string, string> = {
  submit: '提交申请',
  review_approve: '审核通过',
  review_reject: '审核驳回',
  cancel: '撤销取消',
  void: '作废',
  resubmit: '重新提交',
  supplement: '补充资料',
  open_account: '开户完成'
}

export interface StatusFlowItem {
  id: string
  openingType: number
  openingNo: string
  customerName: string
  idCardNo: string
  currentStatus: number
  currentStatusText: string
  statusColor: string
  accountTypeText: string
  riskLevelText: string
  canSubmit: boolean
  canReview: boolean
  canCancel: boolean
  canVoid: boolean
  canResubmit: boolean
  canSupplement: boolean
  materialsComplete: boolean
  reviewProgress: string
  lastOperationTime?: string
  lastOperator?: string
}

export interface StatusTransitionRequest {
  openingType: number
  openingId: string
  targetStatus: number
  operationType: string
  remark?: string
}

export interface StatusFlowCheckResult {
  canTransition: boolean
  reasons: string[]
  currentStatus: number
  currentStatusText: string
  targetStatus: number
  targetStatusText: string
  requiredConditions: {
    name: string
    passed: boolean
    message: string
  }[]
}

export interface StatusTransitionResult {
  success: boolean
  openingId: string
  openingNo: string
  statusBefore: number
  statusBeforeText: string
  statusAfter: number
  statusAfterText: string
  operationType: string
  operationTypeText: string
  complianceCheck: number
  violationDetails?: string
  syncResult?: {
    customerStatusSynced: boolean
    accountStatusSynced: boolean
    riskFilingSynced: boolean
  }
  logId: string
}

export interface StatusChangeLogVO {
  id: string
  openingType: number
  openingId: string
  openingNo: string
  statusBefore: number
  statusBeforeText: string
  statusAfter: number
  statusAfterText: string
  operationType: string
  operationTypeText: string
  operatorId: string
  operatorName: string
  operatorRole?: string
  complianceCheck: number
  violationDetails?: string
  syncResult?: any
  remark?: string
  operationNode?: string
  createdAt: string
}

export interface BatchStatusRequest {
  ids: string[]
  openingType: number
  operationType: string
  remark?: string
}

export interface StatusTraceRequest {
  openingNo?: string
  operatorName?: string
  startTime?: string
  endTime?: string
}

export interface StatusTraceVO {
  changeLogs: StatusChangeLogVO[]
  statistics: {
    totalCount: number
    complianceCount: number
    violationCount: number
    overreachCount: number
  }
  violations: {
    id: string
    openingNo: string
    violationDetails: string
    operatorName: string
    createdAt: string
  }[]
}

export interface StatusConfigVO {
  statusList: {
    value: number
    label: string
    color: string
    operations: string[]
    allowedTransitions: number[]
  }[]
  operationList: {
    value: string
    label: string
  }[]
  flowRules: Record<number, { allowed: number[]; operations: string[] }>
}

export const statusFlowApi = {
  getConfig: () => get('/business/status-flow/config'),
  checkTransition: (data: StatusTransitionRequest) => post('/business/status-flow/check', data),
  executeTransition: (data: StatusTransitionRequest) => post('/business/status-flow/execute', data),
  getFlowList: (params: any) => get('/business/status-flow/list', params),
  batchOperation: (data: BatchStatusRequest) => post('/business/status-flow/batch', data),
  traceStatusChange: (data: StatusTraceRequest) => post('/business/status-flow/trace', data)
}
