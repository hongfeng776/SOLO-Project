import type { Request, Response, NextFunction } from 'express'
import { statsService } from '@services/stats'
import { success } from '@utils/response'

export const overview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await statsService.getOverview()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const contentStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await statsService.getContentStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const creatorStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await statsService.getCreatorStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const orderStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await statsService.getOrderStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const trendStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = 7 } = req.query
    const data = await statsService.getTrendStats(Number(days))
    success(res, data)
  } catch (error) {
    next(error)
  }
}
