const { FeaturedWork, FeaturedWorkLog, Resource, User, Violation, Category } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere, generateMaterialCode } = require('../utils/common')
const ApiError = require('../utils/apiError')

const FEATURED_STATUS_TRANSITIONS = {
  pending_verify: ['verified', 'rejected', 'featured'],
  verified: ['featured', 'rejected', 'pending_verify'],
  featured: ['removed', 'verified'],
  removed: ['featured', 'verified', 'pending_verify'],
  rejected: ['pending_verify', 'verified', 'featured']
}

const QUALITY_THRESHOLDS = {
  overall: 70,
  quality: 60,
  original: 50,
  resolution: 50,
  compliance: 80
}

const MIN_RESOLUTION = {
  image: { width: 1280, height: 720 },
  video: { width: 1920, height: 1080 }
}

const ABNORMAL_ACCOUNT_STATUSES = ['frozen', 'temp_banned', 'permanent_banned']

class FeaturedWorkService {
  async _evaluateQuality(resource) {
    const width = resource.width || 0
    const height = resource.height || 0
    const fileSize = resource.fileSize || 0
    const likeCount = resource.likeCount || 0
    const viewCount = resource.viewCount || 0
    const downloadCount = resource.downloadCount || 0

    let resolutionScore = 50
    const minRes = MIN_RESOLUTION[resource.fileType] || MIN_RESOLUTION.image
    if (width >= minRes.width * 2 && height >= minRes.height * 2) {
      resolutionScore = 100
    } else if (width >= minRes.width && height >= minRes.height) {
      resolutionScore = 80
    } else if (width >= minRes.width * 0.8 && height >= minRes.height * 0.8) {
      resolutionScore = 60
    }

    let qualityScore = 50
    if (resource.fileType === 'image') {
      if (fileSize > 5 * 1024 * 1024) qualityScore += 10
      if (viewCount > 10000) qualityScore += 15
      else if (viewCount > 1000) qualityScore += 10
      if (likeCount > 1000) qualityScore += 15
      else if (likeCount > 100) qualityScore += 10
      if (downloadCount > 500) qualityScore += 10
    } else if (resource.fileType === 'video') {
      if ((resource.duration || 0) > 60) qualityScore += 10
      if (fileSize > 100 * 1024 * 1024) qualityScore += 10
      if (viewCount > 50000) qualityScore += 15
      else if (viewCount > 5000) qualityScore += 10
      if (likeCount > 2000) qualityScore += 15
      else if (likeCount > 200) qualityScore += 10
    }
    qualityScore = Math.min(100, qualityScore)

    return { resolutionScore, qualityScore }
  }

  async _evaluateOriginal(resource, userId) {
    let originalScore = 60

    if (resource.source && ['original', 'self_upload', 'author_upload'].includes(resource.source)) {
      originalScore += 20
    }
    if (resource.materialCode) {
      originalScore += 10
    }
    if (resource.tags && resource.tags.length > 0 && resource.tags.includes('原创')) {
      originalScore += 10
    }

    if (userId) {
      const authorResources = await Resource.count({
        where: { authorId: userId, status: { [Op.in]: ['approved', 'published'] } }
      })
      if (authorResources > 50) originalScore += 5
      if (authorResources > 20) originalScore += 5
    }

    originalScore = Math.min(100, originalScore)
    return originalScore
  }

  async _evaluateCompliance(resource) {
    let complianceScore = 80

    if (resource.violationCount > 0) {
      complianceScore -= resource.violationCount * 20
    }
    if (resource.isBlocked) {
      complianceScore = 0
    }
    if (resource.status === 'rejected') {
      complianceScore = 0
    }
    if (resource.auditLevel >= 2) {
      complianceScore += 10
    }
    if (resource.status === 'approved' || resource.status === 'published') {
      complianceScore += 10
    }

    return Math.max(0, Math.min(100, complianceScore))
  }

  async _evaluateAccountStatus(authorId) {
    if (!authorId) {
      return { normal: true, reason: null }
    }
    const user = await User.findByPk(authorId)
    if (!user) {
      return { normal: false, reason: '作者账号不存在' }
    }
    if (ABNORMAL_ACCOUNT_STATUSES.includes(user.status)) {
      const statusLabel = {
        frozen: '账号已冻结',
        temp_banned: '账号临时封禁',
        permanent_banned: '账号永久封禁'
      }
      return { normal: false, reason: statusLabel[user.status] || '账号状态异常' }
    }
    return { normal: true, reason: null }
  }

  async _checkViolation(resourceId) {
    const violations = await Violation.findAll({
      where: { resourceId, status: { [Op.in]: ['pending', 'processed'] } },
      order: [['createdAt', 'DESC']]
    })
    if (violations.length === 0) {
      return { hasViolation: false, details: null }
    }
    const latest = violations[0]
    return {
      hasViolation: true,
      details: {
        count: violations.length,
        latestType: latest.violationType,
        latestLevel: latest.violationLevel,
        latestDescription: latest.description,
        latestAction: latest.action,
        latestTime: latest.createdAt
      }
    }
  }

  async _calculateDefaultWeight(featuredLevel, overallScore) {
    const levelBase = {
      normal: 100,
      silver: 300,
      gold: 600,
      platinum: 1000,
      diamond: 2000
    }
    const base = levelBase[featuredLevel] || 100
    return Math.round(base * (overallScore / 100))
  }

  async preValidate(resourceId, userId) {
    const startTime = Date.now()
    const resource = await Resource.findByPk(resourceId, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    })

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    const errors = []
    const warnings = []
    const checkResults = {}

    const statusCheck = {
      valid: ['approved', 'published'].includes(resource.status),
      status: resource.status
    }
    checkResults.status = statusCheck
    if (!statusCheck.valid) {
      errors.push(`作品状态为「${resource.status}」，仅已审核通过或已发布作品可收录`)
    }

    const violationCheck = await this._checkViolation(resourceId)
    checkResults.violation = violationCheck
    if (violationCheck.hasViolation) {
      const level = violationCheck.details?.latestLevel
      if (level === 'severe') {
        errors.push(`作品存在严重违规记录（${violationCheck.details?.latestType}），禁止收录`)
      } else if (level === 'moderate') {
        errors.push(`作品存在中度违规记录（${violationCheck.details?.latestType}），禁止收录`)
      } else {
        warnings.push(`作品存在轻微违规记录，收录需谨慎`)
      }
    }

    const { resolutionScore, qualityScore } = this._evaluateQuality(resource)
    checkResults.quality = { resolutionScore, qualityScore }
    if (resolutionScore < QUALITY_THRESHOLDS.resolution) {
      errors.push(`作品画质评分${resolutionScore}分，低于收录阈值${QUALITY_THRESHOLDS.resolution}分`)
    }
    if (qualityScore < QUALITY_THRESHOLDS.quality) {
      warnings.push(`作品内容质量评分${qualityScore}分，建议提升后收录`)
    }

    const originalScore = await this._evaluateOriginal(resource, resource.authorId)
    checkResults.original = { score: originalScore }
    if (originalScore < QUALITY_THRESHOLDS.original) {
      errors.push(`作品原创属性评分${originalScore}分，低于收录阈值${QUALITY_THRESHOLDS.original}分，疑似非原创作品`)
    }

    const complianceScore = await this._evaluateCompliance(resource)
    checkResults.compliance = { score: complianceScore }
    if (complianceScore < QUALITY_THRESHOLDS.compliance) {
      errors.push(`作品合规评分${complianceScore}分，低于收录阈值${QUALITY_THRESHOLDS.compliance}分`)
    }

    const accountCheck = await this._evaluateAccountStatus(resource.authorId)
    checkResults.account = accountCheck
    if (!accountCheck.normal) {
      errors.push(`作者${accountCheck.reason}，禁止收录该作者作品`)
    }

    const overallScore = Math.round(
      (qualityScore * 0.25 + originalScore * 0.25 + resolutionScore * 0.2 + complianceScore * 0.3)
    )
    checkResults.overall = { score: overallScore, threshold: QUALITY_THRESHOLDS.overall }

    const valid = errors.length === 0

    const logResult = valid ? 'success' : errors.some(e => e.includes('严重') || e.includes('禁止')) ? 'blocked' : 'fail'

    await FeaturedWorkLog.create({
      featuredId: null,
      resourceId: resource.id,
      resourceTitle: resource.title,
      resourceType: resource.fileType,
      operationType: 'pre_validate',
      beforeStatus: null,
      afterStatus: null,
      validationResult: { errors, warnings, checkResults, overallScore },
      operatorId: userId,
      step: 1,
      duration: Date.now() - startTime,
      result: logResult,
      failReason: errors.length > 0 ? errors.join('；') : null,
      warnings,
      riskLevel: errors.length > 0 ? (errors.length > 2 ? 'high' : 'medium') : 'none'
    })

    return {
      valid,
      blocked: errors.some(e => e.includes('严重违规') || e.includes('永久封禁') || e.includes('合规评分')),
      errors,
      warnings,
      checkResults,
      resource: resource.toJSON(),
      suggestedLevel: overallScore >= 90 ? 'diamond'
        : overallScore >= 80 ? 'platinum'
          : overallScore >= 70 ? 'gold'
            : overallScore >= 60 ? 'silver' : 'normal',
      suggestedWeight: this._calculateDefaultWeight(
        overallScore >= 90 ? 'diamond' : overallScore >= 80 ? 'platinum' : overallScore >= 70 ? 'gold' : overallScore >= 60 ? 'silver' : 'normal',
        overallScore
      )
    }
  }

  async getResourceListForFeatured(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}
    where.status = { [Op.in]: ['approved', 'published'] }

    if (params.keyword) {
      Object.assign(where, buildFuzzyWhere(params.keyword, ['title', 'description', 'materialCode']))
    }

    if (params.fileType) {
      where.fileType = params.fileType
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId
    }

    if (params.authorId) {
      where.authorId = params.authorId
    }

    if (params.originalOnly === 'true') {
      where.source = { [Op.in]: ['original', 'self_upload', 'author_upload'] }
    }

    if (params.minLikeCount) {
      where.likeCount = { [Op.gte]: parseInt(params.minLikeCount) }
    }

    if (params.minViewCount) {
      where.viewCount = { [Op.gte]: parseInt(params.minViewCount) }
    }

    if (params.noViolation === 'true') {
      where.violationCount = 0
      where.isBlocked = false
    }

    const { count, rows } = await Resource.findAndCountAll({
      where,
      offset,
      limit,
      order: [['likeCount', 'DESC'], ['viewCount', 'DESC'], ['createdAt', 'DESC']],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: FeaturedWork, as: 'featuredWork', attributes: ['id', 'status', 'featuredLevel', 'displayWeight'] }
      ]
    })

    const list = rows.map(r => {
      const data = r.toJSON()
      const hasFeatured = !!data.featuredWork
      return {
        ...data,
        isFeatured: hasFeatured,
        featuredStatus: data.featuredWork?.status || null,
        featuredLevel: data.featuredWork?.featuredLevel || null,
        featuredWeight: data.featuredWork?.displayWeight || null,
        categoryName: data.category?.name || null
      }
    })

    return { list, total: count, page, pageSize }
  }

  async getFeaturedList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.status) {
      where.status = params.status
    }

    if (params.featuredLevel) {
      where.featuredLevel = params.featuredLevel
    }

    if (params.displayPosition) {
      where.displayPosition = params.displayPosition
    }

    if (params.resourceType) {
      where.resourceType = params.resourceType
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId
    }

    if (params.authorId) {
      where.authorId = params.authorId
    }

    if (params.keyword) {
      Object.assign(where, buildFuzzyWhere(params.keyword, ['resourceTitle', 'featuredCode', 'authorName']))
    }

    if (params.minOverallScore) {
      where.overallScore = { [Op.gte]: parseFloat(params.minOverallScore) }
    }

    const { count, rows } = await FeaturedWork.findAndCountAll({
      where,
      offset,
      limit,
      order: [['displayWeight', 'DESC'], ['featuredTime', 'DESC']],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    })

    const list = rows.map(item => {
      const data = item.toJSON()
      data.categoryName = data.category?.name || null
      delete data.category
      return data
    })

    return { list, total: count, page, pageSize }
  }

  async getDetail(id) {
    const featured = await FeaturedWork.findByPk(id, {
      include: [
        { model: Resource, as: 'resource' },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar', 'status'] }
      ]
    })
    if (!featured) throw ApiError.notFound('收录记录不存在')
    const data = featured.toJSON()
    if (data.category) data.categoryName = data.category.name
    delete data.category
    return data
  }

  async createWithValidation(resourceId, userId, data = {}, operatorName = '') {
    const startTime = Date.now()

    const validation = await this.preValidate(resourceId, userId)
    if (!validation.valid) {
      throw ApiError.badRequest(validation.errors.join('；'))
    }

    const existing = await FeaturedWork.findOne({ where: { resourceId } })
    if (existing) {
      throw ApiError.badRequest('该作品已存在收录记录')
    }

    const resource = validation.resource
    const check = validation.checkResults
    const overallScore = check.overall.score

    const featuredLevel = data.featuredLevel || validation.suggestedLevel
    const displayWeight = data.displayWeight || validation.suggestedWeight
    const now = new Date()

    const tagsFromResource = Array.isArray(resource.tags) ? resource.tags : []
    const featuredTags = Array.from(new Set([
      ...tagsFromResource,
      '优质精选',
      featuredLevel === 'diamond' ? '钻石精选'
        : featuredLevel === 'platinum' ? '铂金精选'
          : featuredLevel === 'gold' ? '黄金精选'
            : featuredLevel === 'silver' ? '白银精选' : '精选推荐'
    ])).filter(Boolean)

    const updatedTags = Array.from(new Set([
      ...tagsFromResource,
      '精选收录',
      '优质作品'
    ])).filter(Boolean)

    await Resource.update({ tags: updatedTags }, { where: { id: resourceId } })

    const featuredCode = generateMaterialCode('FW')

    const featured = await FeaturedWork.create({
      featuredCode,
      resourceId: resource.id,
      resourceTitle: resource.title,
      resourceType: resource.fileType,
      coverUrl: resource.coverUrl,
      authorId: resource.authorId,
      authorName: resource.authorName,
      categoryId: resource.categoryId,
      categoryName: resource.category?.name,
      status: 'featured',
      featuredLevel,
      displayWeight,
      displayPosition: data.displayPosition || null,
      featuredTags,
      qualityScore: check.quality.qualityScore,
      originalScore: check.original.score,
      resolutionScore: check.quality.resolutionScore,
      complianceScore: check.compliance.score,
      overallScore,
      verifyReason: data.verifyReason || `综合评分${overallScore}分，达到收录标准`,
      verifyOperatorId: userId,
      verifyOperatorName: operatorName,
      verifyTime: now,
      featuredOperatorId: userId,
      featuredOperatorName: operatorName,
      featuredTime: now,
      isOriginal: check.original.score >= 60,
      originalProof: data.originalProof || null,
      hasViolation: check.violation.hasViolation,
      violationDetails: check.violation.details,
      accountStatusNormal: check.account.normal,
      accountStatusReason: check.account.reason,
      heatAtFeatured: (resource.likeCount || 0) + (resource.viewCount || 0) / 10,
      likeAtFeatured: resource.likeCount || 0,
      viewAtFeatured: resource.viewCount || 0,
      expireAt: data.expireAt || null,
      remark: data.remark || null
    })

    await FeaturedWorkLog.create({
      featuredId: featured.id,
      featuredCode: featured.featuredCode,
      resourceId: resource.id,
      resourceTitle: resource.title,
      resourceType: resource.fileType,
      operationType: 'featured',
      beforeStatus: null,
      afterStatus: 'featured',
      afterWeight: displayWeight,
      afterLevel: featuredLevel,
      afterPosition: data.displayPosition || null,
      changeFields: ['status', 'featuredLevel', 'displayWeight', 'displayPosition', 'featuredTags'],
      beforeData: { resource },
      afterData: featured.toJSON(),
      reason: `作品收录，综合评分${overallScore}分，等级${featuredLevel}`,
      verifyBasis: check,
      validationResult: validation,
      operatorId: userId,
      operatorName,
      step: 1,
      duration: Date.now() - startTime,
      result: 'success',
      riskLevel: overallScore >= 80 ? 'none' : 'low'
    })

    return featured
  }

  async cancelFeatured(id, userId, data = {}, operatorName = '') {
    const startTime = Date.now()
    const featured = await FeaturedWork.findByPk(id)
    if (!featured) throw ApiError.notFound('收录记录不存在')
    if (featured.status !== 'featured' && featured.status !== 'verified') {
      throw ApiError.badRequest(`当前状态「${featured.status}」不支持取消收录`)
    }

    const beforeData = featured.toJSON()

    await featured.update({
      status: 'removed',
      removeReason: data.reason || '取消收录',
      removeOperatorId: userId,
      removeOperatorName: operatorName,
      removeTime: new Date(),
      displayWeight: 0,
      displayPosition: null
    })

    const resource = await Resource.findByPk(featured.resourceId)
    if (resource) {
      const currentTags = Array.isArray(resource.tags) ? resource.tags : []
      const updatedTags = currentTags.filter(t => !['精选收录', '优质作品'].includes(t))
      await Resource.update({ tags: updatedTags }, { where: { id: featured.resourceId } })
    }

    await FeaturedWorkLog.create({
      featuredId: featured.id,
      featuredCode: featured.featuredCode,
      resourceId: featured.resourceId,
      resourceTitle: featured.resourceTitle,
      resourceType: featured.resourceType,
      operationType: 'cancel_featured',
      beforeStatus: beforeData.status,
      afterStatus: 'removed',
      beforeWeight: beforeData.displayWeight,
      afterWeight: 0,
      beforePosition: beforeData.displayPosition,
      afterPosition: null,
      changeFields: ['status', 'displayWeight', 'displayPosition', 'removeReason', 'removeOperatorId', 'removeOperatorName', 'removeTime'],
      beforeData,
      afterData: featured.toJSON(),
      reason: data.reason || '取消收录',
      operatorId: userId,
      operatorName,
      step: 1,
      duration: Date.now() - startTime,
      result: 'success'
    })

    return { updated: true, featured: featured.toJSON() }
  }

  async adjustWeight(id, newWeight, userId, data = {}, operatorName = '') {
    const startTime = Date.now()
    const featured = await FeaturedWork.findByPk(id)
    if (!featured) throw ApiError.notFound('收录记录不存在')
    if (featured.status !== 'featured') {
      throw ApiError.badRequest(`仅已收录作品可调整权重，当前状态「${featured.status}」`)
    }

    if (newWeight < 0 || newWeight > 99999) {
      throw ApiError.badRequest('权重取值范围为0-99999')
    }

    const beforeData = featured.toJSON()
    const beforeWeight = featured.displayWeight

    await featured.update({ displayWeight: newWeight })

    await FeaturedWorkLog.create({
      featuredId: featured.id,
      featuredCode: featured.featuredCode,
      resourceId: featured.resourceId,
      resourceTitle: featured.resourceTitle,
      resourceType: featured.resourceType,
      operationType: 'adjust_weight',
      beforeStatus: beforeData.status,
      afterStatus: beforeData.status,
      beforeWeight,
      afterWeight: newWeight,
      changeFields: ['displayWeight'],
      beforeData,
      afterData: featured.toJSON(),
      reason: data.reason || `权重调整：${beforeWeight}→${newWeight}`,
      operatorId: userId,
      operatorName,
      step: 1,
      duration: Date.now() - startTime,
      result: 'success'
    })

    return { updated: true, beforeWeight, afterWeight: newWeight, featured: featured.toJSON() }
  }

  async adjustPosition(id, newPosition, userId, data = {}, operatorName = '') {
    const startTime = Date.now()
    const featured = await FeaturedWork.findByPk(id)
    if (!featured) throw ApiError.notFound('收录记录不存在')
    if (featured.status !== 'featured') {
      throw ApiError.badRequest(`仅已收录作品可调整展示位置，当前状态「${featured.status}」`)
    }

    const allowedPositions = ['home_banner', 'home_recommend', 'category_top', 'special_zone', 'editor_pick', 'hot_list', null]
    if (!allowedPositions.includes(newPosition)) {
      throw ApiError.badRequest(`不支持的展示位置：${newPosition}`)
    }

    const beforeData = featured.toJSON()
    const beforePosition = featured.displayPosition

    await featured.update({ displayPosition: newPosition })

    await FeaturedWorkLog.create({
      featuredId: featured.id,
      featuredCode: featured.featuredCode,
      resourceId: featured.resourceId,
      resourceTitle: featured.resourceTitle,
      resourceType: featured.resourceType,
      operationType: 'adjust_position',
      beforeStatus: beforeData.status,
      afterStatus: beforeData.status,
      beforePosition,
      afterPosition: newPosition,
      changeFields: ['displayPosition'],
      beforeData,
      afterData: featured.toJSON(),
      reason: data.reason || `展示位置调整：${beforePosition || '无'}→${newPosition || '无'}`,
      operatorId: userId,
      operatorName,
      step: 1,
      duration: Date.now() - startTime,
      result: 'success'
    })

    return { updated: true, beforePosition, afterPosition: newPosition, featured: featured.toJSON() }
  }

  async adjustLevel(id, newLevel, userId, data = {}, operatorName = '') {
    const startTime = Date.now()
    const featured = await FeaturedWork.findByPk(id)
    if (!featured) throw ApiError.notFound('收录记录不存在')

    const allowedLevels = ['normal', 'silver', 'gold', 'platinum', 'diamond']
    if (!allowedLevels.includes(newLevel)) {
      throw ApiError.badRequest(`不支持的精选等级：${newLevel}`)
    }

    const beforeData = featured.toJSON()
    const beforeLevel = featured.featuredLevel
    const newWeight = data.displayWeight || this._calculateDefaultWeight(newLevel, featured.overallScore)

    await featured.update({
      featuredLevel: newLevel,
      displayWeight: newWeight
    })

    const resource = await Resource.findByPk(featured.resourceId)
    if (resource) {
      const currentTags = Array.isArray(resource.tags) ? resource.tags : []
      const levelTagMap = {
        diamond: '钻石精选',
        platinum: '铂金精选',
        gold: '黄金精选',
        silver: '白银精选',
        normal: '精选推荐'
      }
      const oldLevelTag = levelTagMap[beforeLevel]
      const newLevelTag = levelTagMap[newLevel]
      let updatedTags = currentTags.filter(t => t !== oldLevelTag)
      if (!updatedTags.includes(newLevelTag)) updatedTags.push(newLevelTag)
      await Resource.update({ tags: updatedTags }, { where: { id: featured.resourceId } })
    }

    await FeaturedWorkLog.create({
      featuredId: featured.id,
      featuredCode: featured.featuredCode,
      resourceId: featured.resourceId,
      resourceTitle: featured.resourceTitle,
      resourceType: featured.resourceType,
      operationType: 'adjust_level',
      beforeStatus: beforeData.status,
      afterStatus: beforeData.status,
      beforeLevel,
      afterLevel: newLevel,
      beforeWeight: beforeData.displayWeight,
      afterWeight: newWeight,
      changeFields: ['featuredLevel', 'displayWeight'],
      beforeData,
      afterData: featured.toJSON(),
      reason: data.reason || `精选等级调整：${beforeLevel}→${newLevel}`,
      operatorId: userId,
      operatorName,
      step: 1,
      duration: Date.now() - startTime,
      result: 'success'
    })

    return { updated: true, beforeLevel, afterLevel: newLevel, featured: featured.toJSON() }
  }

  async batchFeature(resourceIds, userId, data = {}, operatorName = '') {
    const startTime = Date.now()
    const batchId = 'BATCH_FW_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    const results = {
      batchId,
      total: resourceIds.length,
      success: [],
      filtered: [],
      failed: [],
      warnings: []
    }

    for (const resourceId of resourceIds) {
      try {
        const existing = await FeaturedWork.findOne({ where: { resourceId } })
        if (existing) {
          results.filtered.push({
            id: resourceId,
            reason: '已存在收录记录'
          })
          continue
        }

        const validation = await this.preValidate(resourceId, userId)
        if (!validation.valid) {
          const isBlocked = validation.blocked
          const reason = validation.errors.join('；')

          if (isBlocked) {
            results.filtered.push({ id: resourceId, reason })
          } else {
            if (validation.warnings.length) {
              results.warnings.push({ id: resourceId, warnings: validation.warnings })
            }
            results.failed.push({ id: resourceId, reason })
          }

          await FeaturedWorkLog.create({
            resourceId,
            resourceTitle: validation.resource?.title || '未知',
            resourceType: validation.resource?.fileType || 'image',
            operationType: 'batch_featured',
            validationResult: validation,
            operatorId: userId,
            operatorName,
            batchId,
            step: 1,
            result: isBlocked ? 'filtered' : 'fail',
            failReason: reason,
            warnings: validation.warnings
          })
          continue
        }

        const featured = await this.createWithValidation(resourceId, userId, {
          displayPosition: data.displayPosition,
          expireAt: data.expireAt
        }, operatorName)

        await FeaturedWorkLog.create({
          featuredId: featured.id,
          featuredCode: featured.featuredCode,
          resourceId,
          resourceTitle: featured.resourceTitle,
          resourceType: featured.resourceType,
          operationType: 'batch_featured',
          afterStatus: 'featured',
          afterWeight: featured.displayWeight,
          afterLevel: featured.featuredLevel,
          afterPosition: data.displayPosition || null,
          afterData: featured.toJSON(),
          reason: '批量收录',
          verifyBasis: { overallScore: featured.overallScore },
          operatorId: userId,
          operatorName,
          batchId,
          step: 1,
          duration: Date.now() - startTime,
          result: 'success'
        })

        results.success.push({
          id: resourceId,
          featuredId: featured.id,
          featuredCode: featured.featuredCode,
          title: featured.resourceTitle,
          featuredLevel: featured.featuredLevel,
          overallScore: featured.overallScore
        })
      } catch (err) {
        results.failed.push({
          id: resourceId,
          reason: err.message || '未知错误'
        })
      }
    }

    return results
  }

  async batchCancel(featuredIds, userId, data = {}, operatorName = '') {
    const batchId = 'BATCH_CFW_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    const results = {
      batchId,
      total: featuredIds.length,
      success: [],
      failed: [],
      filtered: []
    }

    for (const featuredId of featuredIds) {
      try {
        const featured = await FeaturedWork.findByPk(featuredId)
        if (!featured) {
          results.failed.push({ id: featuredId, reason: '收录记录不存在' })
          continue
        }
        if (featured.status !== 'featured' && featured.status !== 'verified') {
          results.filtered.push({
            id: featuredId,
            title: featured.resourceTitle,
            reason: `当前状态「${featured.status}」不支持取消`
          })
          continue
        }

        const result = await this.cancelFeatured(featuredId, userId, data, operatorName)

        results.success.push({
          id: featuredId,
          title: featured.resourceTitle
        })
      } catch (err) {
        results.failed.push({
          id: featuredId,
          reason: err.message || '未知错误'
        })
      }
    }

    return results
  }

  async getLogs(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = {}

    if (params.featuredId) where.featuredId = params.featuredId
    if (params.resourceId) where.resourceId = params.resourceId
    if (params.operationType) where.operationType = params.operationType
    if (params.operatorId) where.operatorId = params.operatorId
    if (params.batchId) where.batchId = params.batchId
    if (params.result) where.result = params.result
    if (params.riskLevel) where.riskLevel = params.riskLevel

    const { count, rows } = await FeaturedWorkLog.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  }

  async traceFeatured(id) {
    const featured = await FeaturedWork.findByPk(id, {
      include: [
        { model: Resource, as: 'resource' },
        { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar', 'status'] }
      ]
    })
    if (!featured) throw ApiError.notFound('收录记录不存在')

    const logs = await FeaturedWorkLog.findAll({
      where: { featuredId: id },
      order: [['createdAt', 'DESC']]
    })

    const violationCheck = await this._checkViolation(featured.resourceId)
    const accountCheck = await this._evaluateAccountStatus(featured.authorId)

    const recheckIssues = []

    if (featured.hasViolation && violationCheck.hasViolation) {
      const level = violationCheck.details?.latestLevel
      if (level === 'severe' || level === 'moderate') {
        recheckIssues.push({
          type: 'violation',
          severity: level === 'severe' ? 'critical' : 'high',
          message: `复核发现存在${level === 'severe' ? '严重' : '中度'}违规记录，建议取消收录`,
          details: violationCheck.details
        })
      }
    }

    if (!accountCheck.normal) {
      recheckIssues.push({
        type: 'account',
        severity: 'high',
        message: `作者账号异常：${accountCheck.reason}，建议取消收录`,
        details: accountCheck
      })
    }

    if (featured.overallScore < QUALITY_THRESHOLDS.overall) {
      recheckIssues.push({
        type: 'quality',
        severity: 'medium',
        message: `综合评分${featured.overallScore}分低于收录阈值${QUALITY_THRESHOLDS.overall}分，建议重新评估`,
        threshold: QUALITY_THRESHOLDS.overall,
        currentScore: featured.overallScore
      })
    }

    if (featured.complianceScore < QUALITY_THRESHOLDS.compliance) {
      recheckIssues.push({
        type: 'compliance',
        severity: 'high',
        message: `合规评分${featured.complianceScore}分低于阈值${QUALITY_THRESHOLDS.compliance}分，存在合规风险`,
        threshold: QUALITY_THRESHOLDS.compliance,
        currentScore: featured.complianceScore
      })
    }

    return {
      featured: featured.toJSON(),
      operationLogs: logs.map(l => l.toJSON()),
      traceInfo: {
        traceTime: new Date(),
        featuredCode: featured.featuredCode,
        featuredAt: featured.featuredTime,
        featuredBy: featured.featuredOperatorName,
        verifiedAt: featured.verifyTime,
        verifiedBy: featured.verifyOperatorName,
        verifyBasis: featured.verifyReason
      },
      recheckResult: {
        totalIssues: recheckIssues.length,
        criticalCount: recheckIssues.filter(i => i.severity === 'critical').length,
        highCount: recheckIssues.filter(i => i.severity === 'high').length,
        mediumCount: recheckIssues.filter(i => i.severity === 'medium').length,
        overallPass: recheckIssues.length === 0,
        needReview: recheckIssues.some(i => i.severity === 'critical' || i.severity === 'high'),
        issues: recheckIssues
      }
    }
  }

  async getStatusOverview() {
    const statuses = ['pending_verify', 'verified', 'featured', 'removed', 'rejected']
    const counts = {}
    for (const s of statuses) {
      counts[s] = await FeaturedWork.count({ where: { status: s } })
    }

    const total = await FeaturedWork.count()
    const levels = ['normal', 'silver', 'gold', 'platinum', 'diamond']
    const levelCounts = {}
    for (const l of levels) {
      levelCounts[l] = await FeaturedWork.count({ where: { featuredLevel: l, status: 'featured' } })
    }

    const positions = ['home_banner', 'home_recommend', 'category_top', 'special_zone', 'editor_pick', 'hot_list']
    const positionCounts = {}
    for (const p of positions) {
      positionCounts[p] = await FeaturedWork.count({ where: { displayPosition: p, status: 'featured' } })
    }

    const avgOverall = total > 0
      ? Math.round((await FeaturedWork.sum('overallScore') || 0) / total * 100) / 100
      : 0

    return {
      total,
      statusCounts: counts,
      featuredCount: counts.featured || 0,
      verifiedCount: counts.verified || 0,
      pendingCount: counts.pending_verify || 0,
      removedCount: counts.removed || 0,
      rejectedCount: counts.rejected || 0,
      levelCounts,
      positionCounts,
      avgOverallScore: avgOverall,
      featuredRate: total ? Math.round((counts.featured / total) * 1000) / 10 : 0
    }
  }

  async verify(id, pass, userId, data = {}, operatorName = '') {
    const startTime = Date.now()
    const featured = await FeaturedWork.findByPk(id)
    if (!featured) throw ApiError.notFound('收录记录不存在')

    if (featured.status !== 'pending_verify') {
      throw ApiError.badRequest(`仅待核验记录可执行核验，当前状态「${featured.status}」`)
    }

    const beforeData = featured.toJSON()
    const now = new Date()

    if (pass) {
      await featured.update({
        status: 'verified',
        verifyReason: data.reason || '核验通过，达到收录标准',
        verifyOperatorId: userId,
        verifyOperatorName: operatorName,
        verifyTime: now
      })

      await FeaturedWorkLog.create({
        featuredId: featured.id,
        featuredCode: featured.featuredCode,
        resourceId: featured.resourceId,
        resourceTitle: featured.resourceTitle,
        resourceType: featured.resourceType,
        operationType: 'verify_pass',
        beforeStatus: 'pending_verify',
        afterStatus: 'verified',
        changeFields: ['status', 'verifyReason', 'verifyOperatorId', 'verifyOperatorName', 'verifyTime'],
        beforeData,
        afterData: featured.toJSON(),
        reason: data.reason || '核验通过',
        verifyBasis: data.verifyBasis || null,
        operatorId: userId,
        operatorName,
        step: 1,
        duration: Date.now() - startTime,
        result: 'success'
      })
    } else {
      await featured.update({
        status: 'rejected',
        verifyReason: data.reason || '核验不通过',
        verifyOperatorId: userId,
        verifyOperatorName: operatorName,
        verifyTime: now
      })

      await FeaturedWorkLog.create({
        featuredId: featured.id,
        featuredCode: featured.featuredCode,
        resourceId: featured.resourceId,
        resourceTitle: featured.resourceTitle,
        resourceType: featured.resourceType,
        operationType: 'verify_reject',
        beforeStatus: 'pending_verify',
        afterStatus: 'rejected',
        changeFields: ['status', 'verifyReason', 'verifyOperatorId', 'verifyOperatorName', 'verifyTime'],
        beforeData,
        afterData: featured.toJSON(),
        reason: data.reason || '核验不通过',
        operatorId: userId,
        operatorName,
        step: 1,
        duration: Date.now() - startTime,
        result: 'success'
      })
    }

    return { updated: true, featured: featured.toJSON() }
  }
}

module.exports = new FeaturedWorkService()
