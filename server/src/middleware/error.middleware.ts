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

const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  Logger.error(`Error: ${err.message}`, err.stack);

  if (err instanceof AppError) {
    ResponseUtils.error(res, err.message, err.code, err.httpStatus);
    return;
  }

  if (err.name === 'ValidationError') {
    ResponseUtils.error(res, err.message, BusinessCode.PARAM_ERROR, HttpStatus.BAD_REQUEST);
    return;
  }

  ResponseUtils.serverError(res, 'Internal Server Error', BusinessCode.SERVER_ERROR);
};

const notFoundMiddleware = (req: Request, res: Response): void => {
  ResponseUtils.notFound(res, `Route ${req.method} ${req.path} not found`);
};

export { errorMiddleware, notFoundMiddleware, AppError };
export default errorMiddleware;
