export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export class Result {
  static success<T>(data: T, message = '操作成功'): ApiResponse<T> {
    return {
      code: 200,
      message,
      data,
      timestamp: Date.now(),
    };
  }

  static error(code: number, message: string, data: any = null): ApiResponse {
    return {
      code,
      message,
      data,
      timestamp: Date.now(),
    };
  }
}

export enum HttpStatus {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_ERROR = 500,
}

export enum ErrorCode {
  SUCCESS = 200,
  PARAM_ERROR = 40001,
  UNAUTHORIZED = 40101,
  TOKEN_EXPIRED = 40102,
  FORBIDDEN = 40301,
  NOT_FOUND = 40401,
  CONFLICT = 40901,
  SYSTEM_ERROR = 50001,
  DATABASE_ERROR = 50002,
}
