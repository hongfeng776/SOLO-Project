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

export enum RegisterSource {
  MANUAL = 'manual',
  WECHAT = 'wechat',
  QQ = 'qq',
  APPLE = 'apple',
  PHONE = 'phone',
  IMPORT = 'import'
}

export const REGISTER_SOURCE_NAMES: Record<string, string> = {
  [RegisterSource.MANUAL]: '手动注册',
  [RegisterSource.WECHAT]: '微信',
  [RegisterSource.QQ]: 'QQ',
  [RegisterSource.APPLE]: '苹果',
  [RegisterSource.PHONE]: '手机号',
  [RegisterSource.IMPORT]: '批量导入'
}

export enum RealNameStatus {
  UNVERIFIED = 0,
  PENDING = 1,
  VERIFIED = 2,
  REJECTED = 3
}

export const REAL_NAME_STATUS_NAMES: Record<number, string> = {
  [RealNameStatus.UNVERIFIED]: '未认证',
  [RealNameStatus.PENDING]: '审核中',
  [RealNameStatus.VERIFIED]: '已认证',
  [RealNameStatus.REJECTED]: '已拒绝'
}

export enum UserAbnormalType {
  FAKE_INFO = 'fake_info',
  DUPLICATE_BINDING = 'duplicate_binding',
  INCOMPLETE_INFO = 'incomplete_info',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ABNORMAL_DEVICE = 'abnormal_device'
}

export const USER_ABNORMAL_TYPE_NAMES: Record<string, string> = {
  [UserAbnormalType.FAKE_INFO]: '虚假信息',
  [UserAbnormalType.DUPLICATE_BINDING]: '重复绑定',
  [UserAbnormalType.INCOMPLETE_INFO]: '信息不完整',
  [UserAbnormalType.SUSPICIOUS_ACTIVITY]: '可疑行为',
  [UserAbnormalType.ABNORMAL_DEVICE]: '设备异常'
}

export enum UserFilterType {
  NEW_REGISTERED = 'new_registered',
  NOT_VERIFIED = 'not_verified',
  LOW_ACTIVITY = 'low_activity',
  NO_PHONE = 'no_phone',
  ABNORMAL = 'abnormal'
}

export const USER_FILTER_TYPE_NAMES: Record<string, string> = {
  [UserFilterType.NEW_REGISTERED]: '新注册',
  [UserFilterType.NOT_VERIFIED]: '未实名',
  [UserFilterType.LOW_ACTIVITY]: '低活跃',
  [UserFilterType.NO_PHONE]: '未绑定手机',
  [UserFilterType.ABNORMAL]: '异常用户'
}

export enum BatchOperationScope {
  SELECTED = 'selected',
  FILTERED = 'filtered',
  ALL = 'all'
}

export const BATCH_OPERATION_SCOPE_NAMES: Record<string, string> = {
  [BatchOperationScope.SELECTED]: '选中用户',
  [BatchOperationScope.FILTERED]: '筛选结果',
  [BatchOperationScope.ALL]: '全部用户'
}

export enum UserAccountLogType {
  INFO_UPDATE = 'info_update',
  NICKNAME_CHANGE = 'nickname_change',
  AVATAR_CHANGE = 'avatar_change',
  PHONE_CHANGE = 'phone_change',
  BATCH_UPDATE = 'batch_update',
  BATCH_RESET = 'batch_reset'
}

export const USER_ACCOUNT_LOG_TYPE_NAMES: Record<string, string> = {
  [UserAccountLogType.INFO_UPDATE]: '信息更新',
  [UserAccountLogType.NICKNAME_CHANGE]: '昵称修改',
  [UserAccountLogType.AVATAR_CHANGE]: '头像修改',
  [UserAccountLogType.PHONE_CHANGE]: '手机号修改',
  [UserAccountLogType.BATCH_UPDATE]: '批量更新',
  [UserAccountLogType.BATCH_RESET]: '批量重置'
}
