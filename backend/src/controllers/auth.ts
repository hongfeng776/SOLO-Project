import type { Request, Response, NextFunction } from 'express'
import { authService } from '@services/auth'
import { success, unauthorized } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body
    const data = await authService.login(username, password)
    success(res, data, '登录成功')
  } catch (error) {
    next(error)
  }
}

export const getUserInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      unauthorized(res, '请先登录')
      return
    }
    const data = await authService.getUserInfo(req.user.userId)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      unauthorized(res, '请先登录')
      return
    }
    await authService.logout(req.user.userId)
    success(res, null, '退出成功')
  } catch (error) {
    next(error)
  }
}

export const refreshToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      unauthorized(res, '请先登录')
      return
    }
    const data = await authService.refreshToken(req.user)
    success(res, data, 'Token刷新成功')
  } catch (error) {
    next(error)
  }
}
