import { BaseEntity, StatusType, PaginationParams } from './common';

export type TransactionStatus = 0 | 1 | 2 | 3 | 4 | 5;
export type TransactionType = 1 | 2 | 3 | 4;
export type AuditStatus = 0 | 1 | 2 | 3;

export interface Transaction extends BaseEntity {
  transaction_no: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  payer_account?: string;
  payer_name?: string;
  payee_account?: string;
  payee_name?: string;
  product_id?: string;
  org_id?: string;
  operator_id?: string;
  status: TransactionStatus;
  audit_status: AuditStatus;
  remark?: string;
  transaction_time?: Date;
  fee?: number;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  currency?: string;
  payer_account?: string;
  payer_name?: string;
  payee_account?: string;
  payee_name?: string;
  product_id?: string;
  org_id?: string;
  remark?: string;
}

export interface UpdateTransactionRequest {
  remark?: string;
}

export interface TransactionQueryParams extends PaginationParams {
  keyword?: string;
  transaction_no?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  audit_status?: AuditStatus;
  org_id?: string;
  start_time?: string;
  end_time?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface TransactionVO extends Transaction {
  product_name?: string;
  org_name?: string;
  operator_name?: string;
  status_text?: string;
  audit_status_text?: string;
  type_text?: string;
}