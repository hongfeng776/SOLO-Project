export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface MenuItem {
  path: string;
  name: string;
  title: string;
  icon?: string;
  children?: MenuItem[];
}

export interface OperationLogItem {
  id: number;
  user_id: number;
  username: string;
  module: string;
  operation: string;
  method: string;
  path: string;
  params: string;
  ip: string;
  user_agent: string;
  status: number;
  error_msg: string;
  cost_time: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface OperationLogQuery {
  page?: number;
  pageSize?: number;
  username?: string;
  module?: string;
  operation?: string;
  status?: number | '';
  startTime?: string;
  endTime?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SilhouetteMaterialItem {
  id: number;
  name: string;
  cover: string | null;
  width: number | null;
  height: number | null;
  scene: string | null;
  category: string | null;
  status: number;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface SilhouetteMaterialQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  category?: string;
  status?: number | '';
  scene?: string;
}

export interface SilhouetteMaterialForm {
  name: string;
  cover?: File | null;
  width?: number | null;
  height?: number | null;
  scene?: string;
  category?: string;
  status?: number;
}

export interface VisualTemplateItem {
  id: number;
  name: string;
  cover: string | null;
  style_type: string | null;
  scene: string | null;
  status: number;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface VisualTemplateQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  style_type?: string;
  scene?: string;
  status?: number | '';
  start_time?: string;
  end_time?: string;
  use_count_min?: number | '';
  use_count_max?: number | '';
}

export interface VisualTemplateForm {
  name: string;
  cover?: File | null;
  style_type?: string;
  scene?: string;
  status?: number;
}

export type UserWorkAuditStatus = 0 | 1 | 2 | 3;

export interface UserWorkAuditRecord {
  audit_status: UserWorkAuditStatus;
  audit_reason: string | null;
  audit_remark: string | null;
  audited_at: string;
}

export interface UserWorkItem {
  id: number;
  name: string;
  cover: string | null;
  description: string | null;
  width: number | null;
  height: number | null;
  user_id: number;
  username: string;
  user_avatar: string | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  share_count: number;
  audit_status: UserWorkAuditStatus;
  audit_reason: string | null;
  audit_remark: string | null;
  audit_records: UserWorkAuditRecord[];
  is_top: number;
  top_expire_at: string | null;
  top_remark: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWorkQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  username?: string;
  audit_status?: UserWorkAuditStatus | '';
  is_top?: number | '';
  start_time?: string;
  end_time?: string;
  like_min?: number | '';
  like_max?: number | '';
}

export interface UserWorkAuditForm {
  audit_status: UserWorkAuditStatus;
  audit_reason?: string;
  audit_remark?: string;
}

export interface UserWorkTopForm {
  is_top: number;
  top_duration?: number;
  top_remark?: string;
}

export const AUDIT_STATUS_MAP: Record<UserWorkAuditStatus, { text: string; type: 'warning' | 'success' | 'danger' | 'info' }> = {
  0: { text: '待审核', type: 'warning' },
  1: { text: '已通过', type: 'success' },
  2: { text: '已驳回', type: 'danger' },
  3: { text: '已下架', type: 'info' }
};

export const AUDIT_REJECT_REASONS = [
  '内容违规',
  '版权问题',
  '质量不达标',
  '涉及敏感信息',
  '其他原因'
];

export const TOP_DURATION_OPTIONS = [
  { label: '1天', value: 1 },
  { label: '3天', value: 3 },
  { label: '7天', value: 7 },
  { label: '15天', value: 15 },
  { label: '30天', value: 30 },
  { label: '永久', value: 0 }
];
