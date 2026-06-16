import { Request, Response, NextFunction } from 'express';
import { Result } from './result';
import { AppError } from './app-error';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.status).json(Result.error(err.code, err.message));
    return;
  }

  if (err.name === 'SequelizeValidationError') {
    res.status(400).json(Result.error(40001, '数据校验失败'));
    return;
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json(Result.error(40901, '数据唯一约束冲突'));
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json(Result.error(40101, 'Token无效'));
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json(Result.error(40102, 'Token已过期'));
    return;
  }

  res.status(500).json(Result.error(50001, '服务器内部错误'));
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json(Result.error(40401, '接口不存在'));
};
