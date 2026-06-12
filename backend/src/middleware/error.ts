import { Request, Response, NextFunction } from 'express';
import { responseUtil } from '@/utils/response';

export function notFoundHandler(req: Request, res: Response): void {
  responseUtil.notFound(res, `接口不存在: ${req.method} ${req.originalUrl}`);
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[ErrorHandler]:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e: any) => e.message).join('; ');
    responseUtil.badRequest(res, messages || '数据校验失败');
    return;
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    responseUtil.fail(res, '数据已存在，请勿重复提交');
    return;
  }

  if (err.name === 'SequelizeDatabaseError') {
    responseUtil.internalError(res, '数据库操作失败');
    return;
  }

  if (err.status === 400 || err.code === 400) {
    responseUtil.badRequest(res, err.message || '请求参数错误');
    return;
  }

  responseUtil.internalError(res, process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误');
}

export default { notFoundHandler, errorHandler };
