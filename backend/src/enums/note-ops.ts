export enum NoteOpsAction {
  PUBLISH = 'publish',
  OFF_SHELF = 'off_shelf',
  FLOW_LIMIT = 'flow_limit',
  RESTORE = 'restore',
  PROMOTE_FLOW = 'promote_flow',
  DEMOTE_FLOW = 'demote_flow',
  PIN = 'pin',
  UNPIN = 'unpin',
  SET_HOT = 'set_hot',
  REMOVE_HOT = 'remove_hot'
}

export enum OperatorRole {
  NORMAL_OPS = 'normal_ops',
  SUPER_OPS = 'super_ops',
  ADMIN = 'admin'
}

export enum FlowLevel {
  NORMAL = 1,
  PREMIUM = 2,
  HOT = 3
}

export const VALID_STATE_TRANSITIONS: Record<number, number[]> = {
  2: [4, 7],
  4: [2],
  7: [2]
}

export const NOTE_OPS_ACTION_NAMES: Record<string, string> = {
  [NoteOpsAction.PUBLISH]: '发布',
  [NoteOpsAction.OFF_SHELF]: '下架',
  [NoteOpsAction.FLOW_LIMIT]: '限流',
  [NoteOpsAction.RESTORE]: '恢复',
  [NoteOpsAction.PROMOTE_FLOW]: '提升流量等级',
  [NoteOpsAction.DEMOTE_FLOW]: '降低流量等级',
  [NoteOpsAction.PIN]: '置顶',
  [NoteOpsAction.UNPIN]: '取消置顶',
  [NoteOpsAction.SET_HOT]: '设为热门',
  [NoteOpsAction.REMOVE_HOT]: '移除热门'
}
