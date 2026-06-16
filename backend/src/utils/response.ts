import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
  timestamp: number;
}

export enum ResponseCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
}

export function success<T>(
  res: Response,
  data?: T,
  message: string = 'success',
  code: number = ResponseCode.SUCCESS
): Response<ApiResponse<T>> {
  return res.status(code).json({
    code,
    message,
    data: data ?? null,
    timestamp: Date.now(),
  });
}

export function fail<T>(
  res: Response,
  message: string = 'error',
  code: number = ResponseCode.INTERNAL_ERROR,
  data?: T
): Response<ApiResponse<T>> {
  return res.status(code).json({
    code,
    message,
    data: data ?? null,
    timestamp: Date.now(),
  });
}

export function ok<T>(
  res: Response,
  data?: T,
  message: string = 'success'
): Response<ApiResponse<T>> {
  return success(res, data, message, ResponseCode.SUCCESS);
}

export function created<T>(
  res: Response,
  data?: T,
  message: string = 'created'
): Response<ApiResponse<T>> {
  return success(res, data, message, 201);
}

export function badRequest<T>(
  res: Response,
  message: string = 'bad request',
  data?: T
): Response<ApiResponse<T>> {
  return fail(res, message, ResponseCode.BAD_REQUEST, data);
}

export function unauthorized<T>(
  res: Response,
  message: string = 'unauthorized',
  data?: T
): Response<ApiResponse<T>> {
  return fail(res, message, ResponseCode.UNAUTHORIZED, data);
}

export function forbidden<T>(
  res: Response,
  message: string = 'forbidden',
  data?: T
): Response<ApiResponse<T>> {
  return fail(res, message, ResponseCode.FORBIDDEN, data);
}

export function notFound<T>(
  res: Response,
  message: string = 'not found',
  data?: T
): Response<ApiResponse<T>> {
  return fail(res, message, ResponseCode.NOT_FOUND, data);
}

export function internalError<T>(
  res: Response,
  message: string = 'internal server error',
  data?: T
): Response<ApiResponse<T>> {
  return fail(res, message, ResponseCode.INTERNAL_ERROR, data);
}
