import { MerchantOnboardingApply, MerchantOnboardingLog, MerchantCreditArchive } from '@models/index'
import { AppError } from '@utils/response'
import { getWithFallback, delCacheByPrefix } from '@utils/cache'
import { CacheKey, CacheTTL } from '@/enums/cache'
import { Op } from 'sequelize'
import { MerchantApplyStatus, MerchantType, MerchantRiskLevel } from '@models/merchant-onboarding-apply'
import { MerchantOnboardingLogType } from '@models/merchant-onboarding-log'

const HIGH_RISK_INDUSTRIES = ['金融放贷', '虚拟货币', '博彩', '烟草', '枪支弹药', '药品销售']

interface PreCheckResult {
  businessLicense: { passed: boolean; message: string }
  legalPersonInfo: { passed: boolean; message: string }
  industryQualification: { passed: boolean; message: string }
  storeNameUniqueness: { passed: boolean; message: string }
  industryRisk: { passed: boolean; message: string }
  qualificationExpiry: { passed: boolean; message: string }
  overallPassed: boolean
}

export const merchantOnboardingService = {
  async list(params: {
    page: number; pageSize: number; keyword?: string; status?: number;
    merchantType?: string; riskLevel?: string; isDuplicate?: number; isFakeQualification?: number
  }) {
    const { page, pageSize, keyword, status, merchantType, riskLevel, isDuplicate, isFakeQualification } = params
    const cacheKey = `${CacheKey.MERCHANT_ONBOARDING_LIST}:${page}:${pageSize}:${keyword || ''}:${status ?? ''}:${merchantType || ''}:${riskLevel || ''}:${isDuplicate ?? ''}:${isFakeQualification ?? ''}`
    return getWithFallback(cacheKey, async () => {
      const where: any = {}
      if (keyword) {
        where[Op.or] = [
          { applyNo: { [Op.like]: `%${keyword}%` } },
          { merchantName: { [Op.like]: `%${keyword}%` } },
          { storeName: { [Op.like]: `%${keyword}%` } }
        ]
      }
      if (status !== undefined) where.status = status
      if (merchantType) where.merchantType = merchantType
      if (riskLevel) where.riskLevel = riskLevel
      if (isDuplicate !== undefined) where.isDuplicate = isDuplicate
      if (isFakeQualification !== undefined) where.isFakeQualification = isFakeQualification

      const { count, rows } = await MerchantOnboardingApply.findAndCountAll({
        where,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order: [['createTime', 'DESC']]
      })
      return { list: rows, total: count, page, pageSize }
    }, CacheTTL.MEDIUM)
  },

  async detail(id: number) {
    const apply = await MerchantOnboardingApply.findByPk(id, {
      include: [
        { model: MerchantCreditArchive, as: 'creditArchive' }
      ]
    })
    if (!apply) throw new AppError('入驻申请不存在', 404)
    return apply
  },

  async preCheck(data: {
    businessLicenseNo: string; legalPersonIdCard: string; storeName: string;
    industryCategory: string; qualificationExpireTime?: string
  }): Promise<PreCheckResult> {
    const licenseResult = { passed: !!data.businessLicenseNo, message: data.businessLicenseNo ? '营业执照编号已填写' : '营业执照编号不能为空' }

    const legalPersonResult = { passed: !!data.legalPersonIdCard && data.legalPersonIdCard.length >= 15, message: data.legalPersonIdCard && data.legalPersonIdCard.length >= 15 ? '法人信息校验通过' : '法人身份证信息不完整' }

    const industryResult = { passed: !!data.industryCategory, message: data.industryCategory ? '行业资质已填写' : '行业类目不能为空' }

    const existingStore = await MerchantOnboardingApply.count({
      where: { storeName: data.storeName, status: { [Op.notIn]: [MerchantApplyStatus.REJECTED, MerchantApplyStatus.RETURNED] } }
    })
    const storeNameResult = { passed: existingStore === 0, message: existingStore === 0 ? '店铺名称唯一' : '店铺名称已被占用' }

    const isHighRisk = HIGH_RISK_INDUSTRIES.includes(data.industryCategory)
    const industryRiskResult = { passed: !isHighRisk, message: isHighRisk ? `${data.industryCategory}属于高危行业，禁止入驻` : '行业风险校验通过' }

    let qualificationExpiryResult = { passed: true, message: '资质有效期校验通过' }
    if (data.qualificationExpireTime) {
      const expireDate = new Date(data.qualificationExpireTime)
      if (expireDate <= new Date()) {
        qualificationExpiryResult = { passed: false, message: '资质已过期，禁止入驻' }
      }
    }

    const overallPassed = licenseResult.passed && legalPersonResult.passed && industryResult.passed && storeNameResult.passed && industryRiskResult.passed && qualificationExpiryResult.passed

    return {
      businessLicense: licenseResult,
      legalPersonInfo: legalPersonResult,
      industryQualification: industryResult,
      storeNameUniqueness: storeNameResult,
      industryRisk: industryRiskResult,
      qualificationExpiry: qualificationExpiryResult,
      overallPassed
    }
  },

  async create(data: {
    merchantName: string; merchantType: string; storeName: string;
    businessLicense: string; businessLicenseNo: string; businessScope?: string;
    legalPersonName: string; legalPersonIdCard: string;
    legalPersonIdCardFront: string; legalPersonIdCardBack: string; legalPersonPhone: string;
    industryCategory: string; industryQualification?: string; industryQualificationNo?: string;
    qualificationExpireTime?: string; contactName: string; contactPhone: string;
    contactEmail?: string; shopAddress?: string; brandAuthorization?: string;
    brandName?: string; otherMaterials?: string
  }) {
    const duplicateLicense = await MerchantOnboardingApply.count({
      where: { businessLicenseNo: data.businessLicenseNo, status: { [Op.notIn]: [MerchantApplyStatus.REJECTED, MerchantApplyStatus.RETURNED] } }
    })
    if (duplicateLicense > 0) throw new AppError('该营业执照已存在入驻申请，请勿重复提交', 400)

    const duplicateIdCard = await MerchantOnboardingApply.count({
      where: { legalPersonIdCard: data.legalPersonIdCard, status: { [Op.notIn]: [MerchantApplyStatus.REJECTED, MerchantApplyStatus.RETURNED] } }
    })
    if (duplicateIdCard > 0) throw new AppError('该法人身份证已绑定其他入驻申请', 400)

    const existingStore = await MerchantOnboardingApply.count({
      where: { storeName: data.storeName, status: { [Op.notIn]: [MerchantApplyStatus.REJECTED, MerchantApplyStatus.RETURNED] } }
    })
    if (existingStore > 0) throw new AppError('店铺名称已被占用', 400)

    const preCheckResult = await this.preCheck({
      businessLicenseNo: data.businessLicenseNo,
      legalPersonIdCard: data.legalPersonIdCard,
      storeName: data.storeName,
      industryCategory: data.industryCategory,
      qualificationExpireTime: data.qualificationExpireTime
    })

    if (!preCheckResult.overallPassed) throw new AppError('前置校验未通过，请检查申请资料', 400)

    const isHighRisk = HIGH_RISK_INDUSTRIES.includes(data.industryCategory)
    const riskLevel = isHighRisk ? MerchantRiskLevel.HIGH : MerchantRiskLevel.LOW

    const applyNo = `MC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

    const apply = await MerchantOnboardingApply.create({
      applyNo,
      status: MerchantApplyStatus.PENDING_INITIAL,
      riskLevel,
      preCheckResult: JSON.stringify(preCheckResult),
      preCheckPassed: 1,
      submitTime: new Date(),
      ...data
    } as any)

    await this.addLog({
      applyId: apply.id,
      logType: MerchantOnboardingLogType.SUBMIT,
      remark: '提交入驻申请，进入初审队列'
    })
    await this.addLog({
      applyId: apply.id,
      logType: MerchantOnboardingLogType.PRE_CHECK,
      remark: '前置校验通过',
      detail: JSON.stringify(preCheckResult)
    })

    await this.updateOrCreateCreditArchive(apply.id, data.merchantName, data.businessLicenseNo, data.legalPersonIdCard)

    delCacheByPrefix(CacheKey.MERCHANT_ONBOARDING_LIST).catch(() => {})
    return { id: apply.id, applyNo, preCheckResult }
  },

  async initialAudit(id: number, action: 'pass' | 'reject', remark: string, auditorId?: number, auditorName?: string) {
    const apply = await MerchantOnboardingApply.findByPk(id)
    if (!apply) throw new AppError('入驻申请不存在', 404)
    if (apply.status !== MerchantApplyStatus.PENDING_INITIAL) throw new AppError('当前状态不可初审', 400)

    const beforeStatus = apply.status
    let afterStatus: number
    let logType: string
    let statusRemark: string

    if (action === 'pass') {
      afterStatus = MerchantApplyStatus.INITIAL_PASSED
      logType = MerchantOnboardingLogType.INITIAL_PASS
      statusRemark = '初审通过，已开放资料完善权限'
      await apply.update({
        status: afterStatus,
        initialAuditorId: auditorId,
        initialAuditorName: auditorName,
        initialAuditTime: new Date(),
        initialAuditRemark: remark
      })
    } else {
      afterStatus = MerchantApplyStatus.REJECTED
      logType = MerchantOnboardingLogType.INITIAL_REJECT
      statusRemark = `初审驳回：${remark}`
      await apply.update({
        status: afterStatus,
        initialAuditorId: auditorId,
        initialAuditorName: auditorName,
        initialAuditTime: new Date(),
        initialAuditRemark: remark,
        rejectReason: remark,
        rejectDimension: 'initial'
      })
    }

    await this.addLog({ applyId: id, logType, operatorId: auditorId, operatorName: auditorName, beforeStatus, afterStatus, remark: statusRemark })
    await this.addLog({ applyId: id, logType: MerchantOnboardingLogType.PERMISSION_CHANGE, operatorId: auditorId, operatorName: auditorName, remark: action === 'pass' ? '已开放资料完善权限' : '已锁定入驻流程' })

    delCacheByPrefix(CacheKey.MERCHANT_ONBOARDING_LIST).catch(() => {})
    return { id: apply.id, status: afterStatus }
  },

  async finalAudit(id: number, action: 'pass' | 'reject', remark: string, auditorId?: number, auditorName?: string) {
    const apply = await MerchantOnboardingApply.findByPk(id)
    if (!apply) throw new AppError('入驻申请不存在', 404)
    if (apply.status !== MerchantApplyStatus.INITIAL_PASSED && apply.status !== MerchantApplyStatus.PENDING_FINAL) throw new AppError('当前状态不可终审', 400)

    const beforeStatus = apply.status
    let afterStatus: number
    let logType: string
    let statusRemark: string

    if (action === 'pass') {
      afterStatus = MerchantApplyStatus.APPROVED
      logType = MerchantOnboardingLogType.FINAL_PASS
      statusRemark = '终审通过，正式开通店铺权限'
      await apply.update({
        status: afterStatus,
        finalAuditorId: auditorId,
        finalAuditorName: auditorName,
        finalAuditTime: new Date(),
        finalAuditRemark: remark,
        storeOpened: 1,
        listingEnabled: 1,
        marketingEnabled: 1
      })
    } else {
      afterStatus = MerchantApplyStatus.REJECTED
      logType = MerchantOnboardingLogType.FINAL_REJECT
      statusRemark = `终审驳回：${remark}`
      await apply.update({
        status: afterStatus,
        finalAuditorId: auditorId,
        finalAuditorName: auditorName,
        finalAuditTime: new Date(),
        finalAuditRemark: remark,
        rejectReason: remark,
        rejectDimension: 'final'
      })
    }

    await this.addLog({ applyId: id, logType, operatorId: auditorId, operatorName: auditorName, beforeStatus, afterStatus, remark: statusRemark })
    await this.addLog({ applyId: id, logType: MerchantOnboardingLogType.STATUS_CHANGE, operatorId: auditorId, operatorName: auditorName, beforeStatus, afterStatus, remark: action === 'pass' ? '店铺权限已正式开通' : '入驻流程已锁定' })
    await this.addLog({ applyId: id, logType: MerchantOnboardingLogType.PERMISSION_CHANGE, operatorId: auditorId, operatorName: auditorName, remark: action === 'pass' ? '店铺、上架、营销权限已全部开通' : '所有权限已锁定' })

    if (action === 'reject') {
      await this.updateCreditScore(id, -20, '终审驳回')
    }

    delCacheByPrefix(CacheKey.MERCHANT_ONBOARDING_LIST).catch(() => {})
    return { id: apply.id, status: afterStatus }
  },

  async returnApply(id: number, reason: string, operatorId?: number, operatorName?: string) {
    const apply = await MerchantOnboardingApply.findByPk(id)
    if (!apply) throw new AppError('入驻申请不存在', 404)
    if (apply.status !== MerchantApplyStatus.PENDING_INITIAL && apply.status !== MerchantApplyStatus.INITIAL_PASSED) throw new AppError('当前状态不可退回', 400)

    const beforeStatus = apply.status
    await apply.update({ status: MerchantApplyStatus.RETURNED, returnReason: reason })

    await this.addLog({ applyId: id, logType: MerchantOnboardingLogType.RETURN, operatorId, operatorName, beforeStatus, afterStatus: MerchantApplyStatus.RETURNED, remark: `退回补充资料：${reason}` })

    delCacheByPrefix(CacheKey.MERCHANT_ONBOARDING_LIST).catch(() => {})
    return { id: apply.id }
  },

  async batchAudit(ids: number[], action: 'pass' | 'reject' | 'return', remark: string, operatorId?: number, operatorName?: string) {
    const applies = await MerchantOnboardingApply.findAll({ where: { id: { [Op.in]: ids } } })
    if (applies.length === 0) throw new AppError('没有可处理的申请', 400)

    const results = { successCount: 0, failCount: 0, totalCount: ids.length }

    for (const apply of applies) {
      try {
        if (action === 'pass') {
          if (apply.status === MerchantApplyStatus.PENDING_INITIAL) {
            await this.initialAudit(apply.id, 'pass', remark, operatorId, operatorName)
          } else if (apply.status === MerchantApplyStatus.INITIAL_PASSED || apply.status === MerchantApplyStatus.PENDING_FINAL) {
            await this.finalAudit(apply.id, 'pass', remark, operatorId, operatorName)
          } else {
            results.failCount++
            continue
          }
        } else if (action === 'reject') {
          if (apply.status === MerchantApplyStatus.PENDING_INITIAL) {
            await this.initialAudit(apply.id, 'reject', remark, operatorId, operatorName)
          } else if (apply.status === MerchantApplyStatus.INITIAL_PASSED || apply.status === MerchantApplyStatus.PENDING_FINAL) {
            await this.finalAudit(apply.id, 'reject', remark, operatorId, operatorName)
          } else {
            results.failCount++
            continue
          }
        } else if (action === 'return') {
          await this.returnApply(apply.id, remark, operatorId, operatorName)
        }
        results.successCount++
      } catch {
        results.failCount++
      }
    }

    const logType = action === 'pass' ? MerchantOnboardingLogType.BATCH_PASS : action === 'reject' ? MerchantOnboardingLogType.BATCH_REJECT : MerchantOnboardingLogType.BATCH_RETURN
    for (const apply of applies) {
      await this.addLog({ applyId: apply.id, logType, operatorId, operatorName, remark: `批量${action === 'pass' ? '通过' : action === 'reject' ? '驳回' : '退回'}：${remark}` })
    }

    delCacheByPrefix(CacheKey.MERCHANT_ONBOARDING_LIST).catch(() => {})
    return results
  },

  async detectDuplicate(businessLicenseNo: string, legalPersonIdCard: string): Promise<{ isDuplicate: boolean; isFake: boolean; isCrossIndustry: boolean; details: string[] }> {
    const details: string[] = []
    let isDuplicate = false
    let isFake = false
    let isCrossIndustry = false

    const licenseCount = await MerchantOnboardingApply.count({
      where: { businessLicenseNo, status: { [Op.in]: [MerchantApplyStatus.APPROVED, MerchantApplyStatus.PENDING_INITIAL, MerchantApplyStatus.PENDING_FINAL] } }
    })
    if (licenseCount > 0) {
      isDuplicate = true
      details.push('该营业执照已存在有效入驻记录')
    }

    const idCardCount = await MerchantOnboardingApply.count({
      where: { legalPersonIdCard, status: { [Op.in]: [MerchantApplyStatus.APPROVED, MerchantApplyStatus.PENDING_INITIAL, MerchantApplyStatus.PENDING_FINAL] } }
    })
    if (idCardCount > 1) {
      isFake = true
      details.push('该法人身份证关联多个入驻申请，存在虚假资质风险')
    }

    if (isDuplicate || isFake) {
      const applies = await MerchantOnboardingApply.findAll({
        where: { [Op.or]: [{ businessLicenseNo }, { legalPersonIdCard }], status: { [Op.in]: [MerchantApplyStatus.APPROVED] } }
      })
      const industries = [...new Set(applies.map(a => a.industryCategory))]
      if (industries.length > 1) {
        isCrossIndustry = true
        details.push(`存在跨行业入驻：${industries.join('、')}`)
      }
    }

    return { isDuplicate, isFake, isCrossIndustry, details }
  },

  async getLogs(applyId: number) {
    return MerchantOnboardingLog.findAll({ where: { applyId }, order: [['createTime', 'DESC']] })
  },

  async getCreditArchive(applyId: number) {
    const archive = await MerchantCreditArchive.findOne({ where: { applyId } })
    if (!archive) throw new AppError('信用档案不存在', 404)
    return archive
  },

  async getCreditArchiveByLicense(businessLicenseNo: string) {
    return MerchantCreditArchive.findAll({ where: { businessLicenseNo }, order: [['createTime', 'DESC']] })
  },

  async updateOrCreateCreditArchive(applyId: number, merchantName: string, businessLicenseNo: string, legalPersonIdCard: string) {
    let archive = await MerchantCreditArchive.findOne({ where: { businessLicenseNo } })
    if (archive) {
      await archive.update({
        onboardingCount: archive.onboardingCount + 1,
        lastOnboardingTime: new Date(),
        merchantName,
        applyId
      })
      if (archive.onboardingCount > 1) {
        await archive.update({ duplicateApplyCount: archive.duplicateApplyCount + 1 })
      }
    } else {
      archive = await MerchantCreditArchive.create({
        applyId, merchantName, businessLicenseNo, legalPersonIdCard,
        creditScore: 100, creditLevel: 'A', onboardingCount: 1,
        violationCount: 0, fakeQualificationCount: 0, crossIndustryCount: 0, duplicateApplyCount: 0
      })
    }
    return archive
  },

  async updateCreditScore(applyId: number, delta: number, reason: string) {
    const archive = await MerchantCreditArchive.findOne({ where: { applyId } })
    if (archive) {
      const newScore = Math.max(0, Math.min(100, archive.creditScore + delta))
      const creditLevel = newScore >= 90 ? 'A' : newScore >= 70 ? 'B' : newScore >= 50 ? 'C' : 'D'
      await archive.update({ creditScore: newScore, creditLevel })
      await this.addLog({ applyId, logType: MerchantOnboardingLogType.CREDIT_UPDATE, remark: `信用评分${delta > 0 ? '+' : ''}${delta}，原因：${reason}，当前评分：${newScore}` })
    }
  },

  async addLog(params: {
    applyId: number; logType: string; operatorId?: number; operatorName?: string;
    operatorRole?: string; beforeStatus?: number; afterStatus?: number;
    remark?: string; detail?: string; ip?: string
  }) {
    return MerchantOnboardingLog.create({ ...params, createTime: new Date() })
  },

  async getStats() {
    const total = await MerchantOnboardingApply.count()
    const pendingInitial = await MerchantOnboardingApply.count({ where: { status: MerchantApplyStatus.PENDING_INITIAL } })
    const pendingFinal = await MerchantOnboardingApply.count({ where: { status: MerchantApplyStatus.PENDING_FINAL } })
    const initialPassed = await MerchantOnboardingApply.count({ where: { status: MerchantApplyStatus.INITIAL_PASSED } })
    const approved = await MerchantOnboardingApply.count({ where: { status: MerchantApplyStatus.APPROVED } })
    const rejected = await MerchantOnboardingApply.count({ where: { status: MerchantApplyStatus.REJECTED } })
    const returned = await MerchantOnboardingApply.count({ where: { status: MerchantApplyStatus.RETURNED } })
    const duplicateCount = await MerchantOnboardingApply.count({ where: { isDuplicate: 1 } })
    const fakeCount = await MerchantOnboardingApply.count({ where: { isFakeQualification: 1 } })
    const crossIndustryCount = await MerchantOnboardingApply.count({ where: { isCrossIndustry: 1 } })
    const normalCount = await MerchantOnboardingApply.count({ where: { merchantType: MerchantType.NORMAL } })
    const brandCount = await MerchantOnboardingApply.count({ where: { merchantType: MerchantType.BRAND } })

    return { total, pendingInitial, pendingFinal, initialPassed, approved, rejected, returned, duplicateCount, fakeCount, crossIndustryCount, normalCount, brandCount }
  },

  async promoteToFinal(id: number) {
    const apply = await MerchantOnboardingApply.findByPk(id)
    if (!apply) throw new AppError('入驻申请不存在', 404)
    if (apply.status !== MerchantApplyStatus.INITIAL_PASSED) throw new AppError('仅初审通过的申请可提交终审', 400)

    const beforeStatus = apply.status
    await apply.update({ status: MerchantApplyStatus.PENDING_FINAL })
    await this.addLog({ applyId: id, logType: MerchantOnboardingLogType.STATUS_CHANGE, beforeStatus, afterStatus: MerchantApplyStatus.PENDING_FINAL, remark: '资料完善，提交终审' })

    delCacheByPrefix(CacheKey.MERCHANT_ONBOARDING_LIST).catch(() => {})
    return { id: apply.id }
  }
}
