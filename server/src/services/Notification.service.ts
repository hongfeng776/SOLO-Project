import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';

interface NotifyResult {
  success: boolean;
  message: string;
  channel: 'sms' | 'email';
}

class NotificationService {
  public async sendActivationSms(phone: string, username: string, token: string): Promise<NotifyResult> {
    console.log(`[SMS] 激活短信发送成功: phone=${phone}, username=${username}`);
    return { success: true, message: '激活短信发送成功', channel: 'sms' };
  }

  public async sendActivationEmail(email: string, username: string, token: string): Promise<NotifyResult> {
    console.log(`[EMAIL] 激活邮件发送成功: email=${email}, username=${username}`);
    return { success: true, message: '激活邮件发送成功', channel: 'email' };
  }

  public async checkDuplicateNotification(key: string): Promise<boolean> {
    const sent = await CacheUtils.get(`notify:sent:${key}`);
    return !!sent;
  }

  public async markNotificationSent(key: string): Promise<void> {
    await CacheUtils.set(`notify:sent:${key}`, '1', CacheTTL.LONG);
  }
}

export default new NotificationService();
