import request from '@/utils/request';
import type { SilhouetteMaterialQuery, SilhouetteMaterialItem, PageResult } from '@/types';

export function getSilhouetteList(params: SilhouetteMaterialQuery) {
  return request<PageResult<SilhouetteMaterialItem>>({
    url: '/silhouettes',
    method: 'get',
    params
  });
}

export function getSilhouetteCategoryList() {
  return request<string[]>({
    url: '/silhouettes/categories',
    method: 'get'
  });
}

export function createSilhouette(formData: FormData) {
  return request<SilhouetteMaterialItem>({
    url: '/silhouettes',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function updateSilhouette(id: number, formData: FormData) {
  return request<SilhouetteMaterialItem>({
    url: `/silhouettes/${id}`,
    method: 'put',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function deleteSilhouette(id: number) {
  return request<null>({
    url: `/silhouettes/${id}`,
    method: 'delete'
  });
}

export function batchDeleteSilhouette(ids: number[]) {
  return request<null>({
    url: '/silhouettes/batch-delete',
    method: 'post',
    data: { ids }
  });
}

export function updateSilhouetteStatus(id: number, status: number) {
  return request<SilhouetteMaterialItem>({
    url: `/silhouettes/${id}/status`,
    method: 'put',
    data: { status }
  });
}

export function batchUpdateSilhouetteStatus(ids: number[], status: number) {
  return request<null>({
    url: '/silhouettes/batch-status',
    method: 'post',
    data: { ids, status }
  });
}
