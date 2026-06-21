import request from '@/utils/request';
import {
  MessageDeliveryStatus,
  MessageBusinessType,
  MessagePushChannel,
  MessageJumpType,
  MessageDeliveryLogAction,
} from '@/constants/recruitment';

export interface MessageDeliveryItem {
  id: number;
  messageCode: string;
  businessType: MessageBusinessType;
  scene: string;
  templateId?: number;
  templateCode?: string;
  title: string;
  content: string;
  summary?: string;
  pushChannel: MessagePushChannel;
  receiverId: number;
  receiverName?: string;
  receiverRole?: string;
  receiverContact?: string;
  deliveryStatus: MessageDeliveryStatus;
  readStatus: 'read' | 'unread';
  readAt?: string;
  sentAt?: string;
  failedReason?: string;
  retryCount: number;
  lastRetryAt?: string;
  businessId?: number;
  businessCode?: string;
  jumpType: MessageJumpType;
  jumpUrl?: string;
  jumpParams?: string;
  companyId?: number;
  priority: number;
  isAbnormal: boolean;
  abnormalType?: string;
  abnormalRemark?: string;
  triggeredBy?: number;
  triggeredByName?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageDeliveryLogItem {
  id: number;
  messageId: number;
  messageCode?: string;
  action: MessageDeliveryLogAction;
  actionDetail?: string;
  oldDeliveryStatus?: MessageDeliveryStatus;
  newDeliveryStatus?: MessageDeliveryStatus;
  oldReadStatus?: string;
  newReadStatus?: string;
  changedFields?: string;
  oldValues?: string;
  newValues?: string;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  remark?: string;
  created_at: string;
}

export interface MessageDeliveryQueryParams {
  page?: number;
  pageSize?: number;
  businessType?: MessageBusinessType;
  scene?: string;
  deliveryStatus?: MessageDeliveryStatus;
  readStatus?: 'read' | 'unread';
  pushChannel?: MessagePushChannel;
  keyword?: string;
  startTime?: string;
  endTime?: string;
  isAbnormal?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

export interface MessageDeliveryStats {
  totalCount: number;
  successCount: number;
  failedCount: number;
  readCount: number;
  unreadCount: number;
  successRate: number;
  readRate: number;
}

export interface BatchOperationResult {
  successCount: number;
  failCount: number;
  totalCount: number;
  failedIds?: number[];
  errors?: string[];
}

export function getMessageList(params: MessageDeliveryQueryParams) {
  return request({
    url: '/message-deliveries/list',
    method: 'get',
    params,
  });
}

export function getMessageDetail(id: number) {
  return request({
    url: `/message-deliveries/detail/${id}`,
    method: 'get',
  });
}

export function getUnreadCount() {
  return request({
    url: '/message-deliveries/unread-count',
    method: 'get',
  });
}

export function getMessageStats(days = 30) {
  return request({
    url: '/message-deliveries/stats',
    method: 'get',
    params: { days },
  });
}

export function markMessageAsRead(id: number) {
  return request({
    url: `/message-deliveries/read/${id}`,
    method: 'put',
  });
}

export function markMessageAsUnread(id: number) {
  return request({
    url: `/message-deliveries/unread/${id}`,
    method: 'put',
  });
}

export function markAllMessagesAsRead() {
  return request({
    url: '/message-deliveries/read-all',
    method: 'put',
  });
}

export function retryMessage(id: number) {
  return request({
    url: `/message-deliveries/retry/${id}`,
    method: 'put',
  });
}

export function batchRetryMessages(ids: number[]) {
  return request({
    url: '/message-deliveries/batch-retry',
    method: 'post',
    data: { ids },
  });
}

export function batchMarkMessagesRead(ids: number[]) {
  return request({
    url: '/message-deliveries/batch-mark-read',
    method: 'post',
    data: { ids },
  });
}

export function batchDeleteMessages(ids: number[]) {
  return request({
    url: '/message-deliveries/batch-delete',
    method: 'post',
    data: { ids },
  });
}

export function batchMarkOverdueUnread() {
  return request({
    url: '/message-deliveries/batch-mark-overdue',
    method: 'post',
  });
}

export function getMessageLogs(id: number, page = 1, pageSize = 20) {
  return request({
    url: `/message-deliveries/logs/${id}`,
    method: 'get',
    params: { page, pageSize },
  });
}

export function deleteMessage(id: number) {
  return request({
    url: `/message-deliveries/${id}`,
    method: 'delete',
  });
}

export function triggerMessage(data: {
  businessType: MessageBusinessType;
  businessId?: number;
  businessCode?: string;
  receiverId: number;
  templateCode?: string;
  title?: string;
  content?: string;
  templateVariables?: Record<string, any>;
  pushChannel?: MessagePushChannel;
  jumpType?: MessageJumpType;
  jumpUrl?: string;
  jumpParams?: Record<string, any>;
  companyId?: number;
  priority?: number;
}) {
  return request({
    url: '/message-deliveries/trigger',
    method: 'post',
    data,
  });
}

export function adminClearHistory(days?: number) {
  return request({
    url: '/message-deliveries/admin/clear-history',
    method: 'post',
    data: { days },
  });
}
