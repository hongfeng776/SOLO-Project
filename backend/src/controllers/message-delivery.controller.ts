import { Request, Response, NextFunction } from 'express';
import messageDeliveryService from '../services/message-delivery.service';
import { Result } from '../utils/result';
import { MessageBusinessType, MessagePushChannel } from '../constants/recruitment.enum';

class MessageDeliveryController {
  async getMessageList(req: Request, res: Response, next: NextFunction) {
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

      res.json(Result.success({
        list: result.rows,
        total: result.count,
        page: Number(page),
        pageSize: Number(pageSize),
      }));
    } catch (error) {
      next(error);
    }
  }

  async getMessageDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const message = await messageDeliveryService.getMessageDetail(
        Number(id),
        currentUserId,
        userRole
      );

      res.json(Result.success(message));
    } catch (error) {
      next(error);
    }
  }

  async triggerMessage(req: Request, res: Response, next: NextFunction) {
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

      res.json(Result.success(message));
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
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

      res.json(Result.success(message));
    } catch (error) {
      next(error);
    }
  }

  async markAsUnread(req: Request, res: Response, next: NextFunction) {
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

      res.json(Result.success(message));
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req as any).user?.id;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await messageDeliveryService.markAllAsRead(
        currentUserId,
        ip,
        userAgent
      );

      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async retryMessage(req: Request, res: Response, next: NextFunction) {
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

      res.json(Result.success(message));
    } catch (error) {
      next(error);
    }
  }

  async batchRetry(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.batchRetry(
        ids,
        currentUserId,
        userRole
      );

      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async batchMarkRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.batchMarkRead(
        ids,
        currentUserId,
        userRole
      );

      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async batchDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.batchDelete(
        ids,
        currentUserId,
        userRole
      );

      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async batchMarkOverdueUnread(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.batchMarkOverdueUnread(
        currentUserId,
        userRole
      );

      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req as any).user?.id;
      const count = await messageDeliveryService.getUnreadCount(currentUserId);
      res.json(Result.success({ count }));
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { days = 30 } = req.query;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const stats = await messageDeliveryService.getStats(
        currentUserId,
        userRole,
        Number(days)
      );

      res.json(Result.success(stats));
    } catch (error) {
      next(error);
    }
  }

  async getMessageLogs(req: Request, res: Response, next: NextFunction) {
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

      res.json(Result.success({
        list: result.rows,
        total: result.count,
        page: Number(page),
        pageSize: Number(pageSize),
      }));
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.deleteMessage(
        Number(id),
        currentUserId,
        userRole
      );

      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async adminClearHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { days } = req.body;
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const result = await messageDeliveryService.adminClearHistory(
        currentUserId,
        userRole,
        days
      );

      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageDeliveryController();
