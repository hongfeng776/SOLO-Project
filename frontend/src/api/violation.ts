import request from '@/utils/request'
import type { PageResult, PageParams, Violation, ViolationStats } from '@/types'

interface ViolationListParams extends PageParams {
  keyword?: string
  violationType?: string
  violationLevel?: string
  status?: string
  source?: string
}

export const getViolationList = (params: ViolationListParams) => {
  return request.get<PageResult<Violation>>('/violations', params)
}

export const getViolationDetail = (id: number) => {
  return request.get<Violation>(`/violations/${id}`)
}

export const createViolation = (data: Partial<Violation>) => {
  return request.post<Violation>('/violations', data)
}

export const handleViolation = (id: number, data: { action: string; opinion: string }) => {
  return request.put<Violation>(`/violations/${id}/handle`, data)
}

export const batchHandleViolation = (data: { ids: number[]; action: string; opinion: string }) => {
  return request.post('/violations/batch-handle', data)
}

export const getViolationStats = () => {
  return request.get<ViolationStats>('/violations/stats')
}
