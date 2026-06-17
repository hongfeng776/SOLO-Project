import { User, ViolationRecord, PublishAbnormalLog } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

export const userAccountService = {
  async checkPublishEligibility(userId: number) {
    const reasons: string[] = []
    const [user, recentViolations] = await Promise.all([
      User.findByPk(userId),
      this.getRecentViolations(userId, 7)
    ])

    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const now = new Date()
    const isBanned = user.status === 0 && (!user.banExpireTime || user.banExpireTime > now)
    const isFlowLimited = !!user.flowLimitExpireTime && user.flowLimitExpireTime > now
    const realNameVerified = user.realNameVerified ?? 0

    if (user.status !== 1 && !isBanned) {
      reasons.push('账号状态异常')
    }

    if (isBanned) {
      reasons.push(user.banExpireTime ? `账号已被封禁，解禁时间：${user.banExpireTime.toLocaleString()}` : '账号已被永久封禁')
    }

    if (realNameVerified !== 2) {
      const verifiedMap: Record<number, string> = { 0: '未实名认证', 1: '实名认证审核中', 3: '实名认证已被拒绝' }
      reasons.push(verifiedMap[realNameVerified] || '实名认证状态异常')
    }

    const handledViolations = recentViolations.filter(
      (v: any) => v.status === 2 && v.violationLevel >= 2
    )
    const recentViolationsCount = handledViolations.length

    if (recentViolationsCount >= 3) {
      reasons.push(`近7天内存在${recentViolationsCount}次违规记录，暂时无法发布`)
    }

    const eligible = reasons.length === 0

    return {
      eligible,
      reasons,
      accountStatus: {
        status: user.status,
        realNameVerified,
        isBanned,
        isFlowLimited,
        recentViolations: recentViolationsCount
      }
    }
  },

  async checkAccountStatus(userId: number) {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const now = new Date()
    const isBanned = user.status === 0 && (!user.banExpireTime || user.banExpireTime > now)
    const isFlowLimited = !!user.flowLimitExpireTime && user.flowLimitExpireTime > now

    let statusDesc = 'normal'
    if (isBanned) statusDesc = 'banned'
    else if (isFlowLimited) statusDesc = 'flowLimited'
    else if (user.status !== 1) statusDesc = 'inactive'

    return {
      status: user.status,
      statusDesc,
      isBanned,
      isFlowLimited,
      banExpireTime: user.banExpireTime,
      flowLimitExpireTime: user.flowLimitExpireTime,
      realNameVerified: user.realNameVerified ?? 0
    }
  },

  async getRecentViolations(userId: number, days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    return await ViolationRecord.findAll({
      where: {
        targetId: userId,
        createTime: { [Op.gte]: startDate }
      },
      order: [['createTime', 'DESC']]
    })
  },

  async recordPublishAbnormal(data: {
    userId: number
    userName: string
    abnormalType: string
    abnormalDetail?: string
    targetNoteId?: number
    ip?: string
    userAgent?: string
  }) {
    const log = await PublishAbnormalLog.create({
      userId: data.userId,
      userName: data.userName,
      abnormalType: data.abnormalType,
      abnormalDetail: data.abnormalDetail || '',
      targetNoteId: data.targetNoteId || 0,
      ip: data.ip || '',
      userAgent: data.userAgent || ''
    } as any)
    return { id: log.id }
  },

  async getAbnormalLogs(params: {
    page: number
    pageSize: number
    userId?: number
    abnormalType?: string
  }) {
    const { page, pageSize, userId, abnormalType } = params
    const where: any = {}

    if (userId !== undefined) {
      where.userId = userId
    }
    if (abnormalType) {
      where.abnormalType = abnormalType
    }

    const { count, rows } = await PublishAbnormalLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createTime', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  }
}
