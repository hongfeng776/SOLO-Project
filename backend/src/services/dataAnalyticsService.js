const { ResourceDataSnapshot, DataQueryLog, Resource, sequelize } = require('../models')
const { Op } = require('sequelize')
const { getPagination } = require('../utils/common')
const ApiError = require('../utils/apiError')

const MAX_DATE_RANGE_DAYS = 90
const HOTNESS_WEIGHTS = { views: 1, likes: 10, favorites: 15, shares: 20, comments: 8 }

class DataAnalyticsService {
  validateQueryParams(params) {
    const errors = []

    if (params.startTime && params.endTime) {
      const start = new Date(params.startTime)
      const end = new Date(params.endTime)
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)

      if (diffDays > MAX_DATE_RANGE_DAYS) {
        errors.push(`查询时段不能超过${MAX_DATE_RANGE_DAYS}天，当前跨度${Math.ceil(diffDays)}天`)
      }
      if (start > end) {
        errors.push('开始时间不能晚于结束时间')
      }
    }

    if (params.minScore !== undefined && params.maxScore !== undefined) {
      if (Number(params.minScore) > Number(params.maxScore)) {
        errors.push('最低分数不能大于最高分数')
      }
    }

    if (params.qualityLevel && params.excludeQualityLevel) {
      if (params.qualityLevel === params.excludeQualityLevel) {
        errors.push('筛选等级和排除等级不能相同')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  async preValidateQuery(params) {
    const validation = this.validateQueryParams(params)
    const warnings = []

    if (params.startTime && params.endTime) {
      const start = new Date(params.startTime)
      const end = new Date(params.endTime)
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays > 60) {
        warnings.push('查询时段超过60天，数据量可能较大，查询可能较慢')
      }
    }

    return {
      canQuery: validation.valid,
      errors: validation.errors,
      warnings
    }
  }

  async getDataList(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      fileType,
      qualityLevel,
      visibility,
      status,
      categoryId,
      authorId,
      startTime,
      endTime,
      minScore,
      maxScore,
      sortBy = 'hotnessScore',
      sortOrder = 'desc',
      includeDeleted = false,
      includeHidden = false
    } = params

    const validation = this.validateQueryParams(params)
    if (!validation.valid) {
      throw new ApiError(validation.errors.join('；'), 400)
    }

    const where = {}

    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { materialCode: { [Op.like]: `%${keyword}%` } }
      ]
    }
    if (fileType) where.fileType = fileType
    if (qualityLevel) where.qualityLevel = qualityLevel
    if (visibility) where.visibility = visibility
    if (categoryId) where.categoryId = categoryId
    if (authorId) where.authorId = authorId

    if (minScore !== undefined || maxScore !== undefined) {
      where.hotnessScore = {}
      if (minScore !== undefined) where.hotnessScore[Op.gte] = Number(minScore)
      if (maxScore !== undefined) where.hotnessScore[Op.lte] = Number(maxScore)
    }

    if (!includeDeleted && !includeHidden) {
      where.status = { [Op.notIn]: ['offline', 'draft'] }
    } else if (!includeDeleted) {
      where.status = { [Op.ne]: 'offline' }
    } else if (!includeHidden) {
      where.status = { [Op.ne]: 'draft' }
    }

    if (startTime || endTime) {
      where.createdAt = {}
      if (startTime) where.createdAt[Op.gte] = startTime
      if (endTime) where.createdAt[Op.lte] = endTime
    }

    const { limit, offset } = getPagination(page, pageSize)

    const order = []
    if (sortBy && sortOrder) {
      order.push([sortBy, sortOrder])
    }
    order.push(['id', 'desc'])

    const { count, rows } = await Resource.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        { association: 'category', attributes: ['id', 'name'] },
        { association: 'author', attributes: ['id', 'username', 'nickname', 'status'] }
      ]
    })

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  }

  calculateHotness(resource) {
    const views = Number(resource.viewCount || 0)
    const likes = Number(resource.likeCount || 0)
    const favorites = Number(resource.favoriteCount || 0)
    const shares = Number(resource.shareCount || 0)
    const comments = Number(resource.commentCount || 0)

    return (
      views * HOTNESS_WEIGHTS.views +
      likes * HOTNESS_WEIGHTS.likes +
      favorites * HOTNESS_WEIGHTS.favorites +
      shares * HOTNESS_WEIGHTS.shares +
      comments * HOTNESS_WEIGHTS.comments
    )
  }

  async getResourceDataDetail(resourceId) {
    const resource = await Resource.findByPk(resourceId, {
      include: [
        { association: 'category', attributes: ['id', 'name'] },
        { association: 'author', attributes: ['id', 'username', 'nickname', 'status'] }
      ]
    })
    if (!resource) {
      throw new ApiError('作品不存在', 404)
    }

    const hotnessScore = this.calculateHotness(resource)

    const snapshots = await ResourceDataSnapshot.findAll({
      where: { resourceId },
      order: [['snapshotDate', 'desc']],
      limit: 30
    })

    const integrityIssues = this._checkDataIntegrity(resource, snapshots)

    return {
      resource,
      currentData: {
        viewCount: resource.viewCount || 0,
        likeCount: resource.likeCount || 0,
        favoriteCount: resource.favoriteCount || 0,
        shareCount: resource.shareCount || 0,
        commentCount: resource.commentCount || 0,
        downloadCount: resource.downloadCount || 0,
        hotnessScore
      },
      dailySnapshots: snapshots,
      integrityCheck: integrityIssues,
      dataIntegrityStatus: resource.dataIntegrityStatus
    }
  }

  _checkDataIntegrity(resource, snapshots) {
    const issues = []

    if (Number(resource.viewCount || 0) < 0) {
      issues.push({ type: 'data_tamper', severity: 'high', description: '浏览量为负数，疑似数据篡改' })
    }
    if (Number(resource.likeCount || 0) > Number(resource.viewCount || 0)) {
      issues.push({ type: 'data_anomaly', severity: 'medium', description: '点赞数超过浏览量，数据异常' })
    }
    if (Number(resource.favoriteCount || 0) > Number(resource.likeCount || 0) * 5) {
      issues.push({ type: 'data_anomaly', severity: 'low', description: '收藏数与点赞数比例异常' })
    }

    if (snapshots.length >= 2) {
      const latest = snapshots[0]
      const previous = snapshots[1]
      const viewJump = Number(latest.viewIncrement || 0)
      const avgView = snapshots.slice(0, 7).reduce((s, sn) => s + Number(sn.viewIncrement || 0), 0) / Math.min(7, snapshots.length)
      if (avgView > 0 && viewJump > avgView * 10) {
        issues.push({ type: 'data_spike', severity: 'high', description: `浏览量日增量${viewJump}，偏离近7日均值${avgView.toFixed(0)}超过10倍` })
      }
    }

    if (snapshots.length >= 7) {
      const recentTotal = snapshots.slice(0, 7).reduce((s, sn) => s + Number(sn.viewIncrement || 0), 0)
      if (recentTotal === 0 && Number(resource.viewCount || 0) > 1000) {
        issues.push({ type: 'data_missing', severity: 'medium', description: '近7日无浏览增量数据，疑似数据缺失' })
      }
    }

    return {
      hasIssues: issues.length > 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(20, 100 - issues.reduce((p, i) => p + (i.severity === 'high' ? 30 : i.severity === 'medium' ? 15 : 5), 0))
    }
  }

  async batchSummary(resourceIds, options = {}) {
    const { operatorId, operatorName, operatorRole, ip, userAgent } = options

    const resources = await Resource.findAll({
      where: { id: { [Op.in]: resourceIds } },
      include: [
        { association: 'category', attributes: ['id', 'name'] },
        { association: 'author', attributes: ['id', 'username', 'nickname'] }
      ]
    })

    const grouped = {
      excellent: [],
      good: [],
      normal: [],
      low_quality: [],
      violation: []
    }

    const statusGrouped = {
      published: [],
      approved: [],
      pending: [],
      rejected: [],
      offline: [],
      draft: []
    }

    let totalViews = 0
    let totalLikes = 0
    let totalFavorites = 0
    let totalShares = 0
    let totalComments = 0
    let totalDownloads = 0
    let totalHotness = 0
    let anomalyCount = 0

    for (const r of resources) {
      const item = {
        id: r.id,
        title: r.title,
        qualityLevel: r.qualityLevel,
        status: r.status,
        viewCount: Number(r.viewCount || 0),
        likeCount: Number(r.likeCount || 0),
        favoriteCount: Number(r.favoriteCount || 0),
        shareCount: Number(r.shareCount || 0),
        commentCount: Number(r.commentCount || 0),
        downloadCount: Number(r.downloadCount || 0),
        hotnessScore: this.calculateHotness(r)
      }

      if (grouped[r.qualityLevel]) grouped[r.qualityLevel].push(item)
      if (statusGrouped[r.status]) statusGrouped[r.status].push(item)

      totalViews += item.viewCount
      totalLikes += item.likeCount
      totalFavorites += item.favoriteCount
      totalShares += item.shareCount
      totalComments += item.commentCount
      totalDownloads += item.downloadCount
      totalHotness += item.hotnessScore

      if (r.dataIntegrityStatus !== 'normal') anomalyCount++
    }

    const summary = {
      total: resources.length,
      totalViews,
      totalLikes,
      totalFavorites,
      totalShares,
      totalComments,
      totalDownloads,
      totalHotness,
      avgViews: resources.length > 0 ? (totalViews / resources.length).toFixed(1) : 0,
      avgLikes: resources.length > 0 ? (totalLikes / resources.length).toFixed(1) : 0,
      avgHotness: resources.length > 0 ? (totalHotness / resources.length).toFixed(1) : 0,
      anomalyCount,
      qualityDistribution: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])),
      statusDistribution: Object.fromEntries(Object.entries(statusGrouped).map(([k, v]) => [k, v.length])),
      topByViews: [...resources].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 10).map(r => ({ id: r.id, title: r.title, value: r.viewCount })),
      topByLikes: [...resources].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 10).map(r => ({ id: r.id, title: r.title, value: r.likeCount })),
      topByHotness: [...resources].sort((a, b) => this.calculateHotness(b) - this.calculateHotness(a)).slice(0, 10).map(r => ({ id: r.id, title: r.title, value: this.calculateHotness(r) }))
    }

    await DataQueryLog.create({
      queryType: 'batch',
      operatorId,
      operatorName,
      operatorRole,
      queryParams: { resourceIds },
      resultCount: resources.length,
      affectedResourceIds: resourceIds,
      summaryData: summary,
      anomalyFound: anomalyCount > 0,
      anomalyDetails: anomalyCount > 0 ? { count: anomalyCount } : null,
      ip,
      userAgent
    })

    return summary
  }

  async getDataOverview() {
    const totalResources = await Resource.count()
    const totalViews = await Resource.sum('viewCount') || 0
    const totalLikes = await Resource.sum('likeCount') || 0
    const totalFavorites = await Resource.sum('favoriteCount') || 0
    const totalShares = await Resource.sum('shareCount') || 0
    const totalComments = await Resource.sum('commentCount') || 0

    const abnormalCount = await Resource.count({
      where: { dataIntegrityStatus: { [Op.in]: ['suspected', 'abnormal'] } }
    })

    const qualityDistribution = {}
    const levels = ['excellent', 'good', 'normal', 'low_quality', 'violation']
    for (const level of levels) {
      qualityDistribution[level] = await Resource.count({ where: { qualityLevel: level } })
    }

    const topByHotness = await Resource.findAll({
      order: [['hotnessScore', 'desc']],
      limit: 10,
      attributes: ['id', 'title', 'hotnessScore', 'viewCount', 'likeCount']
    })

    const recentSnapshots = await ResourceDataSnapshot.count({
      where: {
        snapshotDate: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7))
        }
      }
    })

    const recentAnomalies = await ResourceDataSnapshot.count({
      where: {
        isAnomaly: true,
        snapshotDate: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7))
        }
      }
    })

    return {
      totalResources,
      totalViews,
      totalLikes,
      totalFavorites,
      totalShares,
      totalComments,
      abnormalCount,
      qualityDistribution,
      topByHotness,
      recentSnapshots,
      recentAnomalies
    }
  }

  async traceResourceData(resourceId, params = {}) {
    const { days = 30 } = params

    const resource = await Resource.findByPk(resourceId)
    if (!resource) {
      throw new ApiError('作品不存在', 404)
    }

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const snapshots = await ResourceDataSnapshot.findAll({
      where: {
        resourceId,
        snapshotDate: { [Op.between]: [startDate, endDate] }
      },
      order: [['snapshotDate', 'asc']]
    })

    const integrityCheck = this._checkDataIntegrity(resource, snapshots)

    const dailyIncrements = snapshots.map(s => ({
      date: s.snapshotDate,
      viewIncrement: Number(s.viewIncrement || 0),
      likeIncrement: Number(s.likeIncrement || 0),
      favoriteIncrement: Number(s.favoriteIncrement || 0),
      shareIncrement: Number(s.shareIncrement || 0),
      commentIncrement: Number(s.commentIncrement || 0),
      downloadIncrement: Number(s.downloadIncrement || 0),
      hotnessScore: Number(s.hotnessScore || 0),
      hotnessRank: Number(s.hotnessRank || 0),
      isAnomaly: s.isAnomaly,
      trafficSources: s.trafficSources
    }))

    const totalIncrements = {
      views: dailyIncrements.reduce((s, d) => s + d.viewIncrement, 0),
      likes: dailyIncrements.reduce((s, d) => s + d.likeIncrement, 0),
      favorites: dailyIncrements.reduce((s, d) => s + d.favoriteIncrement, 0),
      shares: dailyIncrements.reduce((s, d) => s + d.shareIncrement, 0),
      comments: dailyIncrements.reduce((s, d) => s + d.commentIncrement, 0)
    }

    const avgDaily = {
      views: snapshots.length > 0 ? (totalIncrements.views / snapshots.length).toFixed(1) : 0,
      likes: snapshots.length > 0 ? (totalIncrements.likes / snapshots.length).toFixed(1) : 0,
      favorites: snapshots.length > 0 ? (totalIncrements.favorites / snapshots.length).toFixed(1) : 0,
      shares: snapshots.length > 0 ? (totalIncrements.shares / snapshots.length).toFixed(1) : 0,
      comments: snapshots.length > 0 ? (totalIncrements.comments / snapshots.length).toFixed(1) : 0
    }

    const peakDay = dailyIncrements.reduce(
      (max, d) => (d.viewIncrement > (max?.viewIncrement || 0) ? d : max),
      dailyIncrements[0] || null
    )

    return {
      resource: { id: resource.id, title: resource.title, qualityLevel: resource.qualityLevel },
      currentData: {
        viewCount: resource.viewCount || 0,
        likeCount: resource.likeCount || 0,
        favoriteCount: resource.favoriteCount || 0,
        shareCount: resource.shareCount || 0,
        commentCount: resource.commentCount || 0,
        downloadCount: resource.downloadCount || 0
      },
      dailyIncrements,
      totalIncrements,
      avgDaily,
      peakDay,
      integrityCheck,
      snapshotDays: snapshots.length
    }
  }

  async getQueryLogs(params = {}) {
    const { page = 1, pageSize = 20, queryType, operatorId, startTime, endTime } = params
    const where = {}

    if (queryType) where.queryType = queryType
    if (operatorId) where.operatorId = operatorId
    if (startTime || endTime) {
      where.createdAt = {}
      if (startTime) where.createdAt[Op.gte] = startTime
      if (endTime) where.createdAt[Op.lte] = endTime
    }

    const { limit, offset } = getPagination(page, pageSize)

    const { count, rows } = await DataQueryLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'desc']],
      include: [{ association: 'operator', attributes: ['id', 'username', 'nickname'] }]
    })

    return { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) }
  }
}

module.exports = new DataAnalyticsService()
