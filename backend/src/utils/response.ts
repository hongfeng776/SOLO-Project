import type { Response, Request, NextFunction } from 'express'
import type { ApiResponse, PageResult } from '@/types/index'

export const success = <T = unknown>(res: Response, data: T, message = '操作成功'): Response => {
  const response: ApiResponse<T> = {
    code: 200,
    message,
    data
  }
  return res.json(response)
}

export const paginate = <T = unknown>(
  res: Response,
  list: T[],
  total: number,
  page: number,
  pageSize: number
): Response => {
  const data: PageResult<T> = {
    list,
    total,
    page,
    pageSize
  }
  return success(res, data)
}

export const fail = (
  res: Response,
  message = '操作失败',
  code = 400
): Response => {
  const response: ApiResponse<null> = {
    code,
    message,
    data: null as unknown as null
  }
  return res.status(code >= 500 ? code : 200).json(response)
}

export const unauthorized = (res: Response, message = '未授权，请重新登录'): Response => {
  const response: ApiResponse<null> = {
    code: 401,
    message,
    data: null as unknown as null
  }
  return res.status(401).json(response)
}

export const forbidden = (res: Response, message = '无权限访问'): Response => {
  const response: ApiResponse<null> = {
    code: 403,
    message,
    data: null as unknown as null
  }
  return res.status(403).json(response)
}

export const notFound = (res: Response, message = '资源不存在'): Response => {
  const response: ApiResponse<null> = {
    code: 404,
    message,
    data: null as unknown as null
  }
  return res.status(404).json(response)
}

export class AppError extends Error {
  public readonly code: number
  public readonly isOperational: boolean

  constructor(message: string, code = 400, isOperational = true) {
    super(message)
    this.code = code
    this.isOperational = isOperational
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error]', err.message)

  if (err instanceof AppError) {
    const response: ApiResponse<null> = {
      code: err.code,
      message: err.message,
      data: null as unknown as null
    }
    res.status(err.code >= 500 ? err.code : 200).json(response)
    return
  }

  const response: ApiResponse<null> = {
    code: 500,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
    data: null as unknown as null
  }
  res.status(500).json(response)
}
