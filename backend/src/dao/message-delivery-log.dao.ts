import { Op } from 'sequelize';
import MessageDeliveryLog from '../models/message-delivery-log.model';
import { MessageDeliveryLogAction } from '../constants/recruitment.enum';

export interface MessageDeliveryLogQueryParams {
  page?: number;
  pageSize?: number;
  messageId?: number;
  messageCode?: string;
  action?: MessageDeliveryLogAction;
  operatorId?: number;
  startTime?: string;
  endTime?: string;
}

class MessageDeliveryLogDAO {
  async create(data: any) {
    return MessageDeliveryLog.create(data);
  }

  async getByMessageId(messageId: number, page = 1, pageSize = 20) {
    return MessageDeliveryLog.findAndCountAll({
      where: { messageId },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });
  }

  async getList(params: MessageDeliveryLogQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      messageId,
      messageCode,
      action,
      operatorId,
      startTime,
      endTime,
    } = params;

    const where: any = {};

    if (messageId !== undefined) where.messageId = messageId;
    if (messageCode) where.messageCode = messageCode;
    if (action) where.action = action;
    if (operatorId !== undefined) where.operatorId = operatorId;

    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) where.created_at[Op.gte] = new Date(startTime);
      if (endTime) where.created_at[Op.lte] = new Date(endTime);
    }

    return MessageDeliveryLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });
  }

  async getLatestLog(messageId: number, action?: MessageDeliveryLogAction) {
    const where: any = { messageId };
    if (action) where.action = action;
    return MessageDeliveryLog.findOne({
      where,
      order: [['created_at', 'DESC']],
    });
  }
}

export default new MessageDeliveryLogDAO();
