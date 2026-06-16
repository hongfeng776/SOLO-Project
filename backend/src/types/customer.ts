import { BaseEntity, PaginationParams } from './common';

export type IdType = 1 | 2 | 3 | 4;
export type CustomerType = 1 | 2;
export type CustomerLevel = 1 | 2 | 3 | 4 | 5;
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type CustomerStatus = 0 | 1 | 2;

export interface Customer extends BaseEntity {
  customer_no: string;
  customer_name?: string;
  id_card_no?: string;
  id_type?: IdType;
  customer_type?: CustomerType;
  customer_level?: CustomerLevel;
  mobile?: string;
  address?: string;
  risk_level?: RiskLevel;
  risk_tags?: string;
  status: CustomerStatus;
  org_id?: string;
  open_date?: Date;
}

export interface CreateCustomerRequest {
  customer_no: string;
  customer_name?: string;
  id_card_no?: string;
  id_type?: IdType;
  customer_type?: CustomerType;
  customer_level?: CustomerLevel;
  mobile?: string;
  address?: string;
  risk_level?: RiskLevel;
  risk_tags?: string;
  status?: CustomerStatus;
  org_id?: string;
  open_date?: string;
}

export interface UpdateCustomerRequest {
  customer_name?: string;
  id_card_no?: string;
  id_type?: IdType;
  customer_type?: CustomerType;
  customer_level?: CustomerLevel;
  mobile?: string;
  address?: string;
  risk_level?: RiskLevel;
  risk_tags?: string;
  status?: CustomerStatus;
  org_id?: string;
  open_date?: string;
}

export interface CustomerQueryParams extends PaginationParams {
  keyword?: string;
  customer_no?: string;
  customer_name?: string;
  id_card_no?: string;
  id_type?: IdType;
  customer_type?: CustomerType;
  customer_level?: CustomerLevel;
  mobile?: string;
  risk_level?: RiskLevel;
  status?: CustomerStatus;
  org_id?: string;
}

export interface CustomerVO extends Customer {
  org_name?: string;
  id_type_text?: string;
  customer_type_text?: string;
  customer_level_text?: string;
  risk_level_text?: string;
  status_text?: string;
}
