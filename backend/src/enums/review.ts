export enum ReviewAction {
  APPROVE = 1,
  REJECT = 2,
  POSTPONE = 3
}

export enum ReviewLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3
}

export enum ReviewNoteType {
  IMAGE_TEXT = 1,
  VIDEO = 2
}

export enum ReviewAbnormalType {
  EXCESSIVE_REJECTION = 'excessive_rejection',
  NO_REASON_REJECT = 'no_reason_reject',
  VIOLATION_TYPE_MISMATCH = 'violation_type_mismatch',
  FAST_REVIEW_SUSPICION = 'fast_review_suspicion'
}

export enum ReviewAbnormalSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const REVIEW_WEIGHT_CONFIG = {
  BASE_VIDEO: 20,
  BASE_IMAGE_TEXT: 10,
  LEVEL_MULTIPLIER: 20,
  SENSITIVE_WORD_BONUS: 50,
  VIOLATION_7D_MULTIPLIER: 15,
  AUTHOR_LEVEL_PENALTY_BASE: 6
} as const

export const HIGH_RISK_WEIGHT_THRESHOLD = 60

export const REVIEW_ACTION_NAMES: Record<number, string> = {
  [ReviewAction.APPROVE]: '通过',
  [ReviewAction.REJECT]: '驳回',
  [ReviewAction.POSTPONE]: '暂缓'
}
