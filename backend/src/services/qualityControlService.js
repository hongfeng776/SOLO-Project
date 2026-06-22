const {
  QualityAssessmentLog,
  QualityReviewLog,
  Resource,
  User,
  sequelize
} = require('../models')
const { Op } = require('sequelize')
const { getPagination } = require('../utils/common')
const ApiError = require('../utils/apiError')

const QUALITY_LEVELS = ['excellent', 'good', 'normal', 'low_quality', 'violation']

const QUALITY_THRESHOLDS = {
  excellent: 85,
  good: 70,
  normal: 50,
  low_quality: 30,
  violation: 0
}

const MIN_RESOLUTION = {
  image: { width: 1280, height: 720 },
  video: { width: 1920, height: 1080 }
}

const VIOLATION_FLAGS = ['低俗', '色情', '暴力', '违规', '侵权', '抄袭', '政治敏感']
const LOW_QUALITY_FLAGS = ['模糊', '低分辨率', '内容空洞', '重复', '无意义', '广告']

class QualityControlService {
  _scoreToLevel(score) {
    const s = Number(score)
    if (s >= QUALITY_THRESHOLDS.excellent) return 'excellent'
    if (s >= QUALITY_THRESHOLDS.good) return 'good'
    if (s >= QUALITY_THRESHOLDS.normal) return 'normal'
    if (s >= QUALITY_THRESHOLDS.low_quality) return 'low_quality'
    return 'violation'
  }

  async _evaluateResolution(resource) {
    const width = resource.width || 0
    const height = resource.height || 0
    const fileSize = resource.fileSize || 0
    const resolution = resource.resolution || ''

    let score = 40

    const minRes = MIN_RESOLUTION[resource.fileType] || MIN_RESOLUTION.image
    if (width >= minRes.width * 2 && height >= minRes.height * 2) {
      score = 100
    } else if (width >= minRes.width && height >= minRes.height) {
      score = 85
    } else if (width >= minRes.width * 0.8 && height >= minRes.height * 0.8) {
      score = 70
    } else if (width >= minRes.width * 0.5 && height >= minRes.height * 0.5) {
      score = 55
    } else if (width > 0 && height > 0) {
      score = 35
    }

    if (resource.fileType === 'image') {
      if (fileSize > 10 * 1024 * 1024) score += 5
      else if (fileSize > 2 * 1024 * 1024) score += 3
    } else if (resource.fileType === 'video') {
      if (fileSize > 500 * 1024 * 1024) score += 5
      else if (fileSize > 100 * 1024 * 1024) score += 3
    }

    return Math.min(100, Math.max(0, score))
  }

  async _evaluateContent(resource) {
    const viewCount = resource.viewCount || 0
    const likeCount = resource.likeCount || 0
    const downloadCount = resource.downloadCount || 0
    const title = resource.title || ''
    const description = resource.description || ''
    const tags = Array.isArray(resource.tags) ? resource.tags : []

    let score = 50

    if (title.length > 10) score += 5
    if (title.length > 30) score += 3
    if (description && description.length > 50) score += 5
    if (description && description.length > 200) score += 3
    if (tags.length >= 3) score += 3
    if (tags.length >= 5) score += 2

    if (resource.fileType === 'image') {
      if (viewCount > 50000) score += 15
      else if (viewCount > 10000) score += 12
      else if (viewCount > 1000) score += 8
      else if (viewCount > 100) score += 4

      if (likeCount > 2000) score += 12
      else if (likeCount > 500) score += 8
      else if (likeCount > 50) score += 4

      if (downloadCount > 1000) score += 10
      else if (downloadCount > 100) score += 6
      else if (downloadCount > 10) score += 3
    } else if (resource.fileType === 'video') {
      const duration = resource.duration || 0
      if (duration > 600) score += 8
      else if (duration > 120) score += 5
      else if (duration > 30) score += 3

      if (viewCount > 100000) score += 15
      else if (viewCount > 10000) score += 12
      else if (viewCount > 1000) score += 7

      if (likeCount > 5000) score += 12
      else if (likeCount > 1000) score += 8
      else if (likeCount > 100) score += 4
    }

    return Math.min(100, Math.max(0, score))
  }

  async _evaluateComposition(resource) {
    let score = 60

    const width = resource.width || 0
    const height = resource.height || 0

    if (width > 0 && height > 0) {
      const ratio = Math.max(width, height) / Math.min(width, height)
      if (ratio >= 1.5 && ratio <= 2.0) {
        score += 15
      } else if (ratio >= 1.2 && ratio <= 2.5) {
        score += 10
      } else {
        score += 5
      }
    }

    if (resource.coverUrl) score += 10
    if (resource.tags && resource.tags.length > 0) score += 5
    if (resource.materialCode) score += 5
    if (resource.categoryId) score += 5

    return Math.min(100, Math.max(0, score))
  }

  async _evaluateCompliance(resource) {
    let score = 80

    const title = (resource.title || '').toLowerCase()
    const description = (resource.description || '').toLowerCase()

    const flags = []

    if (resource.violationCount > 0) {
      score -= Math.min(resource.violationCount * 20, 60)
      flags.push(`存在${resource.violationCount}次违规记录`)
    }

    if (resource.isBlocked) {
      score = 0
      flags.push('作品已被风控拦截')
    }

    if (resource.status === 'rejected') {
      score -= 30
      flags.push('审核未通过')
    }

    for (const vf of VIOLATION_FLAGS) {
      if (title.includes(vf.toLowerCase()) || description.includes(vf.toLowerCase())) {
        score -= 15
        flags.push(`检测到${vf}关键词`)
      }
    }

    for (const lqf of LOW_QUALITY_FLAGS) {
      if (title.includes(lqf.toLowerCase()) || description.includes(lqf.toLowerCase())) {
        score -= 10
        if (!flags.includes('低质关键词')) {
          flags.push('低质关键词')
        }
      }
    }

    return { score: Math.min(100, Math.max(0, score)), flags }
  }

  async _evaluateAuthorHistory(authorId) {
    if (!authorId) return 50

    const authorResources = await Resource.findAll({
      where: { authorId, status: { [Op.in]: ['approved', 'published'] } },
      limit: 20,
      order: [['createdAt', 'desc']]
    })

    if (authorResources.length === 0) return 50

    let totalScore = 0
    let count = 0

    for (const r of authorResources) {
      const qs = Number(r.qualityScore || 0)
      if (qs > 0) {
        totalScore += qs
        count++
      }
    }

    if (count === 0) return 50

    const avg = totalScore / count
    let bonus = 0

    if (authorResources.length >= 50) bonus += 10
    else if (authorResources.length >= 20) bonus += 5

    return Math.min(100, Math.max(0, avg + bonus))
  }

  async assessResourceQuality(resourceId, options = {}) {
    const { assessType = 'auto', operatorId, operatorName, operatorRole, ip, userAgent, remark } = options

    const resource = await Resource.findByPk(resourceId)
    if (!resource) {
      throw new ApiError('作品不存在', 404)
    }

    const resolutionScore = await this._evaluateResolution(resource)
    const contentScore = await this._evaluateContent(resource)
    const compositionScore = await this._evaluateComposition(resource)
    const { score: complianceScore, flags: complianceFlags } = await this._evaluateCompliance(resource)
    const authorScore = await this._evaluateAuthorHistory(resource.authorId)

    const overallScore = Math.round(
      resolutionScore * 0.25 +
        contentScore * 0.25 +
        compositionScore * 0.15 +
        complianceScore * 0.25 +
        authorScore * 0.1
    )

    const newLevel = this._scoreToLevel(overallScore)
    const flags = [...complianceFlags]

    if (resolutionScore < 50) flags.push('画质偏低')
    if (contentScore < 50) flags.push('内容质量偏低')
    if (compositionScore < 50) flags.push('构图欠佳')

    const transaction = await sequelize.transaction()

    try {
      const beforeSnapshot = resource.toJSON()

      const updatedResource = await resource.update(
        {
          qualityLevel: newLevel,
          qualityScore: overallScore,
          resolutionQualityScore: resolutionScore,
          contentQualityScore: contentScore,
          compositionScore,
          complianceQualityScore: complianceScore,
          qualityAssessedAt: new Date(),
          qualityFlags: flags.length > 0 ? { items: flags } : null,
          qualityReviewStatus:
            newLevel === 'low_quality' || newLevel === 'violation' ? 'pending' : 'none'
        },
        { transaction }
      )

      const log = await QualityAssessmentLog.create(
        {
          resourceId,
          resourceTitle: resource.title,
          assessType,
          oldQualityLevel: beforeSnapshot.qualityLevel || 'normal',
          newQualityLevel: newLevel,
          oldQualityScore: beforeSnapshot.qualityScore || 0,
          newQualityScore: overallScore,
          resolutionScore,
          contentScore,
          compositionScore,
          complianceScore,
          authorQualityScore: authorScore,
          qualityFlags: flags.length > 0 ? { items: flags } : null,
          assessBasis: {
            resolution: { score: resolutionScore, weight: 0.25 },
            content: { score: contentScore, weight: 0.25 },
            composition: { score: compositionScore, weight: 0.15 },
            compliance: { score: complianceScore, weight: 0.25 },
            authorHistory: { score: authorScore, weight: 0.1 },
            flags
          },
          operatorId,
          operatorName,
          operatorRole,
          remark,
          ip,
          userAgent,
          beforeSnapshot,
          afterSnapshot: updatedResource.toJSON()
        },
        { transaction }
      )

      await transaction.commit()

      return {
        resource: updatedResource,
        assessmentLog: log,
        scores: {
          resolution: resolutionScore,
          content: contentScore,
          composition: compositionScore,
          compliance: complianceScore,
          author: authorScore,
          overall: overallScore
        },
        level: newLevel,
        flags,
        needsReview: newLevel === 'low_quality' || newLevel === 'violation'
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async batchAssessResources(resourceIds, options = {}) {
    const results = {
      successIds: [],
      failedItems: [],
      excellent: [],
      good: [],
      normal: [],
      low_quality: [],
      violation: [],
      total: resourceIds.length,
      successCount: 0,
      failedCount: 0
    }

    const resources = await Resource.findAll({
      where: { id: { [Op.in]: resourceIds } }
    })

    const resourceMap = new Map(resources.map(r => [r.id, r]))

    for (const id of resourceIds) {
      const resource = resourceMap.get(id)
      if (!resource) {
        results.failedItems.push({ id, title: '', reason: '作品不存在' })
        results.failedCount++
        continue
      }

      try {
        const result = await this.assessResourceQuality(id, {
          ...options,
          assessType: 'batch'
        })

        results.successIds.push(id)
        results.successCount++
        const level = result.level
        if (results[level]) {
          results[level].push({
            id,
            title: resource.title,
            score: result.scores.overall
          })
        }
      } catch (error) {
        results.failedItems.push({ id, title: resource.title, reason: error.message })
        results.failedCount++
      }
    }

    return results
  }

  async reviewResource(resourceId, reviewResult, options = {}) {
    const {
      newLevel,
      reviewReason,
      reviewerId,
      reviewerName,
      reviewerRole,
      lockReason,
      ruleOptimizationNote,
      ip,
      userAgent
    } = options

    const resource = await Resource.findByPk(resourceId)
    if (!resource) {
      throw new ApiError('作品不存在', 404)
    }

    if (resource.qualityReviewStatus === 'locked') {
      throw new ApiError('该作品质量状态已锁定，无法复核', 400)
    }

    const transaction = await sequelize.transaction()

    try {
      const beforeSnapshot = resource.toJSON()

      const consistencyScore = await this._calcConsistencyScore(resource)
      let misjudgmentFound = false
      let omissionsFound = false

      let updateData = {
        qualityReviewStatus: reviewResult
      }

      if (reviewResult === 'approved') {
        if (newLevel && QUALITY_LEVELS.includes(newLevel)) {
          updateData.qualityLevel = newLevel
        }
        updateData.qualityLockReason = null
        misjudgmentFound = resource.qualityLevel === 'low_quality' || resource.qualityLevel === 'violation'
      } else if (reviewResult === 'rejected') {
        updateData.qualityLevel = 'low_quality'
        omissionsFound = resource.qualityLevel === 'normal' || resource.qualityLevel === 'good'
      } else if (reviewResult === 'locked') {
        updateData.qualityLockReason = lockReason || '复核锁定'
      }

      const updatedResource = await resource.update(updateData, { transaction })

      const reviewBasis = {
        consistencyScore,
        originalLevel: beforeSnapshot.qualityLevel,
        originalScore: beforeSnapshot.qualityScore,
        dimensions: {
          resolution: beforeSnapshot.resolutionQualityScore,
          content: beforeSnapshot.contentQualityScore,
          composition: beforeSnapshot.compositionScore,
          compliance: beforeSnapshot.complianceQualityScore
        }
      }

      const reviewLog = await QualityReviewLog.create(
        {
          resourceId,
          resourceTitle: resource.title,
          oldQualityLevel: beforeSnapshot.qualityLevel,
          newQualityLevel: newLevel || updateData.qualityLevel || beforeSnapshot.qualityLevel,
          reviewResult,
          reviewReason,
          reviewBasis,
          reviewerId,
          reviewerName,
          reviewerRole,
          consistencyScore,
          misjudgmentFound,
          omissionsFound,
          ruleOptimizationNote,
          ip,
          userAgent,
          reviewedAt: new Date()
        },
        { transaction }
      )

      if (misjudgmentFound || omissionsFound) {
        await QualityAssessmentLog.update(
          {
            isMisjudgment: misjudgmentFound,
            misjudgmentNote: reviewReason
          },
          {
            where: { resourceId },
            order: [['createdAt', 'DESC']],
            limit: 1,
            transaction
          }
        )
      }

      await transaction.commit()

      return {
        resource: updatedResource,
        reviewLog,
        misjudgmentFound,
        omissionsFound,
        consistencyScore,
        message:
          reviewResult === 'approved'
            ? '复核通过，作品已恢复正常流量'
            : reviewResult === 'rejected'
            ? '复核不通过，作品状态已锁定为低质'
            : '作品质量状态已锁定'
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async _calcConsistencyScore(resource) {
    let score = 80

    const expectedLevel = this._scoreToLevel(resource.qualityScore || 0)
    if (expectedLevel === resource.qualityLevel) {
      score += 20
    } else {
      const levelDiff = Math.abs(QUALITY_LEVELS.indexOf(expectedLevel) - QUALITY_LEVELS.indexOf(resource.qualityLevel))
      score -= Math.min(levelDiff * 10, 30)
    }

    return Math.min(100, Math.max(0, score))
  }

  async getQualityList(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      qualityLevel,
      qualityReviewStatus,
      fileType,
      categoryId,
      authorId,
      minScore,
      maxScore,
      needsReview = false,
      hasViolation = false,
      sortBy = 'qualityAssessedAt',
      sortOrder = 'desc'
    } = params

    const where = {}

    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { materialCode: { [Op.like]: `%${keyword}%` } }
      ]
    }
    if (qualityLevel) where.qualityLevel = qualityLevel
    if (qualityReviewStatus) where.qualityReviewStatus = qualityReviewStatus
    if (fileType) where.fileType = fileType
    if (categoryId) where.categoryId = categoryId
    if (authorId) where.authorId = authorId

    if (minScore !== undefined || maxScore !== undefined) {
      where.qualityScore = {}
      if (minScore !== undefined) where.qualityScore[Op.gte] = Number(minScore)
      if (maxScore !== undefined) where.qualityScore[Op.lte] = Number(maxScore)
    }

    if (needsReview) {
      where.qualityReviewStatus = { [Op.in]: ['pending', 'rejected'] }
    }

    if (hasViolation) {
      where.violationCount = { [Op.gt]: 0 }
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

  async getAssessmentLogs(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      resourceId,
      assessType,
      newQualityLevel,
      operatorId,
      startTime,
      endTime,
      keyword,
      misjudgmentOnly = false
    } = params

    const where = {}

    if (resourceId) where.resourceId = resourceId
    if (assessType) where.assessType = assessType
    if (newQualityLevel) where.newQualityLevel = newQualityLevel
    if (operatorId) where.operatorId = operatorId
    if (misjudgmentOnly) where.isMisjudgment = true

    if (startTime || endTime) {
      where.createdAt = {}
      if (startTime) where.createdAt[Op.gte] = startTime
      if (endTime) where.createdAt[Op.lte] = endTime
    }

    if (keyword) {
      where[Op.or] = [
        { resourceTitle: { [Op.like]: `%${keyword}%` } },
        { operatorName: { [Op.like]: `%${keyword}%` } }
      ]
    }

    const { limit, offset } = getPagination(page, pageSize)

    const { count, rows } = await QualityAssessmentLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'desc'], ['id', 'desc']],
      include: [
        { association: 'resource', attributes: ['id', 'title', 'qualityLevel', 'qualityScore'] }
      ]
    })

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  }

  async getReviewLogs(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      resourceId,
      reviewResult,
      reviewerId,
      startTime,
      endTime,
      keyword,
      misjudgmentOnly = false,
      omissionsOnly = false
    } = params

    const where = {}

    if (resourceId) where.resourceId = resourceId
    if (reviewResult) where.reviewResult = reviewResult
    if (reviewerId) where.reviewerId = reviewerId
    if (misjudgmentOnly) where.misjudgmentFound = true
    if (omissionsOnly) where.omissionsFound = true

    if (startTime || endTime) {
      where.createdAt = {}
      if (startTime) where.createdAt[Op.gte] = startTime
      if (endTime) where.createdAt[Op.lte] = endTime
    }

    if (keyword) {
      where[Op.or] = [
        { resourceTitle: { [Op.like]: `%${keyword}%` } },
        { reviewerName: { [Op.like]: `%${keyword}%` } }
      ]
    }

    const { limit, offset } = getPagination(page, pageSize)

    const { count, rows } = await QualityReviewLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'desc'], ['id', 'desc']],
      include: [
        { association: 'resource', attributes: ['id', 'title', 'qualityLevel'] },
        { association: 'reviewer', attributes: ['id', 'username', 'nickname'] }
      ]
    })

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  }

  async getResourceQualityDetail(resourceId) {
    const resource = await Resource.findByPk(resourceId, {
      include: [
        { association: 'category', attributes: ['id', 'name'] },
        { association: 'author', attributes: ['id', 'username', 'nickname', 'status'] }
      ]
    })

    if (!resource) {
      throw new ApiError('作品不存在', 404)
    }

    const assessmentLogs = await QualityAssessmentLog.findAll({
      where: { resourceId },
      order: [['createdAt', 'desc']],
      limit: 10
    })

    const reviewLogs = await QualityReviewLog.findAll({
      where: { resourceId },
      order: [['createdAt', 'desc']],
      limit: 10
    })

    const consistency = await this._checkQualityConsistency(resource, assessmentLogs)

    return {
      resource,
      assessmentLogs,
      reviewLogs,
      consistency,
      scores: {
        resolution: Number(resource.resolutionQualityScore || 0),
        content: Number(resource.contentQualityScore || 0),
        composition: Number(resource.compositionScore || 0),
        compliance: Number(resource.complianceQualityScore || 0),
        overall: Number(resource.qualityScore || 0)
      },
      flags: resource.qualityFlags?.items || []
    }
  }

  async _checkQualityConsistency(resource, logs) {
    const issues = []

    if (logs.length >= 2) {
      const [latest, previous] = logs
      const scoreDiff = Math.abs(Number(latest.newQualityScore) - Number(previous.newQualityScore))
      if (scoreDiff > 20) {
        issues.push({
          type: 'score_jump',
          severity: 'warning',
          description: `相邻两次评分差异${scoreDiff}分，超过20分阈值，判定标准可能不一致`
        })
      }
    }

    const expectedLevel = this._scoreToLevel(resource.qualityScore || 0)
    if (expectedLevel !== resource.qualityLevel) {
      issues.push({
        type: 'level_mismatch',
        severity: 'high',
        description: `评分${resource.qualityScore}对应等级应为${expectedLevel}，实际为${resource.qualityLevel}`
      })
    }

    if (resource.violationCount > 0 && resource.complianceQualityScore > 70) {
      issues.push({
        type: 'compliance_issue',
        severity: 'high',
        description: `存在${resource.violationCount}次违规记录，但合规评分${resource.complianceQualityScore}偏高，可能为漏判`
      })
    }

    return {
      consistent: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(30, 100 - issues.length * 25)
    }
  }

  async getQualityStats() {
    const levels = ['excellent', 'good', 'normal', 'low_quality', 'violation']
    const stats = { levelDistribution: {} }

    for (const level of levels) {
      stats.levelDistribution[level] = await Resource.count({ where: { qualityLevel: level } })
    }

    stats.pendingReview = await Resource.count({
      where: { qualityReviewStatus: 'pending' }
    })

    stats.locked = await Resource.count({
      where: { qualityReviewStatus: 'locked' }
    })

    stats.todayAssessments = await QualityAssessmentLog.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })

    stats.todayReviews = await QualityReviewLog.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })

    stats.misjudgments = await QualityAssessmentLog.count({
      where: { isMisjudgment: true }
    })

    const avgScoreRes = await Resource.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('qualityScore')), 'avg']],
      where: { qualityScore: { [Op.gt]: 0 } }
    })
    stats.avgQualityScore = Number(avgScoreRes?.dataValues?.avg || 0).toFixed(1)

    return stats
  }
}

module.exports = new QualityControlService()
