import { BaseDao } from './BaseDao';
import { Message } from '../models/Message';
import { WhereOptions } from 'sequelize';

export class MessageDao extends BaseDao<Message> {
  constructor() {
    super(Message);
  }

  async markAsRead(id: number): Promise<number> {
    const [affectedCount] = await Message.update(
      { is_read: 1, read_at: new Date() },
      { where: { id } as WhereOptions<Message> }
    );
    return affectedCount;
  }

  async markAllAsRead(userType: number, userId: number): Promise<number> {
    const [affectedCount] = await Message.update(
      { is_read: 1, read_at: new Date() },
      { where: { user_type: userType, user_id: userId, is_read: 0 } as WhereOptions<Message> }
    );
    return affectedCount;
  }

  async getUnreadCount(userType: number, userId: number): Promise<number> {
    return Message.count({
      where: { user_type: userType, user_id: userId, is_read: 0 } as WhereOptions<Message>,
    });
  }
}

export default MessageDao;
