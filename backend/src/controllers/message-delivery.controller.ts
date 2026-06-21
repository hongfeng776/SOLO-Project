import { Request, Response } from 'express';
import messageDeliveryService from '../services/message-delivery.service';
import { success, fail } from '../utils/response';
import { MessageBusinessType, MessagePushChannel } from '../constants/recruitment.enum';

class MessageDeliveryController {
  async getMessageList(req: Request, res: Response) {
    try {
      const {
        page = 1,
        pageSize = 20,
        businessType,
        scene,
        deliveryStatus,
        readStatus,
        pushChannel,
        keyword,
        startTime,
        endTime,
        isAbnormal,
        sortBy,
        sortOrder,
      } = req.query;

      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.getMessageList(
        {
          page: Number(page),
          pageSize: Number(pageSize),
          businessType,
          scene,
          deliveryStatus,
          readStatus,
          pushChannel,
          keyword,
          startTime,
          endTime,
          isAbnormal: isAbnormal !== undefined ? isAbnormal === 'true' : undefined,
          sortBy,
          sortOrder,
        },
        currentUserId,
        userRole
      );

      success(res, {
        list: result.rows,
        total: result.count,
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async getMessageDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const message = await messageDeliveryService.getMessageDetail(
        Number(id),
        currentUserId,
        userRole
      );

      success(res, message);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async triggerMessage(req: Request, res: Response) {
    try {
      const {
        businessType,
        businessId,
        businessCode,
        receiverId,
        templateCode,
        title,
        content,
        templateVariables,
        pushChannel,
        jumpType,
        jumpUrl,
        jumpParams,
        companyId,
        priority,
      } = req.body;

      const currentUserId = (req as any).user?.id;
      const currentUserName = (req as any).user?.realName || (req as any).user?.username;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const message = await messageDeliveryService.triggerMessage({
        businessType,
        businessId,
        businessCode,
        receiverId,
        templateCode,
        title,
        content,
        templateVariables,
        pushChannel,
        jumpType,
        jumpUrl,
        jumpParams,
        companyId,
        priority,
        triggeredBy: currentUserId,
        triggeredByName: currentUserName,
        ip,
        userAgent,
      });

      success(res, message);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const message = await messageDeliveryService.markAsRead(
        Number(id),
        currentUserId,
        ip,
        userAgent
      );

      success(res, message);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async markAsUnread(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const message = await messageDeliveryService.markAsUnread(
        Number(id),
        currentUserId,
        ip,
        userAgent
      );

      success(res, message);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user?.id;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await messageDeliveryService.markAllAsRead(
        currentUserId,
        ip,
        userAgent
      );

      success(res, result);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async retryMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const message = await messageDeliveryService.retryMessage(
        Number(id),
        currentUserId,
        ip,
        userAgent
      );

      success(res, message);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async batchRetry(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.batchRetry(
        ids,
        currentUserId,
        userRole
      );

      success(res, result);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async batchMarkRead(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.batchMarkRead(
        ids,
        currentUserId,
        userRole
      );

      success(res, result);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async batchDelete(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.batchDelete(
        ids,
        currentUserId,
        userRole
      );

      success(res, result);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async batchMarkOverdueUnread(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.batchMarkOverdueUnread(
        currentUserId,
        userRole
      );

      success(res, result);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user?.id;
      const count = await messageDeliveryService.getUnreadCount(currentUserId);
      success(res, { count });
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const { days = 30 } = req.query;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const stats = await messageDeliveryService.getStats(
        currentUserId,
        userRole,
        Number(days)
      );

      success(res, stats);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async getMessageLogs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 20 } = req.query;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.getMessageLogs(
        Number(id),
        currentUserId,
        userRole,
        Number(page),
        Number(pageSize)
      );

      success(res, {
        list: result.rows,
        total: result.count,
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async deleteMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.deleteMessage(
        Number(id),
        currentUserId,
        userRole
      );

      success(res, result);
    } catch (error: any) {
      fail(res, error.message);
    }
  }

  async adminClearHistory(req: Request, res: Response) {
    try {
      const { days } = req.body;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.adminClearHistory(
        currentUserId,
        userRole,
        days
      );

      success(res, result);
    } catch (error: any) {
      fail(res, error.message);
    }
  }
}

export default new MessageDeliveryController();
