export const ErrorCode = {
  SUCCESS: 200,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,

  PARAM_INVALID: 10001,
  PARAM_MISSING: 10002,
  PARAM_TYPE_ERROR: 10003,

  USER_NOT_EXIST: 20001,
  USER_ALREADY_EXIST: 20002,
  USER_PASSWORD_ERROR: 20003,
  USER_DISABLED: 20004,
  USER_NOT_LOGIN: 20005,
  USER_TOKEN_EXPIRED: 20006,
  USER_TOKEN_INVALID: 20007,
  USER_NO_PERMISSION: 20008,

  DATA_NOT_EXIST: 30001,
  DATA_ALREADY_EXIST: 30002,
  DATA_CREATE_FAILED: 30003,
  DATA_UPDATE_FAILED: 30004,
  DATA_DELETE_FAILED: 30005,

  FILE_UPLOAD_ERROR: 40001,
  FILE_TYPE_ERROR: 40002,
  FILE_SIZE_EXCEED: 40003,
  FILE_NOT_EXIST: 40004
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorCodeMessage: Record<ErrorCodeType, string> = {
  [ErrorCode.SUCCESS]: '操作成功',
  [ErrorCode.BAD_REQUEST]: '请求错误',
  [ErrorCode.UNAUTHORIZED]: '未授权访问',
  [ErrorCode.FORBIDDEN]: '无权限访问',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.METHOD_NOT_ALLOWED]: '请求方法不允许',
  [ErrorCode.CONFLICT]: '资源冲突',
  [ErrorCode.TOO_MANY_REQUESTS]: '请求过于频繁',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务不可用',
  [ErrorCode.PARAM_INVALID]: '参数不合法',
  [ErrorCode.PARAM_MISSING]: '缺少必要参数',
  [ErrorCode.PARAM_TYPE_ERROR]: '参数类型错误',
  [ErrorCode.USER_NOT_EXIST]: '用户不存在',
  [ErrorCode.USER_ALREADY_EXIST]: '用户已存在',
  [ErrorCode.USER_PASSWORD_ERROR]: '用户名或密码错误',
  [ErrorCode.USER_DISABLED]: '账号已被禁用',
  [ErrorCode.USER_NOT_LOGIN]: '请先登录',
  [ErrorCode.USER_TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorCode.USER_TOKEN_INVALID]: '登录无效，请重新登录',
  [ErrorCode.USER_NO_PERMISSION]: '无操作权限',
  [ErrorCode.DATA_NOT_EXIST]: '数据不存在',
  [ErrorCode.DATA_ALREADY_EXIST]: '数据已存在',
  [ErrorCode.DATA_CREATE_FAILED]: '数据创建失败',
  [ErrorCode.DATA_UPDATE_FAILED]: '数据更新失败',
  [ErrorCode.DATA_DELETE_FAILED]: '数据删除失败',
  [ErrorCode.FILE_UPLOAD_ERROR]: '文件上传失败',
  [ErrorCode.FILE_TYPE_ERROR]: '文件类型不支持',
  [ErrorCode.FILE_SIZE_EXCEED]: '文件大小超出限制',
  [ErrorCode.FILE_NOT_EXIST]: '文件不存在'
};

export function getErrorMessage(code: number): string {
  return ErrorCodeMessage[code as ErrorCodeType] || '未知错误';
}

export function isAuthError(code: number): boolean {
  return (
    code === ErrorCode.UNAUTHORIZED ||
    code === ErrorCode.USER_NOT_LOGIN ||
    code === ErrorCode.USER_TOKEN_EXPIRED ||
    code === ErrorCode.USER_TOKEN_INVALID
  );
}
