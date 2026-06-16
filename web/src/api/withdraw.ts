import { get, put } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity } from '@/types'

export type WithdrawStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type WithdrawMethod = 'wechat' | 'alipay' | 'bank'

export interface WithdrawItem extends BaseEntity {
  withdrawNo: string
  promoterId: number | string
  promoterName: string
  promoterPhone?: string
  amount: number
  fee: number
  actualAmount: number
  method: WithdrawMethod
  status: WithdrawStatus
  applyTime: string
  auditTime?: string
  auditRemark?: string
  payTime?: string
  payRemark?: string
  accountName?: string
  accountNo?: string
  bankName?: string
}

export interface WithdrawQueryParams extends PageParams {
  withdrawNo?: string
  promoterId?: number | string
  promoterName?: string
  status?: WithdrawStatus
  startDate?: string
  endDate?: string
}

export interface WithdrawAuditParams {
  status: 1 | 2
  remark?: string
}

export interface WithdrawPayParams {
  remark?: string
}

export function getWithdrawList(params: WithdrawQueryParams): Promise<PageResult<WithdrawItem>> {
  return get<PageResult<WithdrawItem>>('/withdraws', params)
}

export function getWithdraw(id: string | number): Promise<WithdrawItem> {
  return get<WithdrawItem>(`/withdraws/${id}`)
}

export function auditWithdraw(
  id: string | number,
  data: WithdrawAuditParams
): Promise<WithdrawItem> {
  return put<WithdrawItem>(`/withdraws/${id}/audit`, data)
}

export function payWithdraw(
  id: string | number,
  data?: WithdrawPayParams
): Promise<WithdrawItem> {
  return put<WithdrawItem>(`/withdraws/${id}/pay`, data)
}

export function batchAuditWithdraws(
  ids: (string | number)[],
  data: WithdrawAuditParams
): Promise<{ successCount: number; failedCount: number }> {
  return put<{ successCount: number; failedCount: number }>('/withdraws/batch/audit', {
    ids,
    ...data,
  })
}
