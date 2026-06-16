import { get } from '@utils/request'
import type { ICustomerHolding, IHoldingDetail, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export interface IHoldingListParams extends IPageParams {
  customerName?: string
  stockCode?: string
  stockName?: string
  profitStatus?: string
}

export function getHoldingList(params: IHoldingListParams): Promise<IApiResponse<IPaginatedData<ICustomerHolding>>> {
  return get<IPaginatedData<ICustomerHolding>>('/api/holdings', params)
}

export function getHoldingById(id: number): Promise<IApiResponse<ICustomerHolding>> {
  return get<ICustomerHolding>(`/api/holdings/${id}`)
}

export function getHoldingByCustomer(customerId: number): Promise<IApiResponse<ICustomerHolding[]>> {
  return get<ICustomerHolding[]>(`/api/holdings/by-customer/${customerId}`)
}

export function getHoldingRecords(holdingId: number): Promise<IApiResponse<IHoldingDetail[]>> {
  return get<IHoldingDetail[]>(`/api/holdings/${holdingId}/records`)
}

export function getHoldingStats(): Promise<IApiResponse<{
  totalMarketValue: number
  totalFloatingProfit: number
  totalProfitRate: number
  holdingStockCount: number
}>> {
  return get('/api/holdings/stats')
}
