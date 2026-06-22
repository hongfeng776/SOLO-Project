import { Op, FindAndCountOptions } from 'sequelize';
import MessageDelivery from '../models/message-delivery.model';
import { MessageDeliveryStatus, MessageBusinessType, MessagePushChannel } from '../constants/recruitment.enum';

export interface MessageDeliveryQueryParams {
  page?: number;
  pageSize?: number;
  receiverId?: number;
  businessType?: MessageBusinessType;
  scene?: string;
  deliveryStatus?: MessageDeliveryStatus;
  readStatus?: 'read' | 'unread';
  pushChannel?: MessagePushChannel;
  companyId?: number;
  keyword?: string;
  startTime?: string;
  endTime?: string;
  isAbnormal?: boolean;
  businessId?: number;
  sortBy?: string;
  sortOrder?: string;
}

class MessageDeliveryDAO {
  async findByCode(messageCode: string) {
    return MessageDelivery.findOne({ where: { messageCode } });
  }

  async findById(id: number) {
    return MessageDelivery.findByPk(id);
  }

  async getList(params: MessageDeliveryQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      receiverId,
      businessType,
      scene,
      deliveryStatus,
      readStatus,
      pushChannel,
      companyId,
      keyword,
      startTime,
      endTime,
      isAbnormal,
      businessId,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = params;

    const where: any = {};

    if (receiverId !== undefined) where.receiverId = receiverId;
    if (businessType) where.businessType = businessType;
    if (scene) where.scene = scene;
    if (deliveryStatus) where.deliveryStatus = deliveryStatus;
    if (readStatus) where.readStatus = readStatus;
    if (pushChannel) where.pushChannel = pushChannel;
    if (companyId !== undefined) where.companyId = companyId;
    if (isAbnormal !== undefined) where.isAbnormal = isAbnormal;
    if (businessId !== undefined) where.businessId = businessId;

    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } },
        { messageCode: { [Op.like]: `%${keyword}%` } },
        { receiverName: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) where.created_at[Op.gte] = new Date(startTime);
      if (endTime) where.created_at[Op.lte] = new Date(endTime);
    }

    const options: FindAndCountOptions = {
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [[sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    };

    return MessageDelivery.findAndCountAll(options);
  }

  async getByIds(ids: number[]) {
    return MessageDelivery.findAll({ where: { id: { [Op.in]: ids } } });
  }

  async create(data: any) {
    return MessageDelivery.create(data);
  }

  async update(id: number, data: any) {
    const result = await MessageDelivery.update(data, { where: { id } });
    return result[0] > 0;
  }

  async batchUpdateStatus(ids: number[], data: any) {
    return MessageDelivery.update(data, { where: { id: { [Op.in]: ids } } });
  }

  async batchDelete(ids: number[]) {
    return MessageDelivery.destroy({ where: { id: { [Op.in]: ids } } });
  }

  async countByReceiverAndStatus(receiverId: number, deliveryStatus?: MessageDeliveryStatus, readStatus?: 'read' | 'unread') {
    const where: any = { receiverId };
    if (deliveryStatus) where.deliveryStatus = deliveryStatus;
    if (readStatus) where.readStatus = readStatus;
    return MessageDelivery.count({ where });
  }

  async countUnread(receiverId: number) {
    return MessageDelivery.count({
      where: {
        receiverId,
        readStatus: 'unread',
      },
    });
  }

  async getFailedMessages(receiverId?: number, limit = 100) {
    const where: any = {
      deliveryStatus: MessageDeliveryStatus.SENT_FAILED,
    };
    if (receiverId !== undefined) where.receiverId = receiverId;
    return MessageDelivery.findAll({
      where,
      limit,
      order: [['created_at', 'DESC']],
    });
  }

  async getPendingMessages(limit = 100) {
    return MessageDelivery.findAll({
      where: { deliveryStatus: MessageDeliveryStatus.PENDING },
      limit,
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
    });
  }

  async markAllRead(receiverId: number) {
    return MessageDelivery.update(
      { readStatus: 'read', readAt: new Date() },
      { where: { receiverId, readStatus: 'unread' } }
    );
  }

  async getStats(receiverId?: number, days = 30) {
    const where: any = {};
    if (receiverId !== undefined) where.receiverId = receiverId;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    where.created_at = { [Op.gte]: startDate };

    const [
      totalCount,
      successCount,
      failedCount,
      readCount,
      unreadCount,
    ] = await Promise.all([
        MessageDelivery.count({ where }),
        MessageDelivery.count({ where: { ...where, deliveryStatus: MessageDeliveryStatus.SENT_SUCCESS } }),
        MessageDelivery.count({ where: { ...where, deliveryStatus: MessageDeliveryStatus.SENT_FAILED } }),
        MessageDelivery.count({ where: { ...where, readStatus: 'read' } }),
        MessageDelivery.count({ where: { ...where, readStatus: 'unread' } }),
      ]);

    return {
      totalCount,
      successCount,
      failedCount,
      readCount,
      unreadCount,
      successRate: totalCount > 0 ? Number(((successCount / totalCount) * 100).toFixed(2)) : 0,
      readRate: totalCount > 0 ? Number(((readCount / totalCount) * 100).toFixed(2)) : 0,
    };
  }

  async checkDuplicate(businessType: MessageBusinessType, businessId: number, receiverId: number) {
    return MessageDelivery.findOne({
      where: {
      businessType,
      businessId,
      receiverId,
      },
    });
  }

  async getByBusinessAndReceiver(businessType: MessageBusinessType, businessId: number, receiverId: number) {
    return MessageDelivery.findOne({
      where: {
        businessType,
        businessId,
        receiverId,
      },
    });
  }
}

export default new MessageDeliveryDAO();
