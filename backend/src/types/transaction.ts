import { BaseEntity, StatusType, PaginationParams } from './common';

export type TransactionStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type TransactionType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type AuditStatus = 0 | 1 | 2 | 3 | 10 | 11;

export interface Transaction extends BaseEntity {
  transaction_no: string;
  channel_code?: string;
  channel_terminal?: string;
  type: TransactionType;
  business_line?: string;
  amount: number;
  currency?: string;
  customer_id?: string;
  customer_no?: string;
  payer_account?: string;
  payer_name?: string;
  payee_account?: string;
  payee_name?: string;
  payee_bank_code?: string;
  product_id?: string;
  org_id?: string;
  operator_id?: string;
  status: TransactionStatus;
  audit_status: AuditStatus;
  risk_level?: number;
  risk_tags?: string;
  remark?: string;
  current_node?: string;
  next_node?: string;
  transaction_time?: Date;
  fee?: number;
  original_transaction_no?: string;
  request_id?: string;
}

export interface CreateTransactionRequest {
  channel_code?: string;
  channel_terminal?: string;
  type: TransactionType;
  business_line?: string;
  amount: number;
  currency?: string;
  customer_id?: string;
  customer_no?: string;
  payer_account?: string;
  payer_name?: string;
  payee_account?: string;
  payee_name?: string;
  payee_bank_code?: string;
  product_id?: string;
  org_id?: string;
  risk_level?: number;
  risk_tags?: string;
  remark?: string;
  current_node?: string;
  next_node?: string;
  transaction_time?: string;
  fee?: number;
  original_transaction_no?: string;
  request_id?: string;
}

export interface UpdateTransactionRequest {
  remark?: string;
  risk_level?: number;
  risk_tags?: string;
  current_node?: string;
  next_node?: string;
}

export interface TransactionQueryParams extends PaginationParams {
  keyword?: string;
  transaction_no?: string;
  channel_code?: string;
  type?: TransactionType;
  business_line?: string;
  status?: TransactionStatus;
  audit_status?: AuditStatus;
  customer_id?: string;
  customer_no?: string;
  risk_level?: number;
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
  customer_name?: string;
  status_text?: string;
  audit_status_text?: string;
  type_text?: string;
  channel_text?: string;
  risk_level_text?: string;
}
