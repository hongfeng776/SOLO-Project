import { Response } from 'express';
import { ApiResponse, PaginatedResult } from '../types';

export enum ResponseCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  BUSINESS_ERROR = 500,
  VALIDATION_ERROR = 422,
  TOKEN_EXPIRED = 401001,
  TOKEN_INVALID = 401002,
  INTERNAL_ERROR = 500
}

export class ApiResult {
  static success<T = any>(data?: T, message: string = '操作成功'): ApiResponse<T> {
    return {
      code: ResponseCode.SUCCESS,
      message,
      data: (data as T) ?? (null as T)
    };
  }

  static successPage<T = any>(
    result: PaginatedResult<T>,
    message: string = '查询成功'
  ): ApiResponse<PaginatedResult<T>> {
    return {
      code: ResponseCode.SUCCESS,
      message,
      data: result
    };
  }

  static error(code: number, message: string, data: any = null): ApiResponse {
    return {
      code,
      message,
      data
    };
  }

  static badRequest(message: string = '请求参数错误', data: any = null): ApiResponse {
    return this.error(ResponseCode.BAD_REQUEST, message, data);
  }

  static unauthorized(message: string = '未授权', data: any = null): ApiResponse {
    return this.error(ResponseCode.UNAUTHORIZED, message, data);
  }

  static tokenExpired(message: string = 'Token已过期', data: any = null): ApiResponse {
    return this.error(ResponseCode.TOKEN_EXPIRED, message, data);
  }

  static tokenInvalid(message: string = 'Token无效', data: any = null): ApiResponse {
    return this.error(ResponseCode.TOKEN_INVALID, message, data);
  }

  static forbidden(message: string = '没有权限访问', data: any = null): ApiResponse {
    return this.error(ResponseCode.FORBIDDEN, message, data);
  }

  static notFound(message: string = '资源不存在', data: any = null): ApiResponse {
    return this.error(ResponseCode.NOT_FOUND, message, data);
  }

  static conflict(message: string = '数据冲突', data: any = null): ApiResponse {
    return this.error(ResponseCode.CONFLICT, message, data);
  }

  static validationError(message: string = '数据验证失败', data: any = null): ApiResponse {
    return this.error(ResponseCode.VALIDATION_ERROR, message, data);
  }

  static businessError(message: string = '业务处理失败', data: any = null): ApiResponse {
    return this.error(ResponseCode.BUSINESS_ERROR, message, data);
  }

  static internalError(message: string = '服务器内部错误', data: any = null): ApiResponse {
    return this.error(ResponseCode.INTERNAL_ERROR, message, data);
  }
}

export function sendSuccess<T = any>(res: Response, data?: T, message: string = '操作成功'): Response {
  return res.status(200).json(ApiResult.success<T>(data, message));
}

export function sendSuccessPage<T = any>(
  res: Response,
  result: PaginatedResult<T>,
  message: string = '查询成功'
): Response {
  return res.status(200).json(ApiResult.successPage<T>(result, message));
}

export function sendError(res: Response, code: number, message: string, data: any = null): Response {
  return res.status(200).json(ApiResult.error(code, message, data));
}