export enum NotificationType {
  SYSTEM = 1, BUSINESS = 2, RISK = 3, FINANCE = 4
}
export const NotificationTypeMap: Record<number, string> = {
  [NotificationType.SYSTEM]: '系统通知', [NotificationType.BUSINESS]: '业务通知',
  [NotificationType.RISK]: '风控通知', [NotificationType.FINANCE]: '财务通知'
}
