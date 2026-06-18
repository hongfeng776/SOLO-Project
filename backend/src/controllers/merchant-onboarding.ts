import type { Request, Response, NextFunction } from 'express'
import { merchantOnboardingService } from '@services/merchant-onboarding'
import { success } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, status, merchantType, riskLevel, isDuplicate, isFakeQualification } = req.query
    const data = await merchantOnboardingService.list({
      page: Number(page), pageSize: Number(pageSize),
      keyword: keyword as string,
      status: status !== undefined ? Number(status) : undefined,
      merchantType: merchantType as string,
      riskLevel: riskLevel as string,
      isDuplicate: isDuplicate !== undefined ? Number(isDuplicate) : undefined,
      isFakeQualification: isFakeQualification !== undefined ? Number(isFakeQualification) : undefined
    })
    success(res, data)
  } catch (error) { next(error) }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await merchantOnboardingService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) { next(error) }
}

export const preCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await merchantOnboardingService.preCheck(req.body)
    success(res, data)
  } catch (error) { next(error) }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await merchantOnboardingService.create(req.body)
    success(res, data, '入驻申请提交成功')
  } catch (error) { next(error) }
}

export const initialAudit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { action, remark } = req.body
    const user = (req as any).user
    const data = await merchantOnboardingService.initialAudit(Number(req.params.id), action, remark, user?.id, user?.nickname)
    success(res, data, '初审完成')
  } catch (error) { next(error) }
}

export const finalAudit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { action, remark } = req.body
    const user = (req as any).user
    const data = await merchantOnboardingService.finalAudit(Number(req.params.id), action, remark, user?.id, user?.nickname)
    success(res, data, '终审完成')
  } catch (error) { next(error) }
}

export const returnApply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = req.body
    const user = (req as any).user
    const data = await merchantOnboardingService.returnApply(Number(req.params.id), reason, user?.id, user?.nickname)
    success(res, data, '已退回')
  } catch (error) { next(error) }
}

export const batchAudit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, action, remark } = req.body
    const user = (req as any).user
    const data = await merchantOnboardingService.batchAudit(ids, action, remark, user?.id, user?.nickname)
    success(res, data, '批量操作完成')
  } catch (error) { next(error) }
}

export const detectDuplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { businessLicenseNo, legalPersonIdCard } = req.body
    const data = await merchantOnboardingService.detectDuplicate(businessLicenseNo, legalPersonIdCard)
    success(res, data)
  } catch (error) { next(error) }
}

export const getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await merchantOnboardingService.getLogs(Number(req.params.id))
    success(res, data)
  } catch (error) { next(error) }
}

export const getCreditArchive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await merchantOnboardingService.getCreditArchive(Number(req.params.id))
    success(res, data)
  } catch (error) { next(error) }
}

export const getCreditArchiveByLicense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await merchantOnboardingService.getCreditArchiveByLicense(req.params.licenseNo)
    success(res, data)
  } catch (error) { next(error) }
}

export const stats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await merchantOnboardingService.getStats()
    success(res, data)
  } catch (error) { next(error) }
}

export const promoteToFinal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await merchantOnboardingService.promoteToFinal(Number(req.params.id))
    success(res, data, '已提交终审')
  } catch (error) { next(error) }
}
