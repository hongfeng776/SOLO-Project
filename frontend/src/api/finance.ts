import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export interface FinanceStatement {
  id: number
  orderNo: string
  type: number
  amount: number
  balance: number
  relatedId: number
  relatedType: string
  remark: string
  createTime: string
}

export interface FinanceSettlement {
  id: number
  settlementNo: string
  driverId: number
  driverName: string
  driverPhone: string
  totalAmount: number
  orderCount: number
  status: number
  periodStart: string
  periodEnd: string
  settleTime: string | null
  createTime: string
}

export const getStatementListApi = (params: any) => {
  return request.get<PageResult<FinanceStatement>>('/finance/statement', params)
}

export const getSettlementListApi = (params: any) => {
  return request.get<PageResult<FinanceSettlement>>('/finance/settlement', params)
}

export const getSettlementDetailApi = (id: number) => {
  return request.get<FinanceSettlement>(`/finance/settlement/${id}`)
}

export const createSettlementApi = (data: any) => {
  return request.post<FinanceSettlement>('/finance/settlement', data)
}

export const executeSettlementApi = (id: number) => {
  return request.put(`/finance/settlement/${id}/execute`)
}

export const getFinanceStatisticsApi = () => {
  return request.get('/finance/statistics')
}
