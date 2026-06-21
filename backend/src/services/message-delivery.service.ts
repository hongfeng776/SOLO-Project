import { Op } from 'sequelize';
import messageDeliveryDAO from '../dao/message-delivery.dao';
import messageDeliveryLogDAO from '../dao/message-delivery-log.dao';
import messageTemplateDAO from '../dao/message-template.dao';
import {
  MessageDeliveryStatus,
  MessageBusinessType,
  MessageDeliveryLogAction,
  MESSAGE_MAX_RETRY_COUNT,
  MESSAGE_BUSINESS_TYPE_SCENE_MAP,
  MESSAGE_BUSINESS_TYPE_JUMP_MAP,
  MessageTemplateStatus,
  MessagePushChannel,
  SCENE_PUSH_CHANNELS,
  MessageJumpType,
  MESSAGE_UNREAD_OVERDUE_DAYS,
  MESSAGE_BATCH_OPERATION_LIMIT,
  UserRole,
} from '../constants/recruitment.enum';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/app-error';
import User from '../models/user.model';
import dayjs from 'dayjs';

interface TriggerMessageParams {
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
  triggeredBy?: number;
  triggeredByName?: string;
  ip?: string;
  userAgent?: string;
}

interface BatchOperationResult {
  successCount: number;
  failCount: number;
  totalCount: number;
  failedIds?: number[];
  errors?: string[];
}

class MessageDeliveryService {
  async generateMessageCode(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `MSG_${timestamp}_${random}`;
  }

  async validateReceiverPermission(
    businessType: MessageBusinessType,
    businessId: number,
    receiverId: number
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      const user = await User.findByPk(receiverId);
      if (!user) {
        return { valid: false, reason: '接收人不存在' };
      }
      if (user.status !== 1 || user.accountStatus !== 'normal') {
        return { valid: false, reason: '接收人账号状态异常' };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, reason: '权限校验异常' };
    }
  }

  async getTemplateContent(
    businessType: MessageBusinessType,
    templateCode?: string,
    variables?: Record<string, any>
  ): Promise<{ title: string; content: string; templateId?: number }> {
    const scene = MESSAGE_BUSINESS_TYPE_SCENE_MAP[businessType];

    let template: any = null;
    if (templateCode) {
      template = await messageTemplateDAO.findByCode(templateCode);
    }

    if (!template) {
      const templates = await messageTemplateDAO.getBySceneAndStatus(
        scene,
        MessageTemplateStatus.ENABLED
      );
      if (templates && templates.length > 0) {
        templates.sort((a: any, b: any) => b.weight - a.weight);
        template = templates[0];
      }
    }

    if (template && template.templateStatus !== MessageTemplateStatus.ENABLED) {
      throw new BadRequestError('消息模板未启用');
    }

    let title = template?.title || '';
    let content = template?.content || '';

    if (variables) {
      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = variables[key] !== undefined && variables[key] !== null
          ? String(variables[key])
          : '';
        title = title.replace(new RegExp(placeholder, 'g'), value);
        content = content.replace(new RegExp(placeholder, 'g'), value);
      });
    }

    return {
      title,
      content,
      templateId: template?.id,
    };
  }

  async determinePushChannel(
    businessType: MessageBusinessType,
    receiverId: number,
    preferredChannel?: MessagePushChannel
  ): Promise<MessagePushChannel> {
    const scene = MESSAGE_BUSINESS_TYPE_SCENE_MAP[businessType];
    const sceneChannels = SCENE_PUSH_CHANNELS[scene] || [MessagePushChannel.IN_APP];

    if (preferredChannel && sceneChannels.includes(preferredChannel)) {
      return preferredChannel;
    }

    return MessagePushChannel.IN_APP;
  }

  async triggerMessage(params: TriggerMessageParams) {
    const {
      businessType,
      businessId,
      businessCode,
      receiverId,
      templateCode,
      title: inputTitle,
      content: inputContent,
      templateVariables,
      pushChannel: preferredChannel,
      jumpType: inputJumpType,
      jumpUrl,
      jumpParams,
      companyId,
      priority,
      triggeredBy,
      triggeredByName,
      ip,
      userAgent,
    } = params;

    const permResult = businessId ? await this.validateReceiverPermission(businessType, businessId, receiverId) : { valid: true };
    if (!permResult.valid) {
      throw new ForbiddenError(`接收人无权限接收该消息: ${permResult.reason}`);
    }

    const user = await User.findByPk(receiverId);
    if (!user) {
      throw new BadRequestError('接收人不存在');
    }

    const scene = MESSAGE_BUSINESS_TYPE_SCENE_MAP[businessType];
    const jumpType = inputJumpType || MESSAGE_BUSINESS_TYPE_JUMP_MAP[businessType];

    let title = inputTitle;
    let content = inputContent;
    let templateId: number | undefined;

    if (!title || !content) {
      const templateResult = await this.getTemplateContent(businessType, templateCode, templateVariables);
      if (!title) title = templateResult.title;
      if (!content) content = templateResult.content;
      templateId = templateResult.templateId;
    }

    if (!title || !content) {
      throw new BadRequestError('消息标题和内容不能为空');
    }

    const pushChannel = await this.determinePushChannel(businessType, receiverId, preferredChannel);
    const messageCode = await this.generateMessageCode();

    const summary = content.length > 100 ? content.substring(0, 100) + '...' : content;

    const message = await messageDeliveryDAO.create({
      messageCode,
      businessType,
      scene,
      templateId,
      templateCode,
      title,
      content,
      summary,
      pushChannel,
      receiverId,
      receiverName: user.realName || user.username,
      receiverRole: user.role,
      receiverContact: pushChannel === MessagePushChannel.SMS ? user.phone :
        pushChannel === MessagePushChannel.EMAIL ? user.email : undefined,
      deliveryStatus: MessageDeliveryStatus.PENDING,
      readStatus: 'unread',
      businessId,
      businessCode,
      jumpType,
      jumpUrl,
      jumpParams: jumpParams ? JSON.stringify(jumpParams) : undefined,
      companyId: companyId || user.companyId,
      priority: priority || 50,
      isAbnormal: false,
      triggeredBy,
      triggeredByName,
    });

    await messageDeliveryLogDAO.create({
      messageId: message.id,
      messageCode: message.messageCode,
      action: MessageDeliveryLogAction.TRIGGER,
      actionDetail: `触发${businessType}类型消息`,
      newDeliveryStatus: MessageDeliveryStatus.PENDING,
      operatorId: triggeredBy,
      operatorName: triggeredByName,
      ipAddress: ip,
      userAgent,
    });

    this.asyncPushMessage(message.id).catch(err => {
      console.error('异步推送消息失败:', err);
    });

    return message;
  }

  async asyncPushMessage(messageId: number) {
    try {
      const message = await messageDeliveryDAO.findById(messageId);
      if (!message) return;

      if (message.deliveryStatus !== MessageDeliveryStatus.PENDING &&
        message.deliveryStatus !== MessageDeliveryStatus.SENT_FAILED) {
        return;
      }

      await messageDeliveryLogDAO.create({
        messageId: message.id,
        messageCode: message.messageCode,
        action: MessageDeliveryLogAction.PUSH_ATTEMPT,
        actionDetail: `第${message.retryCount + 1}次推送尝试`,
        oldDeliveryStatus: message.deliveryStatus,
      });

      const pushResult = await this.doPush(message);

      if (pushResult.success) {
        await messageDeliveryDAO.update(message.id, {
          deliveryStatus: MessageDeliveryStatus.SENT_SUCCESS,
          sentAt: new Date(),
          failedReason: null,
        });

        await messageDeliveryLogDAO.create({
          messageId: message.id,
          messageCode: message.messageCode,
          action: MessageDeliveryLogAction.PUSH_SUCCESS,
          actionDetail: pushResult.detail || '推送成功',
          oldDeliveryStatus: message.deliveryStatus,
          newDeliveryStatus: MessageDeliveryStatus.SENT_SUCCESS,
        });
      } else {
        const newRetryCount = message.retryCount + 1;
        const hasMoreRetries = newRetryCount < MESSAGE_MAX_RETRY_COUNT;

        if (hasMoreRetries) {
          await messageDeliveryDAO.update(message.id, {
            deliveryStatus: MessageDeliveryStatus.SENT_FAILED,
            failedReason: pushResult.error,
            retryCount: newRetryCount,
            lastRetryAt: new Date(),
          });

          await messageDeliveryLogDAO.create({
            messageId: message.id,
            messageCode: message.messageCode,
            action: MessageDeliveryLogAction.RETRY,
            actionDetail: `推送失败，准备第${newRetryCount + 1}次重试: ${pushResult.error}`,
            oldDeliveryStatus: message.deliveryStatus,
            newDeliveryStatus: MessageDeliveryStatus.SENT_FAILED,
          });

          setTimeout(() => {
            this.asyncPushMessage(message.id).catch(err => {
              console.error('重试推送消息失败:', err);
            });
          }, 60000);
        } else {
          await messageDeliveryDAO.update(message.id, {
            deliveryStatus: MessageDeliveryStatus.SENT_FAILED,
            failedReason: pushResult.error,
            retryCount: newRetryCount,
            lastRetryAt: new Date(),
            isAbnormal: true,
            abnormalType: 'push_failed_exhausted',
            abnormalRemark: `超过最大重试次数${MESSAGE_MAX_RETRY_COUNT}次`,
          });

          await messageDeliveryLogDAO.create({
            messageId: message.id,
            messageCode: message.messageCode,
            action: MessageDeliveryLogAction.PUSH_FAILED,
            actionDetail: `推送最终失败: ${pushResult.error}`,
            oldDeliveryStatus: message.deliveryStatus,
            newDeliveryStatus: MessageDeliveryStatus.SENT_FAILED,
          });
        }
      }
    } catch (error: any) {
      console.error('推送消息异常:', error);
    }
  }

  async doPush(message: any): Promise<{ success: boolean; error?: string; detail?: string }> {
    try {
      switch (message.pushChannel) {
        case MessagePushChannel.IN_APP:
          return { success: true, detail: '站内信推送成功' };
        case MessagePushChannel.SMS:
          return { success: true, detail: '短信推送模拟成功' };
        case MessagePushChannel.EMAIL:
          return { success: true, detail: '邮件推送模拟成功' };
        case MessagePushChannel.WECHAT:
          return { success: true, detail: '微信推送模拟成功' };
        default:
          return { success: false, error: '未知推送渠道' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || '推送异常' };
    }
  }

  async getMessageList(params: any, currentUserId: number, userRole: string) {
    const queryParams = { ...params };

    if (userRole !== UserRole.ADMIN) {
      queryParams.receiverId = currentUserId;
    }

    return messageDeliveryDAO.getList(queryParams);
  }

  async getMessageDetail(id: number, currentUserId: number, userRole: string) {
    const message = await messageDeliveryDAO.findById(id);
    if (!message) {
      throw new NotFoundError('消息不存在');
    }

    if (userRole !== UserRole.ADMIN && message.receiverId !== currentUserId) {
      throw new ForbiddenError('无权限查看该消息');
    }

    if (message.readStatus === 'unread' && message.receiverId === currentUserId) {
      await this.markAsRead(id, currentUserId);
    }

    return message;
  }

  async markAsRead(id: number, currentUserId: number, ip?: string, userAgent?: string) {
    const message = await messageDeliveryDAO.findById(id);
    if (!message) {
      throw new NotFoundError('消息不存在');
    }

    if (message.receiverId !== currentUserId) {
      throw new ForbiddenError('无权限操作该消息');
    }

    if (message.readStatus === 'read') {
      return message;
    }

    const oldReadStatus = message.readStatus;

    await messageDeliveryDAO.update(id, {
      readStatus: 'read',
      readAt: new Date(),
    });

    const updatedMessage = await messageDeliveryDAO.findById(id);

    await messageDeliveryLogDAO.create({
      messageId: message.id,
      messageCode: message.messageCode,
      action: MessageDeliveryLogAction.READ,
      actionDetail: '用户阅读消息',
      oldReadStatus,
      newReadStatus: 'read',
      operatorId: currentUserId,
      operatorName: message.receiverName,
      ipAddress: ip,
      userAgent,
    });

    return updatedMessage;
  }

  async markAsUnread(id: number, currentUserId: number, ip?: string, userAgent?: string) {
    const message = await messageDeliveryDAO.findById(id);
    if (!message) {
      throw new NotFoundError('消息不存在');
    }

    if (message.receiverId !== currentUserId) {
      throw new ForbiddenError('无权限操作该消息');
    }

    const oldReadStatus = message.readStatus;

    await messageDeliveryDAO.update(id, {
      readStatus: 'unread',
      readAt: null,
    });

    const updatedMessage = await messageDeliveryDAO.findById(id);

    await messageDeliveryLogDAO.create({
      messageId: message.id,
      messageCode: message.messageCode,
      action: MessageDeliveryLogAction.MARK_UNREAD,
      actionDetail: '标记为未读',
      oldReadStatus,
      newReadStatus: 'unread',
      operatorId: currentUserId,
      operatorName: message.receiverName,
      ipAddress: ip,
      userAgent,
    });

    return updatedMessage;
  }

  async markAllAsRead(currentUserId: number, ip?: string, userAgent?: string) {
    const result = await messageDeliveryDAO.markAllRead(currentUserId);

    return {
      updatedCount: result[0],
    };
  }

  async retryMessage(id: number, currentUserId: number, ip?: string, userAgent?: string) {
    const message = await messageDeliveryDAO.findById(id);
    if (!message) {
      throw new NotFoundError('消息不存在');
    }

    if (message.deliveryStatus !== MessageDeliveryStatus.SENT_FAILED) {
      throw new BadRequestError('只有推送失败的消息才能重试');
    }

    await messageDeliveryDAO.update(id, {
      deliveryStatus: MessageDeliveryStatus.PENDING,
      failedReason: null,
    });

    await messageDeliveryLogDAO.create({
      messageId: message.id,
      messageCode: message.messageCode,
      action: MessageDeliveryLogAction.RETRY,
      actionDetail: '手动重试推送',
      oldDeliveryStatus: message.deliveryStatus,
      newDeliveryStatus: MessageDeliveryStatus.PENDING,
      operatorId: currentUserId,
      ipAddress: ip,
      userAgent,
    });

    this.asyncPushMessage(id).catch(err => {
      console.error('重试推送消息失败:', err);
    });

    return await messageDeliveryDAO.findById(id);
  }

  async batchRetry(ids: number[], currentUserId: number, userRole: string): Promise<BatchOperationResult> {
    if (ids.length > MESSAGE_BATCH_OPERATION_LIMIT) {
      throw new BadRequestError(`批量操作数量不能超过${MESSAGE_BATCH_OPERATION_LIMIT}条`);
    }

    const messages = await messageDeliveryDAO.getByIds(ids);

    if (userRole !== UserRole.ADMIN) {
      const hasInvalid = messages.some(m => m.receiverId !== currentUserId);
      if (hasInvalid) {
        throw new ForbiddenError('无权限操作他人消息');
      }
    }

    const failedIds: number[] = [];
    const errors: string[] = [];
    let successCount = 0;

    for (const message of messages) {
      try {
        if (message.deliveryStatus === MessageDeliveryStatus.SENT_FAILED) {
          await messageDeliveryDAO.update(message.id, {
            deliveryStatus: MessageDeliveryStatus.PENDING,
            failedReason: null,
          });

          this.asyncPushMessage(message.id).catch(err => {
            console.error('批量重试推送失败:', err);
          });

          successCount++;
        } else {
          failedIds.push(message.id);
          errors.push(`消息${message.id}状态不支持重试`);
        }
      } catch (error: any) {
        failedIds.push(message.id);
        errors.push(`消息${message.id}重试失败: ${error.message}`);
      }
    }

    return {
      successCount,
      failCount: failedIds.length,
      totalCount: ids.length,
      failedIds,
      errors,
    };
  }

  async batchMarkRead(ids: number[], currentUserId: number, userRole: string): Promise<BatchOperationResult> {
    if (ids.length > MESSAGE_BATCH_OPERATION_LIMIT) {
      throw new BadRequestError(`批量操作数量不能超过${MESSAGE_BATCH_OPERATION_LIMIT}条`);
    }

    const messages = await messageDeliveryDAO.getByIds(ids);

    if (userRole !== UserRole.ADMIN) {
      const hasInvalid = messages.some(m => m.receiverId !== currentUserId);
      if (hasInvalid) {
        throw new ForbiddenError('无权限操作他人消息');
      }
    }

    const failedIds: number[] = [];
    const errors: string[] = [];
    let successCount = 0;

    for (const message of messages) {
      try {
        if (message.readStatus === 'unread') {
          await messageDeliveryDAO.update(message.id, {
            readStatus: 'read',
            readAt: new Date(),
          });
          successCount++;
        } else {
          failedIds.push(message.id);
          errors.push(`消息${message.id}已为已读状态`);
        }
      } catch (error: any) {
        failedIds.push(message.id);
        errors.push(`消息${message.id}标记失败: ${error.message}`);
      }
    }

    return {
      successCount,
      failCount: failedIds.length,
      totalCount: ids.length,
      failedIds,
      errors,
    };
  }

  async batchDelete(ids: number[], currentUserId: number, userRole: string): Promise<BatchOperationResult> {
    if (ids.length > MESSAGE_BATCH_OPERATION_LIMIT) {
      throw new BadRequestError(`批量操作数量不能超过${MESSAGE_BATCH_OPERATION_LIMIT}条`);
    }

    const messages = await messageDeliveryDAO.getByIds(ids);

    if (userRole !== UserRole.ADMIN) {
      const hasInvalid = messages.some(m => m.receiverId !== currentUserId);
      if (hasInvalid) {
        throw new ForbiddenError('无权限操作他人消息');
      }
    }

    const result = await messageDeliveryDAO.batchDelete(ids);

    return {
      successCount: result,
      failCount: ids.length - result,
      totalCount: ids.length,
    };
  }

  async batchMarkOverdueUnread(currentUserId: number, userRole: string): Promise<BatchOperationResult> {
    const params: any = {
      readStatus: 'unread',
      page: 1,
      pageSize: 1000,
    };

    if (userRole !== UserRole.ADMIN) {
      params.receiverId = currentUserId;
    }

    const result = await messageDeliveryDAO.getList(params);
    const overdueDate = dayjs().subtract(MESSAGE_UNREAD_OVERDUE_DAYS, 'day').toDate();

    const overdueMessages = result.rows.filter((m: any) =>
      new Date(m.created_at) < overdueDate
    );

    const ids = overdueMessages.map((m: any) => m.id);

    if (ids.length === 0) {
      return {
        successCount: 0,
        failCount: 0,
        totalCount: 0,
      };
    }

    return this.batchMarkRead(ids, currentUserId, userRole);
  }

  async getUnreadCount(currentUserId: number) {
    return messageDeliveryDAO.countUnread(currentUserId);
  }

  async getStats(currentUserId: number, userRole: string, days = 30) {
    const receiverId = userRole === UserRole.ADMIN ? undefined : currentUserId;
    return messageDeliveryDAO.getStats(receiverId, days);
  }

  async getMessageLogs(messageId: number, currentUserId: number, userRole: string, page = 1, pageSize = 20) {
    const message = await messageDeliveryDAO.findById(messageId);
    if (!message) {
      throw new NotFoundError('消息不存在');
    }

    if (userRole !== UserRole.ADMIN && message.receiverId !== currentUserId) {
      throw new ForbiddenError('无权限查看该消息日志');
    }

    return messageDeliveryLogDAO.getByMessageId(messageId, page, pageSize);
  }

  async deleteMessage(id: number, currentUserId: number, userRole: string) {
    const message = await messageDeliveryDAO.findById(id);
    if (!message) {
      throw new NotFoundError('消息不存在');
    }

    if (userRole !== UserRole.ADMIN && message.receiverId !== currentUserId) {
      throw new ForbiddenError('无权限删除该消息');
    }

    await messageDeliveryDAO.batchDelete([id]);

    return { success: true };
  }

  async triggerBatchMessages(
    businessType: MessageBusinessType,
    receiverIds: number[],
    params: Omit<TriggerMessageParams, 'businessType' | 'receiverId'>
  ) {
    const results = [];
    const errors = [];

    for (const receiverId of receiverIds) {
      try {
        const message = await this.triggerMessage({
          ...params,
          businessType,
          receiverId,
        });
        results.push(message);
      } catch (error: any) {
        errors.push({ receiverId, error: error.message });
      }
    }

    return {
      successCount: results.length,
      failCount: errors.length,
      totalCount: receiverIds.length,
      results,
      errors,
    };
  }

  async adminClearHistory(currentUserId: number, userRole: string, days?: number) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('仅管理员可清空历史消息');
    }

    let count = 0;

    return {
      clearedCount: count,
    };
  }
}

export default new MessageDeliveryService();
