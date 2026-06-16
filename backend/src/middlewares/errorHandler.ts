import { Request, Response, NextFunction } from 'express';
import { ApiResult, isAppError, AppError } from '../utils';
import { config } from '../config';

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[Error] ${req.method} ${req.url}`);
  console.error(error.stack || error.message);

  if (isAppError(error)) {
    const appError = error as AppError;
    if (appError.isOperational) {
      res.status(200).json(
        ApiResult.error(appError.code, appError.message, appError.data)
      );
      return;
    }
  }

  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map((e: any) => ({
      field: e.path,
      message: e.message
    }));
    const message = errors.map((e: any) => e.message).join('; ');
    res.status(200).json(ApiResult.validationError(message || '数据验证失败', errors));
    return;
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    res.status(200).json(ApiResult.conflict('数据已存在，请检查重复字段'));
    return;
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    res.status(200).json(ApiResult.conflict('关联数据不存在或数据被引用'));
    return;
  }

  if (error.name === 'UnauthorizedError') {
    res.status(200).json(ApiResult.unauthorized(error.message || '认证失败'));
    return;
  }

  if (error.code === 'ER_DUP_ENTRY') {
    res.status(200).json(ApiResult.conflict('数据已存在'));
    return;
  }

  const message = config.nodeEnv === 'production'
    ? '服务器内部错误，请稍后重试'
    : (error.message || '服务器内部错误');

  const data = config.nodeEnv === 'development'
    ? { stack: error.stack }
    : null;

  res.status(200).json(ApiResult.internalError(message, data));
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(200).json(ApiResult.notFound(`接口不存在: ${req.method} ${req.url}`));
}

process.on('unhandledRejection', (reason: any) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (error: any) => {
  console.error('[Uncaught Exception]', error);
  process.exit(1);
});