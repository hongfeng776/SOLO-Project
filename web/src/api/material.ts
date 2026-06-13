import { get, post, put, del } from '@/utils/request'
import type { Result, PageResult } from '@/types/api'
import type { MaterialVO } from '@/types/api'

export interface MaterialQuery {
  pageNum?: number
  pageSize?: number
  title?: string
  vocabularyId?: number
  materialType?: string
  difficulty?: number
  status?: number
}

export function getMaterialList(params: MaterialQuery) {
  return get<Result<PageResult<MaterialVO>>>('/material/list', params)
}

export function getMaterialDetail(id: number) {
  return get<Result<MaterialVO>>(`/material/${id}`)
}

export function createMaterial(data: any) {
  return post<Result<void>>('/material', data)
}

export function updateMaterial(data: any) {
  return put<Result<void>>('/material', data)
}

export function removeMaterial(ids: number[]) {
  return del<Result<void>>('/material', { ids })
}

export function updateMaterialStatus(id: number, status: number) {
  return put<Result<void>>(`/material/${id}/status`, { status })
}

export function batchUpdateMaterialStatus(ids: number[], status: number) {
  return put<Result<void>>('/material/status/batch', { ids, status })
}
