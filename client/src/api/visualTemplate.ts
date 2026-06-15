import request from '@/utils/request';
import type { VisualTemplateQuery, VisualTemplateItem, PageResult } from '@/types';

export function getVisualTemplateList(params: VisualTemplateQuery) {
  return request<PageResult<VisualTemplateItem>>({
    url: '/visual-templates',
    method: 'get',
    params
  });
}

export function getVisualTemplateStyleTypeList() {
  return request<string[]>({
    url: '/visual-templates/style-types',
    method: 'get'
  });
}

export function createVisualTemplate(formData: FormData) {
  return request<VisualTemplateItem>({
    url: '/visual-templates',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function updateVisualTemplate(id: number, formData: FormData) {
  return request<VisualTemplateItem>({
    url: `/visual-templates/${id}`,
    method: 'put',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function deleteVisualTemplate(id: number) {
  return request<null>({
    url: `/visual-templates/${id}`,
    method: 'delete'
  });
}

export function batchDeleteVisualTemplate(ids: number[]) {
  return request<null>({
    url: '/visual-templates/batch-delete',
    method: 'post',
    data: { ids }
  });
}

export function updateVisualTemplateStatus(id: number, status: number) {
  return request<VisualTemplateItem>({
    url: `/visual-templates/${id}/status`,
    method: 'put',
    data: { status }
  });
}

export function batchUpdateVisualTemplateStatus(ids: number[], status: number) {
  return request<null>({
    url: '/visual-templates/batch-status',
    method: 'post',
    data: { ids, status }
  });
}

export function getVisualTemplateDetail(id: number) {
  return request<VisualTemplateItem>({
    url: `/visual-templates/${id}`,
    method: 'get'
  });
}

export function checkTemplateNameUnique(name: string, excludeId?: number) {
  return request<{ unique: boolean }>({
    url: '/visual-templates/check-name',
    method: 'get',
    params: { name, excludeId }
  });
}

export function exportVisualTemplate(params: VisualTemplateQuery) {
  return request<VisualTemplateItem[]>({
    url: '/visual-templates/export',
    method: 'get',
    params
  });
}
