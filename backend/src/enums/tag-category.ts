export enum CategoryStatus {
  ENABLED = 1,
  DISABLED = 2
}

export enum TagStatus {
  ENABLED = 1,
  DISABLED = 2
}

export enum TagActionType {
  BIND = 'bind',
  UNBIND = 'unbind',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export enum HotLevel {
  NORMAL = 1,
  HOT = 2
}

export const DEFAULT_CONTENT_SCENES = [
  '美食探店', '美妆护肤', '时尚穿搭', '旅行攻略',
  '健身运动', '家居生活', '数码科技', '母婴育儿',
  '宠物日常', '情感心理', '职场干货', '学习教育'
]

export const COMPLIANCE_LIBRARIES = [
  { id: 'safe', name: '安全合规标签库', tags: ['安全', '正规', '合法'] },
  { id: 'health', name: '健康合规标签库', tags: ['健康', '天然', '无添加'] },
  { id: 'ad', name: '广告合规标签库', tags: ['真实', '实拍', '无夸大'] }
]
