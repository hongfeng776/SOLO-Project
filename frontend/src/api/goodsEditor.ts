import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type { EditFieldConfig, GoodsEditLog } from '@/types/business'
import type { Goods } from './goods'

export function getEditableFields(goodsId: number): Promise<ApiResponse<string[]>> {
  return request.get<string[]>('/api/v1/goodsEditor/editable-fields', {
    params: { goodsId }
  })
}

export function getEditFieldConfig(goodsId: number): Promise<ApiResponse<EditFieldConfig[]>> {
  return request.get<EditFieldConfig[]>('/api/v1/goodsEditor/field-config', {
    params: { goodsId }
  })
}

export function executeGoodsEdit(goodsId: number, data: Partial<Goods>): Promise<ApiResponse<Goods>> {
  return request.put<Goods>(`/api/v1/goodsEditor/execute/${goodsId}`, data)
}

export function getGoodsEditLogs(goodsId: number): Promise<ApiResponse<GoodsEditLog[]>> {
  return request.get<GoodsEditLog[]>('/api/v1/goodsEditor/edit-logs', {
    params: { goodsId }
  })
}
