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

export interface Customer {
  id: string
  customerNo: string
  customerName: string
  idCardNo?: string
  idType?: number
  customerType?: number
  customerLevel?: number
  mobile?: string
  address?: string
  riskLevel?: number
  riskTags?: string
  status: number
  orgId?: string
  orgName?: string
  openDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerForm {
  id?: string
  customerName: string
  idCardNo?: string
  idType?: number
  customerType?: number
  customerLevel?: number
  mobile?: string
  address?: string
  riskLevel?: number
  status: number
  orgId?: string
}

export interface CustomerQueryParams extends PageParams {
  customerNo?: string
  customerName?: string
  customerType?: number
  customerLevel?: number
  riskLevel?: number
  status?: number
  orgId?: string
}

export interface ViolationRecord {
  id: string
  violationNo: string
  customerId?: string
  customerNo?: string
  customerName?: string
  bizId?: string
  bizNo?: string
  bizType?: string
  violationType?: number
  violationLevel?: number
  description?: string
  ruleRef?: string
  status: number
  discovererId?: string
  discovererName?: string
  discovererOrgId?: string
  discovererOrgName?: string
  handlerId?: string
  handlerName?: string
  discoverTime?: string
  handleTime?: string
  rectification?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface ViolationRecordForm {
  customerNo?: string
  bizNo?: string
  bizType?: string
  violationType: number
  violationLevel: number
  description?: string
  ruleRef?: string
  discovererId?: string
  discovererOrgId?: string
}

export interface ViolationHandleBody {
  status?: number
  rectification?: string
  remark?: string
}

export interface ViolationQueryParams extends PageParams {
  violationNo?: string
  customerNo?: string
  customerName?: string
  bizNo?: string
  bizType?: string
  violationType?: number
  violationLevel?: number
  status?: number
  discovererOrgId?: string
}

export interface TransactionForm {
  id?: string
  channelCode?: string
  channelTerminal?: string
  type: number
  businessLine?: string
  amount: number
  currency?: string
  customerId?: string
  customerNo?: string
  payerAccount?: string
  payerName?: string
  payeeAccount?: string
  payeeName?: string
  payeeBankCode?: string
  productId?: string
  orgId?: string
  remark?: string
}

export interface BatchTransactionBody {
  remark?: string
}

export function createTransactionApi(data: TransactionForm) {
  return post<void>('/business/transaction', data)
}

export function updateTransactionApi(data: TransactionForm) {
  return put<void>(`/business/transaction/${data.id}`, data)
}

export function cancelTransactionApi(id: string) {
  return post<void>(`/business/transaction/${id}/cancel`)
}

export function freezeTransactionApi(id: string, remark?: string) {
  return post<void>(`/business/transaction/${id}/freeze`, { remark })
}

export function reverseTransactionApi(id: string, remark?: string) {
  return post<void>(`/business/transaction/${id}/reverse`, { remark })
}

export function batchTransactionApi(ids: string[], operation: 'cancel' | 'freeze' | 'reverse', remark?: string) {
  return post<void>('/business/transaction/batch', { ids, operation, remark })
}

export function getCustomerListApi(params: CustomerQueryParams) {
  return get<PageResult<Customer>>('/business/customer/list', params)
}

export function createCustomerApi(data: CustomerForm) {
  return post<Customer>('/business/customer', data)
}

export function updateCustomerApi(data: CustomerForm) {
  return put<Customer>(`/business/customer/${data.id}`, data)
}

export function deleteCustomerApi(id: string) {
  return del<void>(`/business/customer/${id}`)
}

export function getViolationListApi(params: ViolationQueryParams) {
  return get<PageResult<ViolationRecord>>('/business/violation/list', params)
}

export function handleViolationApi(id: string, body: ViolationHandleBody) {
  return put<void>(`/business/violation/${id}/handle`, body)
}

export function createViolationApi(body: ViolationRecordForm) {
  return post<ViolationRecord>('/business/violation', body)
}
