export enum NoteStatus {
  DRAFT = 0,
  PENDING_REVIEW = 1,
  PUBLISHED = 2,
  REJECTED = 3,
  OFF_SHELF = 4,
  SCHEDULED = 5,
  POSTPONED = 6,
  FLOW_LIMITED = 7
}

export enum NoteType {
  IMAGE_TEXT = 1,
  VIDEO = 2
}

export const NOTE_STATUS_NAMES: Record<number, string> = {
  [NoteStatus.DRAFT]: '草稿',
  [NoteStatus.PENDING_REVIEW]: '待审核',
  [NoteStatus.PUBLISHED]: '已发布',
  [NoteStatus.REJECTED]: '已拒绝',
  [NoteStatus.OFF_SHELF]: '已下架',
  [NoteStatus.SCHEDULED]: '定时待发布',
  [NoteStatus.POSTPONED]: '暂缓审核',
  [NoteStatus.FLOW_LIMITED]: '限流'
}

export const NOTE_TYPE_NAMES: Record<number, string> = {
  [NoteType.IMAGE_TEXT]: '图文',
  [NoteType.VIDEO]: '视频'
}

export enum ReviewerLevel {
  NONE = 0,
  NORMAL = 1,
  SENIOR = 2
}

export enum FlowUnlockedStatus {
  LOCKED = 0,
  UNLOCKED = 1
}
