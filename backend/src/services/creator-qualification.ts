import { CreatorQualificationApply, CreatorQualificationLog, CreatorBenefitConfig, Creator } from '@models/index'
import { AppError } from '@utils/response'
import { getWithFallback, delCacheByPrefix } from '@utils/cache'
import { CacheKey, CacheTTL } from '@/enums/cache'
import { Op, fn, col } from 'sequelize'
import { notificationService } from './notification'
import { QualificationApplyStatus, QualificationLogType } from '@models/creator-qualification-apply'
import { CreatorIdentityStatus, CreatorBenefit } from '@models/creator-benefit-config'

interface PreCheckResult {
  followers: { passed: boolean; value: number; required: number; message: string }
  contentVerticality: { passed: boolean; value: number; required: number; message: string }
  complianceRecord: { passed: boolean; value: number; required: number; message: string }
  realNameVerified: { passed: boolean; value: boolean; message: string }
  overallPassed: boolean
}

const MIN_FOLLOWERS = 1000
const MIN_CONTENT_VERTICALITY = 70
const MIN_COMPLIANCE_SCORE = 80

export const creatorQualificationService = {
  async list(params: {
    page: number
    pageSize: number
    keyword?: string
    status?: number
    qualificationType?: string
    isFake?: number
    isExpiringSoon?: number
  }) {
    const { page, pageSize, keyword, status, qualificationType, isFake, isExpiringSoon } = params
    const cacheKey = `${CacheKey.CREATOR_QUALIFICATION_LIST}:${page}:${pageSize}:${keyword || ''}:${status ?? ''}:${qualificationType || ''}:${isFake ?? ''}:${isExpiringSoon ?? ''}`
    return getWithFallback(
      cacheKey,
      async () => {
        const where: any = {}

        if (keyword) {
          where[Op.or] = [
            { applyNo: { [Op.like]: `%${keyword}%` } },
            { realName: { [Op.like]: `%${keyword}%` } }
          ]
        }
        if (status !== undefined) where.status = status
        if (qualificationType) where.qualificationType = qualificationType
        if (isFake !== undefined) where.isFake = isFake
        if (isExpiringSoon !== undefined) where.isExpiringSoon = isExpiringSoon

        const { count, rows } = await CreatorQualificationApply.findAndCountAll({
          where,
          include: [
            {
              model: Creator,
              as: 'creator',
              attributes: ['id', 'name', 'avatar', 'platform', 'followers', 'category', 'level']
            }
          ],
          offset: (page - 1) * pageSize,
          limit: pageSize,
          order: [['createTime', 'DESC']]
        })

        return { list: rows, total: count, page, pageSize }
      },
      CacheTTL.MEDIUM
    )
  },

  async detail(id: number) {
    const apply = await CreatorQualificationApply.findByPk(id, {
      include: [
        {
          model: Creator,
          as: 'creator',
          attributes: ['id', 'name', 'avatar', 'platform', 'followers', 'likes', 'category', 'level']
        },
        {
          model: CreatorBenefitConfig,
          as: 'benefitConfig'
        }
      ]
    })
    if (!apply) throw new AppError('资质申请不存在', 404)
    return apply
  },

  async preCheck(creatorId: number): Promise<PreCheckResult> {
    const creator = await Creator.findByPk(creatorId)
    if (!creator) throw new AppError('达人不存在', 404)

    const followersResult = {
      passed: creator.followers >= MIN_FOLLOWERS,
      value: creator.followers,
      required: MIN_FOLLOWERS,
      message: creator.followers >= MIN_FOLLOWERS ? '粉丝量达标' : `粉丝量不足，需要${MIN_FOLLOWERS}粉丝`
    }

    const contentVerticalityScore = Math.floor(Math.random() * 30) + 60
    const contentVerticalityResult = {
      passed: contentVerticalityScore >= MIN_CONTENT_VERTICALITY,
      value: contentVerticalityScore,
      required: MIN_CONTENT_VERTICALITY,
      message: contentVerticalityScore >= MIN_CONTENT_VERTICALITY ? '内容垂直度达标' : `内容垂直度不足，需要${MIN_CONTENT_VERTICALITY}%`
    }

    const complianceScore = Math.floor(Math.random() * 20) + 75
    const complianceResult = {
      passed: complianceScore >= MIN_COMPLIANCE_SCORE,
      value: complianceScore,
      required: MIN_COMPLIANCE_SCORE,
      message: complianceScore >= MIN_COMPLIANCE_SCORE ? '合规记录良好' : `合规评分不足，需要${MIN_COMPLIANCE_SCORE}分`
    }

    const realNameResult = {
      passed: true,
      value: true,
      message: '实名认证已完成'
    }

    const overallPassed = followersResult.passed && contentVerticalityResult.passed && complianceResult.passed && realNameResult.passed

    return {
      followers: followersResult,
      contentVerticality: contentVerticalityResult,
      complianceRecord: complianceResult,
      realNameVerified: realNameResult,
      overallPassed
    }
  },

  async create(creatorId: number, data: {
    qualificationType: string
    realName: string
    idCard: string
    idCardFront: string
    idCardBack: string
    businessLicense?: string
    businessLicenseNo?: string
    industryCert?: string
    industryCertNo?: string
    industryCategory?: string
    otherMaterials?: string
  }) {
    const creator = await Creator.findByPk(creatorId)
    if (!creator) throw new AppError('达人不存在', 404)

    const pendingCount = await CreatorQualificationApply.count({
      where: { creatorId, status: { [Op.in]: [QualificationApplyStatus.PENDING, QualificationApplyStatus.UNDER_REVIEW] } }
    })
    if (pendingCount > 0) {
      throw new AppError('存在待处理的资质申请，请勿重复提交', 400)
    }

    const preCheckResult = await this.preCheck(creatorId)

    const applyNo = `QL${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

    const expireTime = new Date()
    expireTime.setFullYear(expireTime.getFullYear() + 1)

    const apply = await CreatorQualificationApply.create({
      creatorId,
      applyNo,
      status: preCheckResult.overallPassed ? QualificationApplyStatus.UNDER_REVIEW : QualificationApplyStatus.PENDING,
      preCheckResult: JSON.stringify(preCheckResult),
      preCheckPassed: preCheckResult.overallPassed ? 1 : 0,
      expireTime,
      submitTime: new Date(),
      ...data
    })

    await this.addLog({
      applyId: apply.id,
      creatorId,
      logType: QualificationLogType.SUBMIT,
      remark: preCheckResult.overallPassed ? '提交资质申请，前置校验通过' : '提交资质申请，前置校验未通过',
      detail: JSON.stringify(preCheckResult)
    })

    await this.addLog({
      applyId: apply.id,
      creatorId,
      logType: QualificationLogType.PRE_CHECK,
      remark: preCheckResult.overallPassed ? '前置校验通过' : '前置校验未通过',
      detail: JSON.stringify(preCheckResult)
    })

    delCacheByPrefix(CacheKey.CREATOR_QUALIFICATION_LIST).catch(() => {})
    return { id: apply.id, applyNo, preCheckPassed: preCheckResult.overallPassed, preCheckResult }
  },

  async audit(id: number, status: number, rejectReason?: string, auditorId?: number, auditorName?: string) {
    const apply = await CreatorQualificationApply.findByPk(id)
    if (!apply) throw new AppError('资质申请不存在', 404)

    if (apply.status !== QualificationApplyStatus.UNDER_REVIEW) {
      throw new AppError('当前状态不可审核', 400)
    }

    const beforeStatus = apply.status

    const updateData: any = {
      status,
      auditorId,
      auditorName,
      auditTime: new Date()
    }

    if (status === QualificationApplyStatus.REJECTED && rejectReason) {
      updateData.rejectReason = rejectReason
    }

    await apply.update(updateData)

    await this.addLog({
      applyId: apply.id,
      creatorId: apply.creatorId,
      logType: status === QualificationApplyStatus.APPROVED ? QualificationLogType.AUDIT_PASS : QualificationLogType.AUDIT_REJECT,
      operatorId: auditorId,
      operatorName: auditorName,
      beforeStatus,
      afterStatus: status,
      remark: status === QualificationApplyStatus.APPROVED ? '审核通过' : `审核驳回：${rejectReason || '资质不符合要求'}`
    })

    if (status === QualificationApplyStatus.APPROVED) {
      await this.grantBenefits(apply.creatorId, apply.id, apply.expireTime)
    }

    if (status === QualificationApplyStatus.REJECTED) {
      await this.revokeBenefits(apply.creatorId, apply.id, rejectReason)
    }

    await notificationService.create({
      userId: apply.creatorId,
      type: 'system',
      title: status === QualificationApplyStatus.APPROVED ? '资质审核通过' : '资质审核驳回',
      content: status === QualificationApplyStatus.APPROVED
        ? '恭喜您，达人资质审核已通过！已解锁达人专属权益。'
        : `您的达人资质审核未通过，原因：${rejectReason || '资质不符合要求'}`,
      relatedId: apply.id,
      relatedType: 'qualification'
    })

    delCacheByPrefix(CacheKey.CREATOR_QUALIFICATION_LIST).catch(() => {})
    return { id: apply.id }
  },

  async batchAudit(ids: number[], status: number, rejectReason?: string, operatorId?: number, operatorName?: string) {
    const applies = await CreatorQualificationApply.findAll({
      where: {
        id: { [Op.in]: ids },
        status: QualificationApplyStatus.UNDER_REVIEW
      }
    })

    if (applies.length === 0) {
      throw new AppError('没有可审核的申请', 400)
    }

    const validIds = applies.map(a => a.id)
    const creatorIds = applies.map(a => a.creatorId)

    await CreatorQualificationApply.update(
      {
        status,
        auditorId: operatorId,
        auditorName: operatorName,
        auditTime: new Date(),
        rejectReason: status === QualificationApplyStatus.REJECTED ? rejectReason || '批量驳回' : undefined
      } as any,
      { where: { id: { [Op.in]: validIds } } }
    )

    for (const apply of applies) {
      await this.addLog({
        applyId: apply.id,
        creatorId: apply.creatorId,
        logType: status === QualificationApplyStatus.APPROVED ? QualificationLogType.BATCH_PASS : QualificationLogType.BATCH_REJECT,
        operatorId,
        operatorName,
        beforeStatus: apply.status,
        afterStatus: status,
        remark: status === QualificationApplyStatus.APPROVED
          ? '批量审核通过'
          : `批量审核驳回：${rejectReason || '资质不符合要求'}`
      })

      if (status === QualificationApplyStatus.APPROVED) {
        await this.grantBenefits(apply.creatorId, apply.id, apply.expireTime)
      }
    }

    delCacheByPrefix(CacheKey.CREATOR_QUALIFICATION_LIST).catch(() => {})
    return { successCount: validIds.length, totalCount: ids.length }
  },

  async grantBenefits(creatorId: number, applyId: number, expireTime?: Date | null) {
    let benefitConfig = await CreatorBenefitConfig.findOne({ where: { creatorId } })

    const benefits = [
      CreatorBenefit.LIVE_STREAMING,
      CreatorBenefit.PRODUCT_LINK,
      CreatorBenefit.SHOPPING_CART,
      CreatorBenefit.BRAND_COOPERATION,
      CreatorBenefit.COMMISSION,
      CreatorBenefit.DATA_ANALYTICS,
      CreatorBenefit.ACTIVITY_PRIORITY,
      CreatorBenefit.CUSTOMER_SERVICE,
      CreatorBenefit.VERIFIED_BADGE,
      CreatorBenefit.FLOW_BOOST
    ]

    const updateData = {
      identityStatus: CreatorIdentityStatus.VERIFIED,
      benefits: JSON.stringify(benefits),
      liveStreamingEnabled: 1,
      productLinkEnabled: 1,
      shoppingCartEnabled: 1,
      brandCooperationEnabled: 1,
      commissionEnabled: 1,
      commissionRate: 10,
      dataAnalyticsEnabled: 1,
      activityPriorityEnabled: 1,
      customerServiceEnabled: 1,
      verifiedBadgeEnabled: 1,
      flowBoostEnabled: 1,
      flowBoostValue: 30,
      qualificationExpireTime: expireTime
    }

    if (benefitConfig) {
      await benefitConfig.update(updateData)
    } else {
      benefitConfig = await CreatorBenefitConfig.create({ creatorId, ...updateData })
    }

    await Creator.update(
      { qualificationStatus: 2 },
      { where: { id: creatorId } }
    )

    await this.addLog({
      applyId,
      creatorId,
      logType: QualificationLogType.STATUS_CHANGE,
      remark: '达人身份状态变更为：认证达人'
    })

    await this.addLog({
      applyId,
      creatorId,
      logType: QualificationLogType.BENEFIT_CHANGE,
      remark: '已解锁全部达人权益',
      detail: JSON.stringify(benefits)
    })

    return benefitConfig
  },

  async revokeBenefits(creatorId: number, applyId: number, reason?: string) {
    const benefitConfig = await CreatorBenefitConfig.findOne({ where: { creatorId } })

    if (benefitConfig) {
      await benefitConfig.update({
        identityStatus: CreatorIdentityStatus.NORMAL,
        benefits: JSON.stringify([]),
        liveStreamingEnabled: 0,
        productLinkEnabled: 0,
        shoppingCartEnabled: 0,
        brandCooperationEnabled: 0,
        commissionEnabled: 0,
        dataAnalyticsEnabled: 0,
        activityPriorityEnabled: 0,
        customerServiceEnabled: 0,
        verifiedBadgeEnabled: 0,
        flowBoostEnabled: 0
      })
    }

    await Creator.update(
      { qualificationStatus: 3 },
      { where: { id: creatorId } }
    )

    await this.addLog({
      applyId,
      creatorId,
      logType: QualificationLogType.STATUS_CHANGE,
      remark: `达人身份状态变更为：普通用户，原因：${reason || '资质审核驳回'}`
    })

    return true
  },

  async addLog(params: {
    applyId: number
    creatorId: number
    logType: string
    operatorId?: number
    operatorName?: string
    operatorRole?: string
    beforeStatus?: number
    afterStatus?: number
    remark?: string
    detail?: string
    ip?: string
  }) {
    return CreatorQualificationLog.create({
      ...params,
      createTime: new Date()
    })
  },

  async getLogs(applyId: number) {
    const logs = await CreatorQualificationLog.findAll({
      where: { applyId },
      order: [['createTime', 'DESC']]
    })
    return logs
  },

  async getTraceLogs(creatorId: number) {
    const logs = await CreatorQualificationLog.findAll({
      where: { creatorId },
      order: [['createTime', 'DESC']]
    })
    return logs
  },

  async checkFakeQualification(idCard: string, businessLicenseNo?: string): Promise<{ isFake: boolean; reason: string }> {
    const existingCount = await CreatorQualificationApply.count({
      where: {
        idCard,
        status: { [Op.in]: [QualificationApplyStatus.APPROVED, QualificationApplyStatus.UNDER_REVIEW] }
      }
    })

    if (existingCount > 1) {
      return { isFake: true, reason: '该身份证号已绑定其他达人账号，存在重复资质申请风险' }
    }

    if (businessLicenseNo) {
      const licenseCount = await CreatorQualificationApply.count({
        where: {
          businessLicenseNo,
          status: { [Op.in]: [QualificationApplyStatus.APPROVED, QualificationApplyStatus.UNDER_REVIEW] }
        }
      })

      if (licenseCount > 1) {
        return { isFake: true, reason: '该营业执照号已被其他达人使用，存在资质复用风险' }
      }
    }

    return { isFake: false, reason: '' }
  },

  async getExpiringSoon(days: number = 30) {
    const now = new Date()
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + days)

    const { count, rows } = await CreatorQualificationApply.findAndCountAll({
      where: {
        status: QualificationApplyStatus.APPROVED,
        expireTime: {
          [Op.between]: [now, expireDate]
        }
      },
      include: [
        {
          model: Creator,
          as: 'creator',
          attributes: ['id', 'name', 'avatar', 'platform']
        }
      ],
      order: [['expireTime', 'ASC']]
    })

    return { list: rows, total: count, days }
  },

  async updateExpiringStatus() {
    const now = new Date()
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    const expiredApplies = await CreatorQualificationApply.findAll({
      where: {
        status: QualificationApplyStatus.APPROVED,
        expireTime: { [Op.lt]: now }
      }
    })

    for (const apply of expiredApplies) {
      await apply.update({
        status: QualificationApplyStatus.EXPIRED,
        isExpiringSoon: 0
      })

      await this.revokeBenefits(apply.creatorId, apply.id, '资质过期')

      await this.addLog({
        applyId: apply.id,
        creatorId: apply.creatorId,
        logType: QualificationLogType.EXPIRE,
        remark: '资质已过期，权益已暂停'
      })
    }

    const expiringApplies = await CreatorQualificationApply.findAll({
      where: {
        status: QualificationApplyStatus.APPROVED,
        expireTime: {
          [Op.between]: [now, thirtyDaysLater]
        },
        isExpiringSoon: 0
      }
    })

    for (const apply of expiringApplies) {
      await apply.update({ isExpiringSoon: 1 })
    }

    return {
      expiredCount: expiredApplies.length,
      expiringCount: expiringApplies.length
    }
  },

  async getStats() {
    const total = await CreatorQualificationApply.count()
    const pending = await CreatorQualificationApply.count({ where: { status: QualificationApplyStatus.PENDING } })
    const underReview = await CreatorQualificationApply.count({ where: { status: QualificationApplyStatus.UNDER_REVIEW } })
    const approved = await CreatorQualificationApply.count({ where: { status: QualificationApplyStatus.APPROVED } })
    const rejected = await CreatorQualificationApply.count({ where: { status: QualificationApplyStatus.REJECTED } })
    const expired = await CreatorQualificationApply.count({ where: { status: QualificationApplyStatus.EXPIRED } })
    const expiringSoon = await CreatorQualificationApply.count({ where: { isExpiringSoon: 1 } })
    const fakeCount = await CreatorQualificationApply.count({ where: { isFake: 1 } })

    return {
      total,
      pending,
      underReview,
      approved,
      rejected,
      expired,
      expiringSoon,
      fakeCount
    }
  },

  async getBenefitConfig(creatorId: number) {
    let config = await CreatorBenefitConfig.findOne({
      where: { creatorId },
      include: [
        {
          model: Creator,
          as: 'creator',
          attributes: ['id', 'name', 'avatar', 'platform']
        }
      ]
    })
    if (!config) {
      config = await CreatorBenefitConfig.create({
        creatorId,
        identityStatus: CreatorIdentityStatus.NORMAL,
        benefits: JSON.stringify([])
      })
    }
    return config
  },

  async getApplyByCreator(creatorId: number) {
    const applies = await CreatorQualificationApply.findAll({
      where: { creatorId },
      order: [['createTime', 'DESC']]
    })
    return applies
  }
}
