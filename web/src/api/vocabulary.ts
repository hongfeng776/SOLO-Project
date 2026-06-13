import { get, post, put, del } from '@/utils/request'
import type { Result, PageResult } from '@/types/api'
import type { VocabularyVO } from '@/types/api'

export interface VocabularyQuery {
  pageNum?: number
  pageSize?: number
  word?: string
  partOfSpeech?: string
  status?: number
  creatorId?: number
  keyword?: string
}

export function getVocabularyList(params: VocabularyQuery) {
  return get<Result<PageResult<VocabularyVO>>>('/vocabulary/list', params)
}

export function getVocabularyDetail(id: number) {
  return get<Result<VocabularyVO>>(`/vocabulary/${id}`)
}

export function createVocabulary(data: any) {
  return post<Result<void>>('/vocabulary', data)
}

export function updateVocabulary(data: any) {
  return put<Result<void>>('/vocabulary', data)
}

export function removeVocabulary(ids: number[]) {
  return del<Result<void>>('/vocabulary', { ids })
}

export function updateVocabularyStatus(id: number, status: number) {
  return put<Result<void>>(`/vocabulary/${id}/status`, { status })
}

export function batchUpdateVocabularyStatus(ids: number[], status: number) {
  return put<Result<void>>('/vocabulary/status/batch', { ids, status })
}
