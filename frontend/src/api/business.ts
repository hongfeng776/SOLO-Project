import { get, post, put, del } from '@utils/request'
import type { PageParams, PageResult } from '@types'
import type { ChannelBusiness, Transaction, Product } from '@types/business'

export interface ChannelQueryParams extends PageParams {
  channelCode?: string
  businessType?: number
  statDate?: string
}

export interface TransactionQueryParams extends PageParams {
  orderNo?: string
  channelCode?: string
  businessType?: number
  status?: number
  auditStatus?: number
  startTime?: string
  endTime?: string
}

export interface ProductQueryParams extends PageParams {
  name?: string
  category?: number
  status?: number
  riskLevel?: number
}

export function getChannelBusinessListApi(params: ChannelQueryParams) {
  return get<PageResult<ChannelBusiness>>('/business/channel/list', params)
}

export function getTransactionListApi(params: TransactionQueryParams) {
  return get<PageResult<Transaction>>('/business/transaction/list', params)
}

export function getTransactionDetailApi(id: number) {
  return get<Transaction>(`/business/transaction/${id}`)
}

export function getProductListApi(params: ProductQueryParams) {
  return get<PageResult<Product>>('/business/product/list', params)
}

export function getProductDetailApi(id: number) {
  return get<Product>(`/business/product/${id}`)
}

export function createProductApi(data: Partial<Product>) {
  return post<Product>('/business/product', data)
}

export function updateProductApi(data: Partial<Product>) {
  return put<Product>(`/business/product/${data.id}`, data)
}

export function deleteProductApi(id: number) {
  return del<void>(`/business/product/${id}`)
}
