import { get, post } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { NoteBatchRecord, BatchPublishResult } from '@/types/business'

export const getBatchList = (params: {
  page: number
  pageSize: number
  status?: number
}): Promise<PageResult<NoteBatchRecord>> => {
  return get<PageResult<NoteBatchRecord>>('/note-batch/list', params)
}

export const getBatchDetail = (
  id: number
): Promise<NoteBatchRecord & { failDetails: BatchPublishResult }> => {
  return get<NoteBatchRecord & { failDetails: BatchPublishResult }>(`/note-batch/${id}`)
}

export const retryBatch = (id: number): Promise<{ retried: number }> => {
  return post<{ retried: number }>(`/note-batch/${id}/retry`)
}
