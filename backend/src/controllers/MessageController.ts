import { Request, Response } from 'express';
import { messageService, MessageQueryParams } from '../services/MessageService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getMessageList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, user_type, user_id, type, is_read } = req.query;

  if (user_type === undefined) {
    badRequest(res, '缺少用户类型');
    return;
  }

  if (user_id === undefined) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const params: MessageQueryParams = {
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    user_type: parseInt(user_type as string, 10),
    user_id: parseInt(user_id as string, 10),
    type: type !== undefined ? parseInt(type as string, 10) : undefined,
    is_read: is_read !== undefined ? parseInt(is_read as string, 10) : undefined,
  };

  const result = await messageService.getUserMessages(params);
  ok(res, result, '获取消息列表成功');
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_type, user_id } = req.body;

  if (!id) {
    badRequest(res, '缺少消息ID');
    return;
  }

  if (user_type === undefined) {
    badRequest(res, '缺少用户类型');
    return;
  }

  if (user_id === undefined) {
    badRequest(res, '缺少用户ID');
    return;
  }

  await messageService.markAsRead(
    parseInt(id, 10),
    parseInt(user_type, 10),
    parseInt(user_id, 10)
  );
  ok(res, null, '标记已读成功');
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { user_type, user_id } = req.body;

  if (user_type === undefined) {
    badRequest(res, '缺少用户类型');
    return;
  }

  if (user_id === undefined) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const count = await messageService.markAllAsRead(
    parseInt(user_type, 10),
    parseInt(user_id, 10)
  );
  ok(res, { count }, `全部已读成功，共标记 ${count} 条消息`);
});

export const getMessageStats = asyncHandler(async (req: Request, res: Response) => {
  const { user_type, user_id } = req.query;

  if (user_type === undefined) {
    badRequest(res, '缺少用户类型');
    return;
  }

  if (user_id === undefined) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const result = await messageService.getMessageStats(
    parseInt(user_type as string, 10),
    parseInt(user_id as string, 10)
  );
  ok(res, result, '获取消息统计成功');
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_type, user_id } = req.body;

  if (!id) {
    badRequest(res, '缺少消息ID');
    return;
  }

  if (user_type === undefined) {
    badRequest(res, '缺少用户类型');
    return;
  }

  if (user_id === undefined) {
    badRequest(res, '缺少用户ID');
    return;
  }

  await messageService.deleteMessage(
    parseInt(id, 10),
    parseInt(user_type, 10),
    parseInt(user_id, 10)
  );
  ok(res, null, '删除消息成功');
});

export default {
  getMessageList,
  markAsRead,
  markAllAsRead,
  getMessageStats,
  deleteMessage,
};
