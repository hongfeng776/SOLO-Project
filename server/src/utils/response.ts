import { Response } from 'express';
import { BusinessCode, HttpStatus } from '../constants/statusCode';
import { ApiResponse, PaginationResult } from '../types';

class ResponseUtils {
  public static success<T = any>(res: Response, data: T | null = null, message: string = 'success'): void {
    const result: ApiResponse<T> = {
      code: BusinessCode.SUCCESS,
      message,
      data,
      timestamp: Date.now(),
    };
    res.status(HttpStatus.OK).json(result);
  }

  public static created<T = any>(res: Response, data: T | null = null, message: string = 'created'): void {
    const result: ApiResponse<T> = {
      code: BusinessCode.SUCCESS,
      message,
      data,
      timestamp: Date.now(),
    };
    res.status(HttpStatus.CREATED).json(result);
  }

  public static error(res: Response, message: string, code: number = BusinessCode.ERROR, httpStatus: number = HttpStatus.BAD_REQUEST): void {
    const result: ApiResponse = {
      code,
      message,
      data: null,
      timestamp: Date.now(),
    };
    res.status(httpStatus).json(result);
  }

  public static unauthorized(res: Response, message: string = 'Unauthorized', code: number = BusinessCode.UNAUTHORIZED): void {
    this.error(res, message, code, HttpStatus.UNAUTHORIZED);
  }

  public static forbidden(res: Response, message: string = 'Forbidden', code: number = BusinessCode.FORBIDDEN): void {
    this.error(res, message, code, HttpStatus.FORBIDDEN);
  }

  public static notFound(res: Response, message: string = 'Not Found', code: number = BusinessCode.NOT_FOUND): void {
    this.error(res, message, code, HttpStatus.NOT_FOUND);
  }

  public static serverError(res: Response, message: string = 'Internal Server Error', code: number = BusinessCode.SERVER_ERROR): void {
    this.error(res, message, code, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  public static paginated<T = any>(
    res: Response,
    list: T[],
    total: number,
    page: number,
    pageSize: number,
    message: string = 'success'
  ): void {
    const totalPages = Math.ceil(total / pageSize);
    const paginationResult: PaginationResult<T> = {
      list,
      total,
      page,
      pageSize,
      totalPages,
    };
    this.success(res, paginationResult, message);
  }
}

export default ResponseUtils;
