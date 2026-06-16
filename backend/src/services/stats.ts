import { Note, Creator, Order, User, Comment } from '@models/index'
import { getWithFallback } from '@utils/cache'
import { CacheKey, CacheTTL } from '@/enums/cache'
import { Op, fn, col } from 'sequelize'

export const statsService = {
  async getOverview() {
    return getWithFallback(
      CacheKey.STATS_OVERVIEW,
      async () => {
        const noteCount = await Note.count()
        const creatorCount = await Creator.count()
        const orderCount = await Order.count()
        const userCount = await User.count()
        const commentCount = await Comment.count()

        const totalRevenueResult = await Order.sum('amount', { where: { status: 2 } })
        const totalRevenue = totalRevenueResult || 0

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const todayNote = await Note.count({
          where: { createTime: { [Op.gte]: todayStart } }
        })
        const todayCreator = await Creator.count({
          where: { createTime: { [Op.gte]: todayStart } }
        })
        const todayOrder = await Order.count({
          where: { createTime: { [Op.gte]: todayStart } }
        })
        const todayUser = await User.count({
          where: { createTime: { [Op.gte]: todayStart } }
        })

        const todayRevenueResult = await Order.sum('amount', {
          where: { createTime: { [Op.gte]: todayStart }, status: 2 }
        })
        const todayRevenue = todayRevenueResult || 0

        const publishedNote = await Note.count({ where: { status: 2 } })
        const pendingReviewNote = await Note.count({ where: { status: 1 } })

        return {
          noteCount,
          publishedNote,
          pendingReviewNote,
          creatorCount,
          orderCount,
          userCount,
          commentCount,
          totalRevenue,
          todayNote,
          todayCreator,
          todayOrder,
          todayUser,
          todayRevenue
        }
      },
      CacheTTL.ONE_MINUTE
    )
  },

  async getContentStats() {
    const total = await Note.count()
    const draft = await Note.count({ where: { status: 0 } })
    const pendingReview = await Note.count({ where: { status: 1 } })
    const published = await Note.count({ where: { status: 2 } })
    const rejected = await Note.count({ where: { status: 3 } })
    const offShelf = await Note.count({ where: { status: 4 } })

    const totalViewResult = await Note.sum('viewCount')
    const totalView = totalViewResult || 0

    const totalLikeResult = await Note.sum('likeCount')
    const totalLike = totalLikeResult || 0

    const totalCommentResult = await Note.sum('commentCount')
    const totalCommentCount = totalCommentResult || 0

    const totalShareResult = await Note.sum('shareCount')
    const totalShare = totalShareResult || 0

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayNew = await Note.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    const todayViewResult = await Note.sum('viewCount', {
      where: { createTime: { [Op.gte]: todayStart } }
    })
    const todayView = todayViewResult || 0

    return {
      total,
      draft,
      pendingReview,
      published,
      rejected,
      offShelf,
      totalView,
      totalLike,
      totalCommentCount,
      totalShare,
      todayNew,
      todayView
    }
  },

  async getCreatorStats() {
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

    const totalLikesResult = await Creator.sum('likes')
    const totalLikes = totalLikesResult || 0

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
      totalLikes,
      todayNew
    }
  },

  async getOrderStats() {
    const total = await Order.count()
    const pendingPayment = await Order.count({ where: { status: 0 } })
    const processing = await Order.count({ where: { status: 1 } })
    const completed = await Order.count({ where: { status: 2 } })
    const cancelled = await Order.count({ where: { status: 3 } })
    const refunded = await Order.count({ where: { status: 4 } })

    const totalAmountResult = await Order.sum('amount', { where: { status: 2 } })
    const totalAmount = totalAmountResult || 0

    const pendingAmountResult = await Order.sum('amount', { where: { status: 1 } })
    const pendingAmount = pendingAmountResult || 0

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayNew = await Order.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    const todayAmountResult = await Order.sum('amount', {
      where: { createTime: { [Op.gte]: todayStart }, status: 2 }
    })
    const todayAmount = todayAmountResult || 0

    return {
      total,
      pendingPayment,
      processing,
      completed,
      cancelled,
      refunded,
      totalAmount,
      pendingAmount,
      todayNew,
      todayAmount
    }
  },

  async getTrendStats(days: number) {
    const cacheKey = `${CacheKey.STATS_TREND}${days}`
    return getWithFallback(
      cacheKey,
      async () => {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days + 1)
        startDate.setHours(0, 0, 0, 0)

        const noteResults = await Note.findAll({
          where: {
            createTime: { [Op.gte]: startDate },
            status: 2
          },
          attributes: [
            [fn('DATE', col('create_time')), 'date'],
            [fn('COUNT', col('id')), 'noteCount']
          ],
          group: [fn('DATE', col('create_time'))],
          raw: true
        })

        const userResults = await User.findAll({
          where: {
            createTime: { [Op.gte]: startDate }
          },
          attributes: [
            [fn('DATE', col('create_time')), 'date'],
            [fn('COUNT', col('id')), 'userCount']
          ],
          group: [fn('DATE', col('create_time'))],
          raw: true
        })

        const orderResults = await Order.findAll({
          where: {
            createTime: { [Op.gte]: startDate }
          },
          attributes: [
            [fn('DATE', col('create_time')), 'date'],
            [fn('COUNT', col('id')), 'orderCount'],
            [fn('SUM', col('amount')), 'revenue']
          ],
          group: [fn('DATE', col('create_time'))],
          raw: true
        })

        const noteMap = new Map()
        const userMap = new Map()
        const orderMap = new Map()

        noteResults.forEach((item: any) => noteMap.set(item.date, item.noteCount))
        userResults.forEach((item: any) => userMap.set(item.date, item.userCount))
        orderResults.forEach((item: any) => {
          orderMap.set(item.date, { count: item.orderCount, revenue: item.revenue || 0 })
        })

        const result = []
        for (let i = 0; i < days; i++) {
          const d = new Date(startDate)
          d.setDate(d.getDate() + i)
          const dateStr = d.toISOString().split('T')[0]

          result.push({
            date: dateStr,
            noteCount: noteMap.get(dateStr) || 0,
            userCount: userMap.get(dateStr) || 0,
            orderCount: orderMap.get(dateStr)?.count || 0,
            revenue: orderMap.get(dateStr)?.revenue || 0
          })
        }

        return result
      },
      CacheTTL.FIVE_MINUTES
    )
  }
}
