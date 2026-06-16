const { Message } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePagination, parseSort } = require('../utils/helpers');

class MessageService {
  async getMessageList(query, userId) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);

    const where = {};

    if (query.messageType !== undefined) where.message_type = query.messageType;
    if (query.isRead !== undefined) where.is_read = query.isRead;

    if (userId) {
      where[Op.or] = [
        { receiver_id: userId },
        { is_broadcast: 1 },
      ];
    }

    const { count, rows } = await Message.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((msg) => ({
        id: msg.id,
        messageType: msg.message_type,
        title: msg.title,
        content: msg.content,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        isBroadcast: msg.is_broadcast,
        isRead: msg.is_read,
        readTime: msg.read_time,
        linkType: msg.link_type,
        linkId: msg.link_id,
        linkUrl: msg.link_url,
        priority: msg.priority,
        extraData: msg.extra_data,
        pushChannel: msg.push_channel,
        pushStatus: msg.push_status,
        scheduledTime: msg.scheduled_time,
        createdAt: msg.created_at,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getMessageById(id) {
    const message = await Message.findByPk(id);
    if (!message) {
      throw new NotFoundError('消息不存在');
    }
    return {
      id: message.id,
      messageType: message.message_type,
      title: message.title,
      content: message.content,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      isBroadcast: message.is_broadcast,
      isRead: message.is_read,
      readTime: message.read_time,
      linkType: message.link_type,
      linkId: message.link_id,
      linkUrl: message.link_url,
      priority: message.priority,
      extraData: message.extra_data,
      pushChannel: message.push_channel,
      pushStatus: message.push_status,
      pushTime: message.push_time,
      scheduledTime: message.scheduled_time,
      createdAt: message.created_at,
    };
  }

  async createMessage(data) {
    const message = await Message.create({
      message_type: data.messageType,
      title: data.title,
      content: data.content,
      sender_id: data.senderId || null,
      receiver_id: data.receiverId,
      is_broadcast: 0,
      is_read: 0,
      link_type: data.linkType || null,
      link_id: data.linkId || null,
      link_url: data.linkUrl || null,
      priority: data.priority ?? 0,
      extra_data: data.extraData || null,
      push_channel: data.pushChannel || null,
      scheduled_time: data.scheduledTime || null,
    });
    return message.id;
  }

  async createBroadcastMessage(data) {
    const message = await Message.create({
      message_type: data.messageType,
      title: data.title,
      content: data.content,
      sender_id: data.senderId || null,
      receiver_id: null,
      is_broadcast: 1,
      is_read: 0,
      link_type: data.linkType || null,
      link_id: data.linkId || null,
      link_url: data.linkUrl || null,
      priority: data.priority ?? 0,
      extra_data: data.extraData || null,
      push_channel: data.pushChannel || null,
      scheduled_time: data.scheduledTime || null,
    });
    return message.id;
  }

  async markAsRead(id, userId) {
    const message = await Message.findByPk(id);
    if (!message) {
      throw new NotFoundError('消息不存在');
    }
    if (message.is_broadcast !== 1 && message.receiver_id !== userId) {
      throw new BadRequestError('无权操作此消息');
    }
    await Message.update({
      is_read: 1,
      read_time: new Date(),
    }, { where: { id } });
    return true;
  }

  async markAllAsRead(userId) {
    await Message.update({
      is_read: 1,
      read_time: new Date(),
    }, {
      where: {
        [Op.or]: [
          { receiver_id: userId },
          { is_broadcast: 1 },
        ],
        is_read: 0,
      },
    });
    return true;
  }

  async deleteMessage(id) {
    const message = await Message.findByPk(id);
    if (!message) {
      throw new NotFoundError('消息不存在');
    }
    await message.destroy();
    return true;
  }

  async getUnreadCount(userId) {
    const where = {
      is_read: 0,
      [Op.or]: [
        { receiver_id: userId },
        { is_broadcast: 1 },
      ],
    };

    const typeStats = await Message.findAll({
      where,
      attributes: ['message_type', [require('../config/database').sequelize.fn('COUNT', '*'), 'count']],
      group: ['message_type'],
      raw: true,
    });

    const totalUnread = await Message.count({ where });

    const typeMap = {};
    for (const item of typeStats) {
      typeMap[item.message_type] = Number(item.count);
    }

    return {
      total: totalUnread,
      typeStats: typeMap,
    };
  }

  async getMessagesByLink(linkType, linkId) {
    const messages = await Message.findAll({
      where: {
        link_type: linkType,
        link_id: linkId,
      },
      order: [['created_at', 'DESC']],
    });

    return messages.map((msg) => ({
      id: msg.id,
      messageType: msg.message_type,
      title: msg.title,
      content: msg.content,
      isBroadcast: msg.is_broadcast,
      isRead: msg.is_read,
      priority: msg.priority,
      createdAt: msg.created_at,
    }));
  }
}

module.exports = new MessageService();
