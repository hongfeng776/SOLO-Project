import { WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { Message } from '../models/Message';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../types';

export interface MessageQueryParams {
  page?: number;
  pageSize?: number;
  user_type: number;
  user_id: number;
  type?: number;
  is_read?: number;
}

export interface MessageSendPayload {
  user_type: number;
  user_id: number;
  type: number;
  title: string;
  content?: string;
}

export interface BatchSendPayload {
  user_type: number;
  user_ids: number[];
  type: number;
  title: string;
  content?: string;
}

export interface MessageStats {
  total: number;
  unread: number;
  by_type: Record<number, { total: number; unread: number }>;
}

class MessageService {
  private readonly messageDao = daos.messageDao;

  async sendMessage(payload: MessageSendPayload): Promise<Message> {
    const { user_type, user_id, type, title, content } = payload;

    if (![1, 2, 3].includes(user_type)) {
      throw new AppError('无效的接收人类型', 400);
    }

    if (![1, 2, 3, 4].includes(type)) {
      throw new AppError('无效的消息类型', 400);
    }

    if (!title || title.trim().length === 0) {
      throw new AppError('消息标题不能为空', 400);
    }

    const message = await this.messageDao.create({
      user_type,
      user_id,
      type,
      title: title.substring(0, 200),
      content,
      is_read: 0,
    });

    this.triggerPushNotification(message).catch(err => {
      console.error('Failed to trigger push notification:', err);
    });

    return message;
  }

  async batchSendMessage(payload: BatchSendPayload): Promise<number> {
    const { user_type, user_ids, type, title, content } = payload;

    if (!user_ids || user_ids.length === 0) {
      throw new AppError('接收人列表不能为空', 400);
    }

    if (![1, 2, 3].includes(user_type)) {
      throw new AppError('无效的接收人类型', 400);
    }

    if (![1, 2, 3, 4].includes(type)) {
      throw new AppError('无效的消息类型', 400);
    }

    if (!title || title.trim().length === 0) {
      throw new AppError('消息标题不能为空', 400);
    }

    const messages: any[] = user_ids.map(userId => ({
      user_type,
      user_id: userId,
      type,
      title: title.substring(0, 200),
      content,
      is_read: 0,
    }));

    const created = await Message.bulkCreate(messages as any);
    return created.length;
  }

  async getUserMessages(params: MessageQueryParams): Promise<PageResult<Message>> {
    const { page = 1, pageSize = 10, user_type, user_id, type, is_read } = params;

    const where: WhereOptions<Message> = {
      user_type,
      user_id,
    };

    if (type !== undefined) {
      where.type = type;
    }
    if (is_read !== undefined) {
      where.is_read = is_read;
    }

    return this.messageDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getMessageDetail(id: number, userType: number, userId: number): Promise<Message> {
    const message = await this.messageDao.findById(id);
    if (!message) {
      throw new AppError('消息不存在', 404);
    }

    if (message.user_type !== userType || message.user_id !== userId) {
      throw new AppError('无权访问该消息', 403);
    }

    if (message.is_read === 0) {
      await this.messageDao.markAsRead(id);
      message.is_read = 1;
      message.read_at = new Date();
    }

    return message;
  }

  async markAsRead(id: number, userType: number, userId: number): Promise<void> {
    const message = await this.messageDao.findById(id);
    if (!message) {
      throw new AppError('消息不存在', 404);
    }

    if (message.user_type !== userType || message.user_id !== userId) {
      throw new AppError('无权操作该消息', 403);
    }

    if (message.is_read === 0) {
      await this.messageDao.markAsRead(id);
    }
  }

  async markAllAsRead(userType: number, userId: number): Promise<number> {
    return this.messageDao.markAllAsRead(userType, userId);
  }

  async deleteMessage(id: number, userType: number, userId: number): Promise<void> {
    const message = await this.messageDao.findById(id);
    if (!message) {
      throw new AppError('消息不存在', 404);
    }

    if (message.user_type !== userType || message.user_id !== userId) {
      throw new AppError('无权删除该消息', 403);
    }

    await this.messageDao.delete(id);
  }

  async getUnreadCount(userType: number, userId: number): Promise<number> {
    return this.messageDao.getUnreadCount(userType, userId);
  }

  async getMessageStats(userType: number, userId: number): Promise<MessageStats> {
    const [total, unread] = await Promise.all([
      Message.count({ where: { user_type: userType, user_id: userId } as WhereOptions<Message> }),
      this.messageDao.getUnreadCount(userType, userId),
    ]);

    const by_type: Record<number, { total: number; unread: number }> = {};
    const types = [1, 2, 3, 4];

    for (const t of types) {
      const [typeTotal, typeUnread] = await Promise.all([
        Message.count({ where: { user_type: userType, user_id: userId, type: t } as WhereOptions<Message> }),
        Message.count({ where: { user_type: userType, user_id: userId, type: t, is_read: 0 } as WhereOptions<Message> }),
      ]);
      by_type[t] = { total: typeTotal, unread: typeUnread };
    }

    return { total, unread, by_type };
  }

  private async triggerPushNotification(message: Message): Promise<void> {
    console.log(`[Push Notification] Type:${message.type} -> User[${message.user_type}:${message.user_id}] - ${message.title}`);
  }
}

export const messageService = new MessageService();
export default MessageService;
