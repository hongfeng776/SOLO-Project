import { get, post, put, del } from '@/utils/request';
import type { ApiResponse, LoginParams, LoginResult, UserInfo, SystemConfig, PaginatedData, PaginationParams, CategoryInfo, TagInfo, ContentInfo, ContentListParams } from '@/types';
import service from '@/utils/request';

export const authApi = {
  login: (data: LoginParams) => post<ApiResponse<LoginResult>>('/auth/login', data),
  register: (data: LoginParams & { nickname: string }) => post<ApiResponse<LoginResult>>('/auth/register', data),
  me: () => get<ApiResponse<UserInfo>>('/auth/me'),
};

export const userApi = {
  list: (params: PaginationParams) => get<ApiResponse<PaginatedData<UserInfo>>>('/users', params),
  create: (data: Partial<UserInfo> & { password: string }) => post<ApiResponse<UserInfo>>('/users', data),
  update: (id: number, data: Partial<UserInfo>) => put<ApiResponse<UserInfo>>(`/users/${id}`, data),
  remove: (id: number) => del<ApiResponse<null>>(`/users/${id}`),
};

export const configApi = {
  list: (params: PaginationParams) => get<ApiResponse<PaginatedData<SystemConfig>>>('/configs', params),
  create: (data: Partial<SystemConfig>) => post<ApiResponse<SystemConfig>>('/configs', data),
  update: (id: number, data: Partial<SystemConfig>) => put<ApiResponse<SystemConfig>>(`/configs/${id}`, data),
  remove: (id: number) => del<ApiResponse<null>>(`/configs/${id}`),
};

export const categoryApi = {
  list: () => get<ApiResponse<PaginatedData<CategoryInfo>>>('/categories'),
  create: (data: Partial<CategoryInfo>) => post<ApiResponse<CategoryInfo>>('/categories', data),
  update: (id: number, data: Partial<CategoryInfo>) => put<ApiResponse<CategoryInfo>>(`/categories/${id}`, data),
  remove: (id: number) => del<ApiResponse<null>>(`/categories/${id}`),
};

export const tagApi = {
  list: () => get<ApiResponse<PaginatedData<TagInfo>>>('/tags'),
  create: (data: Partial<TagInfo>) => post<ApiResponse<TagInfo>>('/tags', data),
  update: (id: number, data: Partial<TagInfo>) => put<ApiResponse<TagInfo>>(`/tags/${id}`, data),
  remove: (id: number) => del<ApiResponse<null>>(`/tags/${id}`),
};

export const contentApi = {
  list: (params: ContentListParams) => get<ApiResponse<PaginatedData<ContentInfo>>>('/contents', params),
  detail: (id: number) => get<ApiResponse<ContentInfo>>(`/contents/${id}`),
  create: (data: Partial<ContentInfo> & { tagIds?: number[] }) => post<ApiResponse<ContentInfo>>('/contents', data),
  update: (id: number, data: Partial<ContentInfo> & { tagIds?: number[] }) => put<ApiResponse<ContentInfo>>(`/contents/${id}`, data),
  remove: (id: number) => del<ApiResponse<null>>(`/contents/${id}`),
};

export const uploadApi = {
  image: (file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return service.post<ApiResponse<{ url: string; filename: string }>>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt && evt.total && onProgress) {
          const percent = Math.min(100, Math.round((evt.loaded * 100) / evt.total));
          onProgress(percent);
        }
      },
    });
  },
};

export default { authApi, userApi, configApi, categoryApi, tagApi, contentApi, uploadApi };
