export class AppError extends Error {
  public readonly code: number;
  public readonly isOperational: boolean;
  public readonly data?: any;

  constructor(
    message: string,
    code: number = 500,
    isOperational: boolean = true,
    data?: any
  ) {
    super(message);
    this.code = code;
    this.isOperational = isOperational;
    this.data = data;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BusinessError extends AppError {
  constructor(message: string, code: number = 500, data?: any) {
    super(message, code, true, data);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = '数据验证失败', data?: any) {
    super(message, 422, true, data);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权') {
    super(message, 401, true);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token已过期') {
    super(message, 401001, true);
  }
}

export class TokenInvalidError extends AppError {
  constructor(message: string = 'Token无效') {
    super(message, 401002, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '没有权限访问') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(message, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '数据冲突') {
    super(message, 409, true);
  }
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function throwBusinessError(message: string, code: number = 500, data?: any): never {
  throw new BusinessError(message, code, data);
}

export function throwValidationError(message: string, data?: any): never {
  throw new ValidationError(message, data);
}

export function throwUnauthorizedError(message?: string): never {
  throw new UnauthorizedError(message);
}

export function throwForbiddenError(message?: string): never {
  throw new ForbiddenError(message);
}

export function throwNotFoundError(message?: string): never {
  throw new NotFoundError(message);
}

export function throwConflictError(message?: string): never {
  throw new ConflictError(message);
}