import { NextFunction, Request, Response } from 'express';
import { CelebrateError } from 'celebrate';
import { AppError } from './errorHandler';

export { celebrate, Segments } from 'celebrate';

import * as Joi from 'joi';
export { Joi };

export function validationErrorHandler(
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (err instanceof CelebrateError) {
    const details: string[] = [];

    err.details.forEach((joiError) => {
      joiError.details.forEach((detail) => {
        details.push(detail.message);
      });
    });

    const message = details.join('; ');
    return next(new AppError(400, message));
  }

  next(err);
}
