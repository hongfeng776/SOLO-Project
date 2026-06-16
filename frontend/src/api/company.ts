import { request, PaginationResult } from '@/utils/request';

export interface CompanyItem {
  id: number;
  name: string;
  shortName?: string;
  logo?: string;
  industry?: string;
  scale?: string;
  nature?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  status: number;
  sort: number;
  created_at?: string;
  updated_at?: string;
}

export const getCompanyListApi = (params: any): Promise<PaginationResult<CompanyItem>> => {
  return request.get<PaginationResult<CompanyItem>>('/companies', { params });
};

export const getCompanyDetailApi = (id: number): Promise<CompanyItem> => {
  return request.get<CompanyItem>(`/companies/${id}`);
};

export const createCompanyApi = (data: Partial<CompanyItem>): Promise<CompanyItem> => {
  return request.post<CompanyItem>('/companies', data);
};

export const updateCompanyApi = (id: number, data: Partial<CompanyItem>): Promise<any> => {
  return request.put<any>(`/companies/${id}`, data);
};

export const deleteCompanyApi = (id: number): Promise<any> => {
  return request.delete<any>(`/companies/${id}`);
};

export const batchDeleteCompanyApi = (ids: number[]): Promise<any> => {
  return request.post<any>('/companies/batch-remove', { ids });
};
