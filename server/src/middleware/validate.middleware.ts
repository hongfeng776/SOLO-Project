import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import ResponseUtils from '../utils/response';
import { BusinessCode } from '../constants/statusCode';

const validateMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg).join(', ');
    ResponseUtils.error(res, errorMessages, BusinessCode.PARAM_ERROR);
    return;
  }
  next();
};

export default validateMiddleware;
