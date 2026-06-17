import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type {
  CategoryTree,
  CategoryCreateData,
  CategoryUpdateData,
  ValidateCreateResult,
  EditPermissionType,
  CategoryFullTrace,
  QualificationRule,
  CategoryConstraintError,
  BatchResult
} from '@/types/business'

const API_PREFIX = '/api/v1'

export interface CategoryTreeQueryParams {
  keyword?: string
  status?: number
  withStats?: boolean
}

export interface BatchToggleStatusData {
  ids: number[]
  status: number
}

export interface BatchSortItem {
  id: number
  sort: number
}

export interface BatchSortData {
  items: BatchSortItem[]
}

export interface BatchMoveData {
  ids: number[]
  targetParentId: number | null
}

export interface UpdateCategoryLinkageData {
  name?: string
  code?: string
  parentId?: number | null
  icon?: string
  sort?: number
  status?: number
  requiredFieldsJson?: string
}

export function getCategoryTree(params?: CategoryTreeQueryParams): Promise<ApiResponse<CategoryTree[]>> {
  return request.get<CategoryTree[]>(`${API_PREFIX}/category/tree`, { params })
}

export function getCategory(id: number): Promise<ApiResponse<CategoryTree>> {
  return request.get<CategoryTree>(`${API_PREFIX}/category/${id}`)
}

export function createCategory(data: CategoryCreateData): Promise<ApiResponse<CategoryTree>> {
  return request.post<CategoryTree>(`${API_PREFIX}/category/create`, data)
}

export function updateCategory(id: number, data: CategoryUpdateData): Promise<ApiResponse<CategoryTree>> {
  return request.put<CategoryTree>(`${API_PREFIX}/category/${id}`, data)
}

export function deleteCategory(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`${API_PREFIX}/category/${id}`)
}

export function validateCategoryCreate(data: { parentId?: number }): Promise<ApiResponse<ValidateCreateResult>> {
  return request.post<ValidateCreateResult>(`${API_PREFIX}/category/validate/create`, data)
}

export function getLevelQualificationRules(level: number): Promise<ApiResponse<QualificationRule[]>> {
  return request.get<QualificationRule[]>(`${API_PREFIX}/category/qualification/rules`, { params: { level } })
}

export function canCreateSubmit(parentId?: number): Promise<ApiResponse<{ canSubmit: boolean; reason?: string }>> {
  return request.get<{ canSubmit: boolean; reason?: string }>(`${API_PREFIX}/category/can-submit`, { params: { parentId } })
}

export function getEditPermissionType(id: number): Promise<ApiResponse<EditPermissionType>> {
  return request.get<EditPermissionType>(`${API_PREFIX}/category/${id}/permission-type`)
}

export function updateCategoryLinkage(
  id: number,
  data: UpdateCategoryLinkageData,
  needConfirm = false
): Promise<ApiResponse<CategoryTree & { updatedProductCount?: number }>> {
  return request.put<CategoryTree & { updatedProductCount?: number }>(
    `${API_PREFIX}/category/${id}/linkage`,
    { ...data, needConfirm }
  )
}

export function batchToggleStatus(data: BatchToggleStatusData): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>(`${API_PREFIX}/category/batch/toggle-status`, data)
}

export function batchSort(data: BatchSortData): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>(`${API_PREFIX}/category/batch/sort`, data)
}

export function batchMove(data: BatchMoveData): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>(`${API_PREFIX}/category/batch/move`, data)
}

export function getCategoryFullTrace(id: number): Promise<ApiResponse<CategoryFullTrace>> {
  return request.get<CategoryFullTrace>(`${API_PREFIX}/category/${id}/full-trace`)
}

export function checkCategoryConstraints(data: {
  name?: string
  code?: string
  id?: number
  parentId?: number
}): Promise<ApiResponse<{ valid: boolean; errors: CategoryConstraintError[] }>> {
  return request.post<{ valid: boolean; errors: CategoryConstraintError[] }>(
    `${API_PREFIX}/category/check-constraints`,
    data
  )
}

export function getTreeWithStats(): Promise<ApiResponse<CategoryTree[]>> {
  return request.get<CategoryTree[]>(`${API_PREFIX}/category/tree-with-stats`)
}
