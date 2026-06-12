import { Response } from 'express';

export enum ResponseCode {
  SUCCESS = 0,
  FAIL = 1,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
}

export interface ApiResponse<T = any> {
  code: number;
  data: T | null;
  msg: string;
}

export interface PaginatedData<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class ResponseUtil {
  private send<T>(res: Response, code: number, data: T | null, msg: string, httpStatus = 200): Response<ApiResponse<T>> {
    return res.status(httpStatus).json({ code, data, msg });
  }

  success<T>(res: Response, data: T | null = null, msg = 'success', httpStatus = 200): Response<ApiResponse<T>> {
    return this.send(res, ResponseCode.SUCCESS, data, msg, httpStatus);
  }

  fail(res: Response, msg = '操作失败', code = ResponseCode.FAIL, httpStatus = 200): Response<ApiResponse<null>> {
    return this.send(res, code, null, msg, httpStatus);
  }

  badRequest(res: Response, msg = '请求参数错误'): Response<ApiResponse<null>> {
    return this.send(res, ResponseCode.BAD_REQUEST, null, msg, 400);
  }

  unauthorized(res: Response, msg = '未授权，请先登录'): Response<ApiResponse<null>> {
    return this.send(res, ResponseCode.UNAUTHORIZED, null, msg, 401);
  }

  forbidden(res: Response, msg = '没有权限访问'): Response<ApiResponse<null>> {
    return this.send(res, ResponseCode.FORBIDDEN, null, msg, 403);
  }

  notFound(res: Response, msg = '资源不存在'): Response<ApiResponse<null>> {
    return this.send(res, ResponseCode.NOT_FOUND, null, msg, 404);
  }

  internalError(res: Response, msg = '服务器内部错误'): Response<ApiResponse<null>> {
    return this.send(res, ResponseCode.INTERNAL_ERROR, null, msg, 500);
  }

  paginate<T>(
    res: Response,
    list: T[],
    total: number,
    page: number,
    pageSize: number,
    msg = 'success',
  ): Response<ApiResponse<PaginatedData<T>>> {
    const totalPages = Math.ceil(total / pageSize) || 0;
    const data: PaginatedData<T> = {
      list,
      total,
      page,
      pageSize,
      totalPages,
    };
    return this.send(res, ResponseCode.SUCCESS, data, msg, 200);
  }
}

export const responseUtil = new ResponseUtil();
export default responseUtil;
