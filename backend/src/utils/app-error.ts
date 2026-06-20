export class AppError extends Error {
  public code: number;
  public status: number;

  constructor(code: number, message: string, status: number = 200) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'AppError';
  }
}

export class ParamError extends AppError {
  constructor(message = '参数错误') {
    super(40001, message, 400);
  }
}

export class AuthError extends AppError {
  constructor(message = '未授权访问') {
    super(40101, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '无权限访问') {
    super(40301, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(40401, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(40901, message, 409);
  }
}

export class BadRequestError extends AppError {
  public errorCode?: string;
  public details?: any;

  constructor(message = '请求参数错误', errorCode?: string, details?: any) {
    super(40002, message, 400);
    this.errorCode = errorCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  public fields?: string[];
  public details?: any;

  constructor(message = '数据校验失败', fields?: string[], details?: any) {
    super(42201, message, 422);
    this.fields = fields;
    this.details = details;
  }
}
