import { BaseEntity, StatusType, PaginationParams } from './common';

export type OrgType = 1 | 2 | 3 | 4;

export interface Organization extends BaseEntity {
  parent_id?: string;
  name: string;
  code: string;
  org_type: number;
  leader?: string;
  phone?: string;
  email?: string;
  address?: string;
  sort?: number;
  status: StatusType;
}

export interface CreateOrganizationRequest {
  parent_id?: string;
  name: string;
  code: string;
  org_type: number;
  leader?: string;
  phone?: string;
  email?: string;
  address?: string;
  sort?: number;
  status?: StatusType;
}

export interface UpdateOrganizationRequest {
  name?: string;
  org_type?: number;
  leader?: string;
  phone?: string;
  email?: string;
  address?: string;
  sort?: number;
  status?: StatusType;
}

export interface OrganizationQueryParams extends PaginationParams {
  keyword?: string;
  status?: StatusType;
  org_type?: number;
}

export interface OrganizationVO extends Organization {
  children?: OrganizationVO[];
}