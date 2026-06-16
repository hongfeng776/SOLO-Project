import { BaseEntity, StatusType, PaginationParams } from './common';

export interface Product extends BaseEntity {
  name: string;
  code: string;
  category?: string;
  type?: string;
  description?: string;
  risk_level?: 1 | 2 | 3 | 4 | 5;
  min_amount?: number;
  max_amount?: number;
  interest_rate?: number;
  term_days?: number;
  sort?: number;
  status: StatusType;
}

export interface CreateProductRequest {
  name: string;
  code: string;
  category?: string;
  type?: string;
  description?: string;
  risk_level?: 1 | 2 | 3 | 4 | 5;
  min_amount?: number;
  max_amount?: number;
  interest_rate?: number;
  term_days?: number;
  sort?: number;
  status?: StatusType;
}

export interface UpdateProductRequest {
  name?: string;
  category?: string;
  type?: string;
  description?: string;
  risk_level?: 1 | 2 | 3 | 4 | 5;
  min_amount?: number;
  max_amount?: number;
  interest_rate?: number;
  term_days?: number;
  sort?: number;
  status?: StatusType;
}

export interface ProductQueryParams extends PaginationParams {
  keyword?: string;
  code?: string;
  category?: string;
  type?: string;
  status?: StatusType;
  risk_level?: 1 | 2 | 3 | 4 | 5;
}