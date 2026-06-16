import type { Response, NextFunction } from 'express'
import { verifyToken } from '@utils/auth'
import { unauthorized, fail } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    unauthorized(res, '请先登录')
    return
  }

  const token = authHeader.substring(7)

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    unauthorized(res, '登录已过期，请重新登录')
  }
}

export const roleMiddleware = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res, '请先登录')
      return
    }

    if (roles.length > 0 && !roles.some((role) => req.user!.roles.includes(role))) {
      fail(res, '无权限访问该资源', 403)
      return
    }

    next()
  }
}

export const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const decoded = verifyToken(token)
      req.user = decoded
    } catch {
      // ignored
    }
  }

  next()
}
