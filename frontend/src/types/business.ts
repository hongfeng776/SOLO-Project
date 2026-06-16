import type { DictItem } from './index'

export interface User {
  id: number
  username: string
  realName: string
  avatar: string
  email: string
  phone: string
  orgId: number
  orgName: string
  roleIds: number[]
  roleNames: string[]
  status: number
  lastLoginTime: string
  remark: string
  createdAt: string
  updatedAt: string
}

export interface UserForm {
  id?: number
  username: string
  realName: string
  email: string
  phone: string
  orgId: number
  roleIds: number[]
  status: number
  remark?: string
}

export interface Role {
  id: number
  name: string
  code: string
  level: number
  dataScope: number
  status: number
  description: string
  permissionIds: number[]
  createdAt: string
  updatedAt: string
}

export interface RoleForm {
  id?: number
  name: string
  code: string
  level: number
  dataScope: number
  status: number
  description?: string
  permissionIds: number[]
}

export interface Permission {
  id: number
  name: string
  code: string
  type: number
  parentId: number | null
  path?: string
  component?: string
  icon?: string
  sort: number
  status: number
  children?: Permission[]
}

export interface PermissionForm {
  id?: number
  name: string
  code: string
  type: number
  parentId: number | null
  path?: string
  component?: string
  icon?: string
  sort: number
  status: number
}

export interface Organization {
  id: number
  name: string
  code: string
  type: number
  parentId: number | null
  address?: string
  contact?: string
  phone?: string
  sort: number
  status: number
  children?: Organization[]
}

export interface OrganizationForm {
  id?: number
  name: string
  code: string
  type: number
  parentId: number | null
  address?: string
  contact?: string
  phone?: string
  sort: number
  status: number
}

export interface ChannelBusiness {
  id: number
  channelCode: string
  channelName: string
  businessType: number
  businessTypeName: string
  amount: number
  transactionCount: number
  successCount: number
  failCount: number
  status: number
  statDate: string
  remark: string
}

export interface Transaction {
  id: number
  orderNo: string
  channelCode: string
  channelName: string
  businessType: number
  businessTypeName: string
  amount: number
  payerAccount: string
  payeeAccount: string
  payerName: string
  payeeName: string
  status: number
  statusName: string
  auditStatus: number
  auditStatusName: string
  auditorId?: number
  auditorName?: string
  auditTime?: string
  auditRemark?: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: number
  code: string
  name: string
  category: number
  categoryName: string
  rate: number
  minAmount: number
  maxAmount: number
  term: number
  description: string
  status: number
  riskLevel: number
  riskLevelName: string
  createdAt: string
  updatedAt: string
}

export interface AuditRecord {
  id: number
  businessId: number
  businessType: number
  businessTypeName: string
  businessNo: string
  amount: number
  currentLevel: number
  totalLevel: number
  status: number
  statusName: string
  submitterId: number
  submitterName: string
  submitterOrg: string
  submitTime: string
  auditorId?: number
  auditorName?: string
  auditTime?: string
  auditRemark?: string
  createdAt: string
  updatedAt: string
}

export interface AuditRule {
  id: number
  name: string
  code: string
  businessType: number
  businessTypeName: string
  minAmount?: number
  maxAmount?: number
  auditLevel: number
  status: number
  description?: string
  createdAt: string
  updatedAt: string
}

export interface OperationLog {
  id: number
  userId: number
  username: string
  realName: string
  module: string
  operation: string
  method: string
  params?: string
  ip: string
  location?: string
  status: number
  errorMsg?: string
  costTime: number
  createdAt: string
}

export const UserStatusDict: DictItem[] = [
  { label: '正常', value: 1, type: 'success' },
  { label: '禁用', value: 0, type: 'danger' }
]

export const RoleLevelDict: DictItem[] = [
  { label: '总行级', value: 1, color: '#004098' },
  { label: '分行级', value: 2, color: '#1e63c4' },
  { label: '支行级', value: 3, color: '#52c41a' },
  { label: '网点级', value: 4, color: '#faad14' }
]

export const DataScopeDict: DictItem[] = [
  { label: '全部数据权限', value: 1, type: 'primary' },
  { label: '自定义数据权限', value: 2, type: 'success' },
  { label: '本机构数据权限', value: 3, type: 'warning' },
  { label: '本机构及以下数据权限', value: 4, type: 'info' },
  { label: '仅本人数据权限', value: 5, type: 'danger' }
]

export const PermissionTypeDict: DictItem[] = [
  { label: '目录', value: 1, type: 'primary' },
  { label: '菜单', value: 2, type: 'success' },
  { label: '按钮', value: 3, type: 'warning' }
]

export const OrgTypeDict: DictItem[] = [
  { label: '总行', value: 1, type: 'primary' },
  { label: '分行', value: 2, type: 'success' },
  { label: '支行', value: 3, type: 'warning' },
  { label: '网点', value: 4, type: 'info' }
]

export const TransactionStatusDict: DictItem[] = [
  { label: '待处理', value: 0, type: 'info' },
  { label: '处理中', value: 1, type: 'warning' },
  { label: '成功', value: 2, type: 'success' },
  { label: '失败', value: 3, type: 'danger' },
  { label: '已取消', value: 4, type: 'info' }
]

export const AuditStatusDict: DictItem[] = [
  { label: '待审核', value: 0, type: 'warning' },
  { label: '审核中', value: 1, type: 'primary' },
  { label: '审核通过', value: 2, type: 'success' },
  { label: '审核驳回', value: 3, type: 'danger' },
  { label: '已撤销', value: 4, type: 'info' }
]

export const ProductStatusDict: DictItem[] = [
  { label: '下架', value: 0, type: 'info' },
  { label: '上架', value: 1, type: 'success' },
  { label: '售罄', value: 2, type: 'warning' }
]

export const RiskLevelDict: DictItem[] = [
  { label: '低风险', value: 1, type: 'success' },
  { label: '中低风险', value: 2, type: '' },
  { label: '中风险', value: 3, type: 'warning' },
  { label: '中高风险', value: 4, type: 'danger' },
  { label: '高风险', value: 5, type: 'danger' }
]

export const BusinessTypeDict: DictItem[] = [
  { label: '转账汇款', value: 1 },
  { label: '活期存款', value: 2 },
  { label: '定期存款', value: 3 },
  { label: '理财产品', value: 4 },
  { label: '贷款业务', value: 5 },
  { label: '信用卡', value: 6 },
  { label: '外汇业务', value: 7 },
  { label: '基金业务', value: 8 }
]

export const ChannelDict: DictItem[] = [
  { label: '柜面渠道', value: 'counter' },
  { label: '网上银行', value: 'ebank' },
  { label: '手机银行', value: 'mobile' },
  { label: '自助终端', value: 'atm' },
  { label: '电话银行', value: 'phone' }
]
