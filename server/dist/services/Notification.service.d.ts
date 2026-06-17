interface NotifyResult {
    success: boolean;
    message: string;
    channel: 'sms' | 'email';
}
declare class NotificationService {
    sendActivationSms(phone: string, username: string, token: string): Promise<NotifyResult>;
    sendActivationEmail(email: string, username: string, token: string): Promise<NotifyResult>;
    checkDuplicateNotification(key: string): Promise<boolean>;
    markNotificationSent(key: string): Promise<void>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=Notification.service.d.ts.map