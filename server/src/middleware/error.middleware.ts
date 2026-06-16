import { Request, Response, NextFunction } from 'express';
import ResponseUtils from '../utils/response';
import Logger from '../utils/logger';
import { BusinessCode, HttpStatus } from '../constants/statusCode';

class AppError extends Error {
  public code: number;
  public httpStatus: number;

  constructor(message: string, code: number = BusinessCode.ERROR, httpStatus: number = HttpStatus.BAD_REQUEST) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.name = 'AppError';
  }
}

const errorMiddleware = (err: Error | AppError, req: Request, res: Response, _next: NextFunction): void => {
  Logger.error(`Error: ${err.message}`, err.stack);

  if (err instanceof AppError) {
    ResponseUtils.error(res, err.message, err.code, err.httpStatus);
    return;
  }

  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    ResponseUtils.error(res, err.message, BusinessCode.PARAM_ERROR, HttpStatus.BAD_REQUEST);
    return;
  }

  if (err.name === 'SequelizeDatabaseError') {
    ResponseUtils.error(res, '数据库操作异常', BusinessCode.DATABASE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    return;
  }

  if (err.name === 'SyntaxError' && (err as any).status === 400 && 'body' in (err as any)) {
    ResponseUtils.error(res, '请求数据格式错误', BusinessCode.PARAM_ERROR, HttpStatus.BAD_REQUEST);
    return;
  }

  if (err.name === 'PayloadTooLargeError' || (err as any).type === 'entity.too.large') {
    ResponseUtils.error(res, '请求数据过大', BusinessCode.PARAM_ERROR, HttpStatus.BAD_REQUEST);
    return;
  }

  if ((err as any).code === 'ETIMEDOUT' || (err as any).code === 'ESOCKETTIMEDOUT') {
    ResponseUtils.error(res, '请求超时', BusinessCode.SERVER_ERROR, HttpStatus.GATEWAY_TIMEOUT);
    return;
  }

  ResponseUtils.serverError(res, 'Internal Server Error', BusinessCode.SERVER_ERROR);
};

const notFoundMiddleware = (req: Request, res: Response): void => {
  ResponseUtils.notFound(res, `Route ${req.method} ${req.path} not found`);
};

export { errorMiddleware, notFoundMiddleware, AppError };
export default errorMiddleware;
