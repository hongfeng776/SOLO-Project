import { Creator } from '@models/index'
import { AppError } from '@utils/response'
import { getWithFallback, delCacheByPrefix } from '@utils/cache'
import { CacheKey, CacheTTL } from '@/enums/cache'
import { Op, fn, col } from 'sequelize'
import { notificationService } from './notification'

export const creatorService = {
  async list(params: { page: number; pageSize: number; keyword?: string; level?: number; qualificationStatus?: number }) {
    const { page, pageSize, keyword, level, qualificationStatus } = params
    const cacheKey = `${CacheKey.CREATOR_LIST}:${page}:${pageSize}:${keyword || ''}:${level ?? ''}:${qualificationStatus ?? ''}`
    return getWithFallback(
      cacheKey,
      async () => {
        const where: any = {}

        if (keyword) {
          where[Op.or] = [
            { name: { [Op.like]: `%${keyword}%` } },
            { contactName: { [Op.like]: `%${keyword}%` } }
          ]
        }
        if (level !== undefined) where.level = level
        if (qualificationStatus !== undefined) where.qualificationStatus = qualificationStatus

        const { count, rows } = await Creator.findAndCountAll({
          where,
          offset: (page - 1) * pageSize,
          limit: pageSize,
          order: [['create_time', 'DESC']]
        })

        return { list: rows, total: count, page, pageSize }
      },
      CacheTTL.MEDIUM
    )
  },

  async detail(id: number) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    return creator
  },

  async create(data: { name: string; avatar?: string; platform?: string; category?: string; contactName?: string; contactPhone?: string }) {
    const creator = await Creator.create({ ...data, followers: 0, likes: 0, level: 1, qualificationStatus: 0 } as any)
    delCacheByPrefix(CacheKey.CREATOR_LIST).catch(() => {})
    return { id: creator.id }
  },

  async update(id: number, data: Partial<{ name: string; avatar: string; platform: string; category: string; contactName: string; contactPhone: string; level: number }>) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    await creator.update(data)
    delCacheByPrefix(CacheKey.CREATOR_LIST).catch(() => {})
    return { id: creator.id }
  },

  async auditQualification(id: number, qualificationStatus: number, _rejectReason?: string) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    await creator.update({ qualificationStatus })
    delCacheByPrefix(CacheKey.CREATOR_LIST).catch(() => {})
    return { id: creator.id }
  },

  async remove(id: number) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    await creator.destroy()
    delCacheByPrefix(CacheKey.CREATOR_LIST).catch(() => {})
    return true
  },

  async updateQualification(id: number, status: number, rejectReason?: string) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    const updateData: any = { qualificationStatus: status }
    if (rejectReason) updateData.rejectReason = rejectReason
    await creator.update(updateData)

    if (status === 2) {
      await notificationService.create({
        userId: creator.id,
        type: 'system',
        title: '资质审核通过',
        content: '恭喜您，达人资质审核已通过！',
        relatedId: creator.id,
        relatedType: 'creator'
      })
    } else if (status === 3) {
      await notificationService.create({
        userId: creator.id,
        type: 'system',
        title: '资质审核未通过',
        content: `您的达人资质审核未通过，原因：${rejectReason || '请重新提交'}`,
        relatedId: creator.id,
        relatedType: 'creator'
      })
    }

    delCacheByPrefix(CacheKey.CREATOR_LIST).catch(() => {})
    return { id: creator.id }
  },

  async ban(id: number, days: number, reason?: string) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    await creator.update({ qualificationStatus: 3 })

    await notificationService.create({
      userId: creator.id,
      type: 'system',
      title: '账号封禁通知',
      content: `您的账号已被封禁${days}天，原因：${reason || '违反平台规定'}`,
      relatedId: creator.id,
      relatedType: 'creator'
    })

    delCacheByPrefix(CacheKey.CREATOR_LIST).catch(() => {})
    return { id: creator.id }
  },

  async unban(id: number) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    await creator.update({ qualificationStatus: 2 })

    await notificationService.create({
      userId: creator.id,
      type: 'system',
      title: '账号解封通知',
      content: '您的账号已解封，请遵守平台规定。',
      relatedId: creator.id,
      relatedType: 'creator'
    })

    delCacheByPrefix(CacheKey.CREATOR_LIST).catch(() => {})
    return { id: creator.id }
  },

  async getStats() {
    const total = await Creator.count()
    const level1 = await Creator.count({ where: { level: 1 } })
    const level2 = await Creator.count({ where: { level: 2 } })
    const level3 = await Creator.count({ where: { level: 3 } })
    const level4 = await Creator.count({ where: { level: 4 } })
    const level5 = await Creator.count({ where: { level: 5 } })

    const qualificationPending = await Creator.count({ where: { qualificationStatus: 1 } })
    const qualificationApproved = await Creator.count({ where: { qualificationStatus: 2 } })
    const qualificationRejected = await Creator.count({ where: { qualificationStatus: 3 } })

    const totalFollowersResult = await Creator.sum('followers')
    const totalFollowers = totalFollowersResult || 0

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayNew = await Creator.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    return {
      total,
      level1,
      level2,
      level3,
      level4,
      level5,
      qualificationPending,
      qualificationApproved,
      qualificationRejected,
      totalFollowers,
      todayNew
    }
  },

  async incrementFans(id: number, count: number = 1) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    await creator.increment('followers', { by: count })
    return true
  },

  async batchChangeStatus(ids: number[], status: number) {
    await Creator.update(
      { qualificationStatus: status },
      { where: { id: { [Op.in]: ids } } }
    )
    delCacheByPrefix(CacheKey.CREATOR_LIST).catch(() => {})
    return true
  },

  async getTrendData(days: number) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const results = await Creator.findAll({
      where: {
        createTime: { [Op.gte]: startDate }
      },
      attributes: [
        [fn('DATE', col('create_time')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE', col('create_time'))],
      order: [[fn('DATE', col('create_time')), 'ASC']],
      raw: true
    })

    return results.map((item: any) => ({
      date: item.date,
      count: item.count
    }))
  }
}
