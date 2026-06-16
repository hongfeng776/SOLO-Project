export enum OperationStatus {
  SUCCESS = 1,
  FAILED = 0
}

export const OperationStatusMap: Record<number, string> = {
  [OperationStatus.SUCCESS]: '成功',
  [OperationStatus.FAILED]: '失败'
}

export enum AlertLevel {
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4
}

export const AlertLevelMap: Record<number, string> = {
  [AlertLevel.INFO]: '信息',
  [AlertLevel.WARNING]: '警告',
  [AlertLevel.ERROR]: '错误',
  [AlertLevel.CRITICAL]: '严重'
}

export const AlertLevelColorMap: Record<number, string> = {
  [AlertLevel.INFO]: '#409eff',
  [AlertLevel.WARNING]: '#e6a23c',
  [AlertLevel.ERROR]: '#f56c6c',
  [AlertLevel.CRITICAL]: '#f56c6c'
}
