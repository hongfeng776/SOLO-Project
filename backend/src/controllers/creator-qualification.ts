import type { Request, Response, NextFunction } from 'express'
import { creatorQualificationService } from '@services/creator-qualification'
import { success } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, status, qualificationType, isFake, isExpiringSoon } = req.query
    const data = await creatorQualificationService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      keyword: keyword as string,
      status: status !== undefined ? Number(status) : undefined,
      qualificationType: qualificationType as string,
      isFake: isFake !== undefined ? Number(isFake) : undefined,
      isExpiringSoon: isExpiringSoon !== undefined ? Number(isExpiringSoon) : undefined
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await creatorQualificationService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const preCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { creatorId } = req.body
    const data = await creatorQualificationService.preCheck(Number(creatorId))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { creatorId, ...rest } = req.body
    const data = await creatorQualificationService.create(Number(creatorId), rest)
    success(res, data, '申请提交成功')
  } catch (error) {
    next(error)
  }
}

export const audit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, rejectReason } = req.body
    const user = (req as any).user
    const data = await creatorQualificationService.audit(
      Number(req.params.id),
      Number(status),
      rejectReason,
      user?.id,
      user?.nickname
    )
    success(res, data, '审核完成')
  } catch (error) {
    next(error)
  }
}

export const batchAudit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, status, rejectReason } = req.body
    const user = (req as any).user
    const data = await creatorQualificationService.batchAudit(
      ids,
      Number(status),
      rejectReason,
      user?.id,
      user?.nickname
    )
    success(res, data, '批量审核完成')
  } catch (error) {
    next(error)
  }
}

export const getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await creatorQualificationService.getLogs(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getTraceLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await creatorQualificationService.getTraceLogs(Number(req.params.creatorId))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const checkFake = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { idCard, businessLicenseNo } = req.body
    const data = await creatorQualificationService.checkFakeQualification(idCard, businessLicenseNo)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getExpiringSoon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = 30 } = req.query
    const data = await creatorQualificationService.getExpiringSoon(Number(days))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const stats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await creatorQualificationService.getStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getBenefitConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await creatorQualificationService.getBenefitConfig(Number(req.params.creatorId))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getApplyByCreator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await creatorQualificationService.getApplyByCreator(Number(req.params.creatorId))
    success(res, data)
  } catch (error) {
    next(error)
  }
}
