const { FilterEffect, FilterEditLog, FilterCategoryAdapt, FilterWeightLog, Category, OperationLog } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere, generateMaterialCode } = require('../utils/common')
const ApiError = require('../utils/apiError')
const cache = require('../utils/cache')
const crypto = require('crypto')

const ALLOWED_FILE_FORMATS = ['glsl', 'json', 'lut_3d', 'lut_1d', 'custom']
const ALLOWED_RESOLUTIONS = ['1920x1080', '1280x720', '3840x2160', '1080x1920', '720x1280', '2160x3840']
const ALLOWED_SCENES = ['photo', 'video', 'live', 'short_video', 'portrait', 'landscape', 'food', 'scenery', 'night', 'vintage']
const ALLOWED_STATUSES = ['draft', 'pending', 'approved', 'rejected', 'published', 'offline', 'violation']

const CORE_FIELDS = ['fileUrl', 'fileFormat', 'fileSize', 'width', 'height', 'resolution', 'coreParams', 'adaptScene']
const ALLOWED_EDIT_FIELDS_WHEN_PUBLISHED = ['sortWeight', 'description', 'remark']

const STATUS_TRANSITIONS = {
  draft: ['pending'],
  pending: ['approved', 'rejected'],
  approved: ['published', 'violation'],
  rejected: ['draft', 'pending'],
  published: ['offline', 'violation'],
  offline: ['draft', 'published', 'violation'],
  violation: []
}

const STATUS_FOUR_MUTEX = ['pending', 'published', 'offline', 'violation']
const HIGH_FREQUENCY_WINDOW_MS = 60 * 1000
const HIGH_FREQUENCY_THRESHOLD = 5
const HEAT_MATCH_TOLERANCE = 500

const MUTEX_CATEGORY_KEYS = ['portrait', 'landscape', 'vintage', 'food', 'night', 'scenery']
const CATEGORY_SCENE_RULES = {
  portrait: ['portrait', 'photo', 'live'],
  landscape: ['landscape', 'scenery', 'photo'],
  vintage: ['vintage', 'photo', 'short_video'],
  food: ['food', 'photo', 'short_video'],
  night: ['night', 'video', 'photo'],
  scenery: ['scenery', 'landscape', 'photo']
}
const ADAPT_SCORE_THRESHOLD = 40

const WEIGHT_GLOBAL_MIN = 0
const WEIGHT_GLOBAL_MAX = 9999
const WEIGHT_QUALITY_RANGES = {
  poor: { min: 0, max: 100, default: 30 },
  normal: { min: 100, max: 500, default: 200 },
  good: { min: 500, max: 1500, default: 800 },
  excellent: { min: 1500, max: 9999, default: 3000 }
}
const WEIGHT_HEAT_RULES = [
  { minHeat: 0, maxHeat: 10, range: { min: 0, max: 100 } },
  { minHeat: 10, maxHeat: 100, range: { min: 100, max: 500 } },
  { minHeat: 100, maxHeat: 500, range: { min: 500, max: 2000 } },
  { minHeat: 500, maxHeat: 99999, range: { min: 2000, max: 9999 } }
]
const WEIGHT_MATCH_THRESHOLD = 40
const WEIGHT_ADJUST_RATING_THRESHOLD = 0.6
const NEW_FILTER_DAYS = 7

class FilterService {
  async getList(params = {}) {
    const cacheKey = 'filter_list_' + JSON.stringify(params)
    return cache.getOrSet(cacheKey, async () => {
      const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

      const where = {}

      if (params.keyword) {
        Object.assign(where, buildFuzzyWhere(params.keyword, ['name', 'description']))
      }

      if (params.status) {
        where.status = params.status
      }

      if (params.categoryId) {
        where.categoryId = params.categoryId
      }

      if (params.fileFormat) {
        where.fileFormat = params.fileFormat
      }

      if (params.adaptScene) {
        where.adaptScene = { [Op.like]: `%${params.adaptScene}%` }
      }

      if (params.filterCode) {
        where.filterCode = params.filterCode
      }

      if (params.isCompliant !== undefined) {
        where.isCompliant = params.isCompliant
      }

      const { count, rows } = await FilterEffect.findAndCountAll({
        where,
        offset,
        limit,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      })

      const list = rows.map((item) => {
        const data = item.toJSON()
        if (data.category) {
          data.categoryName = data.category.name
        }
        delete data.category
        return data
      })

      return { list, total: count, page, pageSize }
    }, 60000)
  }

  async getDetail(id) {
    const filter = await FilterEffect.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    })
    if (!filter) throw ApiError.notFound('滤镜不存在')
    const data = filter.toJSON()
    if (data.category) {
      data.categoryName = data.category.name
    }
    delete data.category
    return data
  }

  async validateBeforeCreate(data, userId) {
    const errors = []

    if (!data.name || data.name.trim() === '') {
      errors.push('滤镜名称不能为空')
    }

    if (!data.fileUrl || data.fileUrl.trim() === '') {
      errors.push('特效文件不能为空')
    }

    if (!data.fileFormat || !ALLOWED_FILE_FORMATS.includes(data.fileFormat)) {
      errors.push(`不支持的文件格式，允许格式：${ALLOWED_FILE_FORMATS.join('、')}`)
    }

    if (data.resolution && !ALLOWED_RESOLUTIONS.includes(data.resolution)) {
      errors.push(`不支持的分辨率，允许分辨率：${ALLOWED_RESOLUTIONS.join('、')}`)
    }

    if (data.adaptScene) {
      const scenes = Array.isArray(data.adaptScene) ? data.adaptScene : data.adaptScene.split(',')
      const invalidScenes = scenes.filter(s => !ALLOWED_SCENES.includes(s.trim()))
      if (invalidScenes.length > 0) {
        errors.push(`不支持的适配场景：${invalidScenes.join('、')}`)
      }
    }

    if (!data.copyrightLicense || data.copyrightLicense.trim() === '') {
      errors.push('版权资质不能为空')
    }

    if (data.copyrightExpiredAt && new Date(data.copyrightExpiredAt) < new Date()) {
      errors.push('版权已过期，无法录入')
    }

    if (data.name) {
      const existing = await FilterEffect.findOne({
        where: { name: data.name.trim() }
      })
      if (existing) {
        errors.push('滤镜名称已存在，重复滤镜已被拦截')
      }
    }

    if (data.tags && data.name) {
      const tags = Array.isArray(data.tags) ? data.tags : data.tags.split(',')
      if (tags.length === 0) {
        errors.push('至少需要一个标签')
      }
    }

    if (data.adaptDevice && data.adaptScene) {
      const devices = Array.isArray(data.adaptDevice) ? data.adaptDevice : data.adaptDevice.split(',')
      if (devices.length === 0) {
        errors.push('适配机型不能为空')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      duplicate: errors.some(e => e.includes('重复滤镜'))
    }
  }

  async createWithValidation(data, userId) {
    const validation = await this.validateBeforeCreate(data, userId)
    if (!validation.valid) {
      throw ApiError.badRequest(validation.errors.join('；'))
    }

    const filterCode = generateMaterialCode('FX')

    const integrityHash = data.fileUrl
      ? crypto.createHash('sha256').update(data.fileUrl + Date.now()).digest('hex')
      : null

    const filterData = {
      ...data,
      filterCode,
      integrityHash,
      status: 'pending',
      authorId: userId,
      isCompliant: true,
      complianceIssues: []
    }

    const filter = await FilterEffect.create(filterData)

    await FilterEditLog.create({
      filterId: filter.id,
      filterCode: filter.filterCode,
      filterName: filter.name,
      editStep: 1,
      changeType: 'create',
      changedFields: Object.keys(data),
      beforeData: null,
      afterData: filter.toJSON(),
      operatorId: userId,
      reason: '录入滤镜素材'
    })

    return filter
  }

  async updateWithConstraint(id, data, userId) {
    const filter = await FilterEffect.findByPk(id)
    if (!filter) throw ApiError.notFound('滤镜不存在')

    const beforeData = filter.toJSON()
    const isPublished = filter.status === 'published'

    if (isPublished) {
      const illegalFields = Object.keys(data).filter(
        key => !ALLOWED_EDIT_FIELDS_WHEN_PUBLISHED.includes(key) && key !== 'id'
      )
      if (illegalFields.length > 0) {
        throw ApiError.badRequest(`滤镜已上架，仅可调整：${ALLOWED_EDIT_FIELDS_WHEN_PUBLISHED.join('、')}，禁止修改核心特效参数`)
      }
    }

    const allowedFields = isPublished
      ? ALLOWED_EDIT_FIELDS_WHEN_PUBLISHED
      : [...Object.keys(data)].filter(k => k !== 'id')

    const updateData = {}
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }

    if (updateData.name) {
      const existing = await FilterEffect.findOne({
        where: { name: updateData.name.trim(), id: { [Op.ne]: id } }
      })
      if (existing) {
        throw ApiError.badRequest('滤镜名称已存在')
      }
    }

    await filter.update(updateData)

    await FilterEditLog.create({
      filterId: id,
      filterCode: filter.filterCode,
      filterName: filter.name,
      editStep: (beforeData.editStep || 0) + 1,
      changeType: isPublished ? 'edit_limited' : 'edit',
      changedFields: Object.keys(updateData),
      beforeData,
      afterData: filter.toJSON(),
      operatorId: userId,
      reason: isPublished ? '上架状态有限编辑' : '编辑滤镜'
    })

    return filter
  }

  async getEditLogs(filterId, params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = { filterId }

    if (params.changeType) {
      where.changeType = params.changeType
    }

    const { count, rows } = await FilterEditLog.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  }

  async batchValidateAndSubmit(items, userId) {
    const results = {
      valid: [],
      invalid: [],
      total: items.length
    }

    for (const item of items) {
      const validation = await this.validateBeforeCreate(item, userId)
      if (validation.valid) {
        results.valid.push({ ...item, _validation: validation })
      } else {
        results.invalid.push({ ...item, _validation: validation })
      }
    }

    const batchId = 'BATCH_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
    const submitted = []

    for (const item of results.valid) {
      try {
        const filterCode = generateMaterialCode('FX')
        const integrityHash = item.fileUrl
          ? crypto.createHash('sha256').update(item.fileUrl + Date.now()).digest('hex')
          : null

        const filter = await FilterEffect.create({
          ...item,
          filterCode,
          integrityHash,
          status: 'pending',
          authorId: userId,
          isCompliant: true,
          complianceIssues: []
        })

        await FilterEditLog.create({
          filterId: filter.id,
          filterCode: filter.filterCode,
          filterName: filter.name,
          editStep: 1,
          changeType: 'batch_submit',
          changedFields: Object.keys(item),
          beforeData: null,
          afterData: filter.toJSON(),
          operatorId: userId,
          batchId,
          reason: '批量录入滤镜素材'
        })

        submitted.push({ id: filter.id, filterCode: filter.filterCode, name: filter.name })
      } catch (err) {
        results.invalid.push({ ...item, _validation: { valid: false, errors: [err.message] } })
      }
    }

    results.submitted = submitted
    results.batchId = batchId
    return results
  }

  async traceFilter(keyword) {
    if (!keyword || keyword.trim() === '') {
      throw ApiError.badRequest('请输入溯源关键词')
    }

    const where = {
      [Op.or]: [
        { filterCode: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } },
        { adaptScene: { [Op.like]: `%${keyword}%` } }
      ]
    }

    const filters = await FilterEffect.findAll({ where })
    if (filters.length === 0) {
      throw ApiError.notFound('未找到匹配的滤镜素材')
    }

    const results = []
    for (const filter of filters) {
      const editLogs = await FilterEditLog.findAll({
        where: { filterId: filter.id },
        order: [['createdAt', 'DESC']]
      })

      const integrityIssues = []
      if (!filter.integrityHash) {
        integrityIssues.push({ type: 'integrity', severity: 'high', message: '素材缺少完整性哈希' })
      }
      if (!filter.fileUrl) {
        integrityIssues.push({ type: 'incomplete', severity: 'critical', message: '特效文件缺失' })
      }

      const copyrightIssues = []
      if (!filter.copyrightLicense) {
        copyrightIssues.push({ type: 'copyright', severity: 'critical', message: '缺少版权资质信息' })
      }
      if (filter.copyrightExpiredAt && new Date(filter.copyrightExpiredAt) < new Date()) {
        copyrightIssues.push({ type: 'copyright_expired', severity: 'critical', message: '版权已过期' })
      }
      if (!filter.isCompliant) {
        copyrightIssues.push({ type: 'copyright_violation', severity: 'critical', message: '版权不合规' })
      }

      const allIssues = [...integrityIssues, ...copyrightIssues]
      const isBlocked = allIssues.some(i => i.severity === 'critical')

      results.push({
        filter: filter.toJSON(),
        editLogs,
        integrityCheck: {
          passed: integrityIssues.length === 0,
          issues: integrityIssues
        },
        copyrightCheck: {
          passed: copyrightIssues.length === 0,
          issues: copyrightIssues
        },
        overallCheck: {
          passed: allIssues.length === 0,
          isBlocked,
          issues: allIssues
        }
      })
    }

    return results
  }

  async checkFrontendUsage(filter) {
    const inUseCount = filter.inUseCount || 0
    const useHeat = filter.useHeat || 0
    const usingWorks = []
    if (inUseCount > 0) {
      usingWorks.push({
        filterId: filter.id,
        filterCode: filter.filterCode,
        filterName: filter.name,
        inUseCount,
        useHeat
      })
    }
    return {
      hasUsage: inUseCount > 0,
      inUseCount,
      useHeat,
      usingWorks,
      needSecondConfirm: inUseCount > 0
    }
  }

  async checkHighFrequency(filter, userId, targetStatus) {
    const windowStart = new Date(Date.now() - HIGH_FREQUENCY_WINDOW_MS)
    const recentChanges = await FilterEditLog.count({
      where: {
        filterId: filter.id,
        changeType: { [Op.in]: ['status_change', 'batch_status'] },
        createdAt: { [Op.gte]: windowStart }
      }
    })
    const isHighFrequency = recentChanges >= HIGH_FREQUENCY_THRESHOLD
    return {
      isHighFrequency,
      recentChanges,
      threshold: HIGH_FREQUENCY_THRESHOLD,
      windowMs: HIGH_FREQUENCY_WINDOW_MS
    }
  }

  async checkHeatMatch(filter, targetStatus) {
    const heat = filter.useHeat || 0
    const issues = []
    if (targetStatus === 'offline' && heat > HEAT_MATCH_TOLERANCE) {
      issues.push({
        type: 'high_heat_offline',
        severity: 'warning',
        message: `该滤镜使用热度为${heat}，高于阈值${HEAT_MATCH_TOLERANCE}，下架可能影响用户体验`
      })
    }
    if (targetStatus === 'published' && heat < 10 && filter.sortWeight > 500) {
      issues.push({
        type: 'low_heat_high_weight',
        severity: 'info',
        message: '该滤镜使用热度较低但推荐权重较高，建议先观察使用情况'
      })
    }
    return {
      passed: issues.length === 0,
      issues,
      heat,
      tolerance: HEAT_MATCH_TOLERANCE
    }
  }

  async updateStatus(id, targetStatus, userId, options = {}) {
    const { skipSecondConfirm = false, operatorName = '', violationReason = '' } = options

    const filter = await FilterEffect.findByPk(id)
    if (!filter) throw ApiError.notFound('滤镜不存在')

    if (filter.status === 'violation') {
      await FilterEditLog.create({
        filterId: id,
        filterCode: filter.filterCode,
        filterName: filter.name,
        editStep: 1,
        changeType: 'status_blocked',
        changedFields: ['status'],
        beforeData: filter.toJSON(),
        afterData: { targetStatus },
        operatorId: userId,
        operatorName,
        reason: '违规滤镜禁止变更状态'
      })
      throw ApiError.badRequest('违规滤镜禁止上架、编辑等任何操作')
    }

    if (filter.status === 'published' &&
      ['fileUrl', 'fileFormat', 'coreParams', 'adaptScene', 'resolution'].some(
        k => Object.keys(options).includes(k)
      )) {
      throw ApiError.badRequest('已上架滤镜禁止直接修改核心参数')
    }

    const allowed = STATUS_TRANSITIONS[filter.status] || []
    if (!allowed.includes(targetStatus)) {
      await FilterEditLog.create({
        filterId: id,
        filterCode: filter.filterCode,
        filterName: filter.name,
        editStep: 1,
        changeType: 'status_blocked',
        changedFields: ['status'],
        beforeData: filter.toJSON(),
        afterData: { targetStatus },
        operatorId: userId,
        operatorName,
        reason: `非法状态流转：${filter.status}->${targetStatus}`
      })
      throw ApiError.badRequest(`不允许从${filter.status}变更为${targetStatus}`)
    }

    const usageResult = await this.checkFrontendUsage(filter)
    if (usageResult.hasUsage && !skipSecondConfirm) {
      return {
        needSecondConfirm: true,
        inUseCount: usageResult.inUseCount,
        useHeat: usageResult.useHeat,
        usingWorks: usageResult.usingWorks,
        message: `该滤镜当前有${usageResult.inUseCount}个作品在用，需二次确认是否继续`
      }
    }

    const hfResult = await this.checkHighFrequency(filter, userId, targetStatus)
    if (hfResult.isHighFrequency) {
      await FilterEditLog.create({
        filterId: id,
        filterCode: filter.filterCode,
        filterName: filter.name,
        editStep: 1,
        changeType: 'status_hf_blocked',
        changedFields: ['status'],
        beforeData: filter.toJSON(),
        afterData: { targetStatus },
        operatorId: userId,
        operatorName,
        reason: `高频变更拦截：${hfResult.recentChanges}次/${hfResult.windowMs / 1000}秒`
      })
      throw ApiError.badRequest(
        `短时间内变更频次过高（${hfResult.recentChanges}次/${hfResult.windowMs / 1000}秒），已自动拦截，请稍后再试`
      )
    }

    const heatMatch = await this.checkHeatMatch(filter, targetStatus)

    const beforeData = filter.toJSON()
    const now = new Date()

    let canUserUse = filter.canUserUse
    let recommendWeight = filter.recommendWeight
    let newSortWeight = filter.sortWeight

    switch (targetStatus) {
      case 'published':
        canUserUse = true
        recommendWeight = Math.max(recommendWeight, 100)
        break
      case 'offline':
        canUserUse = false
        newSortWeight = 0
        recommendWeight = 0
        break
      case 'violation':
        canUserUse = false
        newSortWeight = 0
        recommendWeight = 0
        break
      case 'approved':
        canUserUse = true
        break
      case 'pending':
      case 'rejected':
      case 'draft':
        canUserUse = true
        break
    }

    await filter.update({
      status: targetStatus,
      ...(targetStatus === 'published' ? { publishedAt: now } : {}),
      ...(targetStatus === 'offline' ? { offlineAt: now } : {}),
      ...(targetStatus === 'violation'
        ? { violationReason, violationAt: now }
        : {}),
      canUserUse,
      recommendWeight,
      ...(targetStatus === 'offline' || targetStatus === 'violation'
        ? { sortWeight: newSortWeight }
        : {}),
      statusChangeCount: (filter.statusChangeCount || 0) + 1,
      lastStatusChangeAt: now,
      lastStatusChangeOperator: operatorName || filter.lastStatusChangeOperator
    })

    await FilterEditLog.create({
      filterId: id,
      filterCode: filter.filterCode,
      filterName: filter.name,
      editStep: 1,
      changeType: 'status_change',
      changedFields: [
        'status',
        'canUserUse',
        'recommendWeight',
        'sortWeight',
        'statusChangeCount',
        'lastStatusChangeAt',
        'lastStatusChangeOperator',
        ...(targetStatus === 'published' ? ['publishedAt'] : []),
        ...(targetStatus === 'offline' ? ['offlineAt'] : []),
        ...(targetStatus === 'violation' ? ['violationReason', 'violationAt'] : [])
      ],
      beforeData,
      afterData: filter.toJSON(),
      operatorId: userId,
      operatorName,
      reason: `状态变更为${targetStatus}` +
        (heatMatch.issues.length ? `；热度匹配提示：${heatMatch.issues.map(i => i.message).join('；')}` : '')
    })

    return {
      updated: true,
      filter: filter,
      heatWarnings: heatMatch.issues,
      needSecondConfirm: false
    }
  }

  async batchStatusUpdate(ids, targetStatus, userId, options = {}) {
    const { operatorName = '' } = options
    const results = {
      total: ids.length,
      success: [],
      failed: [],
      filtered: [],
      batchId: 'BATCH_STATUS_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    }

    for (const id of ids) {
      try {
        const filter = await FilterEffect.findByPk(id)
        if (!filter) {
          results.failed.push({ id, reason: '滤镜不存在' })
          continue
        }

        if (filter.status === 'violation' || filter.status === 'pending') {
          results.filtered.push({
            id,
            filterCode: filter.filterCode,
            name: filter.name,
            reason: filter.status === 'violation' ? '违规滤镜已过滤' : '待审核滤镜已过滤',
            status: filter.status
          })
          continue
        }

        if (targetStatus === 'published' && !['approved', 'offline'].includes(filter.status)) {
          results.filtered.push({
            id,
            filterCode: filter.filterCode,
            name: filter.name,
            reason: `${filter.status}状态不允许上架`,
            status: filter.status
          })
          continue
        }

        if (targetStatus === 'offline' && filter.status !== 'published') {
          results.filtered.push({
            id,
            filterCode: filter.filterCode,
            name: filter.name,
            reason: `${filter.status}状态无需下架`,
            status: filter.status
          })
          continue
        }

        const hfCheck = await this.checkHighFrequency(filter, userId, targetStatus)
        if (hfCheck.isHighFrequency) {
          results.failed.push({
            id,
            filterCode: filter.filterCode,
            name: filter.name,
            reason: '高频变更被拦截'
          })
          await FilterEditLog.create({
            filterId: id,
            filterCode: filter.filterCode,
            filterName: filter.name,
            editStep: 1,
            changeType: 'status_hf_blocked',
            changedFields: ['status'],
            beforeData: filter.toJSON(),
            afterData: { targetStatus },
            operatorId: userId,
            operatorName,
            batchId: results.batchId,
            reason: '批量操作高频拦截'
          })
          continue
        }

        const beforeData = filter.toJSON()
        const now = new Date()
        const updates = {
          status: targetStatus,
          statusChangeCount: (filter.statusChangeCount || 0) + 1,
          lastStatusChangeAt: now,
          lastStatusChangeOperator: operatorName || filter.lastStatusChangeOperator
        }

        if (targetStatus === 'published') {
          updates.publishedAt = now
          updates.canUserUse = true
          updates.recommendWeight = Math.max(filter.recommendWeight || 0, 100)
        }
        if (targetStatus === 'offline') {
          updates.offlineAt = now
          updates.canUserUse = false
          updates.recommendWeight = 0
          updates.sortWeight = 0
        }

        await filter.update(updates)

        await FilterEditLog.create({
          filterId: id,
          filterCode: filter.filterCode,
          filterName: filter.name,
          editStep: 1,
          changeType: 'batch_status',
          changedFields: Object.keys(updates),
          beforeData,
          afterData: filter.toJSON(),
          operatorId: userId,
          operatorName,
          batchId: results.batchId,
          reason: `批量状态变更为${targetStatus}`
        })

        results.success.push({
          id,
          filterCode: filter.filterCode,
          name: filter.name,
          status: filter.status
        })
      } catch (err) {
        results.failed.push({
          id,
          reason: err.message || '未知错误'
        })
      }
    }

    return results
  }

  async getStatusOverview() {
    const statuses = STATUS_FOUR_MUTEX
    const counts = {}
    for (const s of statuses) {
      counts[s] = await FilterEffect.count({ where: { status: s } })
    }
    const total = await FilterEffect.count()
    const pendingCount = counts.pending || 0
    const publishedCount = counts.published || 0
    const offlineCount = counts.offline || 0
    const violationCount = counts.violation || 0
    return {
      total,
      pending: pendingCount,
      published: publishedCount,
      offline: offlineCount,
      violation: violationCount,
      mutexStatus: statuses,
      statusCounts: counts,
      publishRate: total ? Math.round((publishedCount / total) * 1000) / 10 : 0
    }
  }

  async validateCategoryBind(filterId, categoryId, userId) {
    const filter = await FilterEffect.findByPk(filterId)
    if (!filter) throw ApiError.notFound('滤镜不存在')

    const category = await Category.findByPk(categoryId)
    if (!category) throw ApiError.notFound('分类不存在')

    const errors = []

    const existingBind = await FilterCategoryAdapt.findOne({
      where: { filterId, isPrimary: true }
    })
    if (existingBind && existingBind.categoryId !== categoryId) {
      errors.push(`滤镜已绑定核心分类「${existingBind.categoryName}」，单一滤镜仅可绑定一个核心分类`)
    }

    const duplicateBind = await FilterCategoryAdapt.findOne({
      where: { filterId, categoryId, isPrimary: false }
    })
    if (duplicateBind) {
      errors.push('该滤镜已绑定此分类，重复绑定已拦截')
    }

    const mutexExisting = await FilterCategoryAdapt.findOne({
      where: {
        filterId,
        isPrimary: true,
        categoryName: { [Op.in]: MUTEX_CATEGORY_KEYS.map(k => k) }
      }
    })
    if (mutexExisting && MUTEX_CATEGORY_KEYS.includes(category.name)) {
      const currentKey = mutexExisting.categoryName
      if (MUTEX_CATEGORY_KEYS.includes(currentKey) && currentKey !== category.name) {
        errors.push(`分类互斥：滤镜已绑定「${currentKey}」分类，不可同时绑定「${category.name}」`)
      }
    }

    const filterScenes = filter.adaptScene || []
    const categoryRuleScenes = CATEGORY_SCENE_RULES[category.name] || []
    const matchCount = filterScenes.filter(s => categoryRuleScenes.includes(s)).length
    const adaptScore = filterScenes.length > 0
      ? Math.round((matchCount / filterScenes.length) * 100)
      : (categoryRuleScenes.length > 0 ? 20 : 50)

    if (adaptScore < ADAPT_SCORE_THRESHOLD) {
      errors.push(`适配度过低(${adaptScore}分)，滤镜场景${JSON.stringify(filterScenes)}与分类「${category.name}」规则${JSON.stringify(categoryRuleScenes)}不匹配`)
    }

    return {
      valid: errors.length === 0,
      errors,
      adaptScore,
      isMatched: adaptScore >= ADAPT_SCORE_THRESHOLD,
      filterScenes,
      categoryRuleScenes,
      categoryId: category.id,
      categoryName: category.name,
      filterId: filter.id,
      filterName: filter.name
    }
  }

  async adjustCategoryStep(filterId, newCategoryId, userId, options = {}) {
    const { operatorName = '', reason = '' } = options

    const validation = await this.validateCategoryBind(filterId, newCategoryId, userId)
    if (!validation.valid) {
      throw ApiError.badRequest(validation.errors.join('；'))
    }

    const filter = await FilterEffect.findByPk(filterId)
    if (!filter) throw ApiError.notFound('滤镜不存在')

    const newCategory = await Category.findByPk(newCategoryId)
    if (!newCategory) throw ApiError.notFound('目标分类不存在')

    const beforeData = filter.toJSON()
    const oldCategoryId = filter.categoryId
    const oldCategoryName = filter.categoryName

    const existingPrimary = await FilterCategoryAdapt.findOne({
      where: { filterId, isPrimary: true }
    })

    if (existingPrimary) {
      await existingPrimary.update({ isPrimary: false, changeType: 'unbind' })
    }

    await FilterCategoryAdapt.create({
      filterId,
      filterCode: filter.filterCode,
      filterName: filter.name,
      categoryId: newCategoryId,
      categoryName: newCategory.name,
      adaptScore: validation.adaptScore,
      isMatched: validation.isMatched,
      isPrimary: true,
      filterScenes: filter.adaptScene || [],
      categorySceneRule: CATEGORY_SCENE_RULES[newCategory.name] || [],
      bindType: 'manual',
      changeType: 'adjust',
      operatorId: userId,
      operatorName,
      reason: reason || `分类调整：${oldCategoryName || '无'}→${newCategory.name}`,
      beforeCategoryId: oldCategoryId,
      beforeCategoryName: oldCategoryName
    })

    await filter.update({
      categoryId: newCategoryId,
      categoryName: newCategory.name
    })

    await FilterEditLog.create({
      filterId,
      filterCode: filter.filterCode,
      filterName: filter.name,
      editStep: 1,
      changeType: 'category_adjust',
      changedFields: ['categoryId', 'categoryName'],
      beforeData,
      afterData: filter.toJSON(),
      operatorId: userId,
      operatorName,
      reason: reason || `分类调整：${oldCategoryName || '无'}→${newCategory.name}`
    })

    await this._refreshCategoryStats(oldCategoryId)
    await this._refreshCategoryStats(newCategoryId)

    return {
      updated: true,
      filter: filter.toJSON(),
      adaptScore: validation.adaptScore
    }
  }

  async batchCategoryMigrate(filterIds, targetCategoryId, userId, options = {}) {
    const { operatorName = '' } = options
    const targetCategory = await Category.findByPk(targetCategoryId)
    if (!targetCategory) throw ApiError.notFound('目标分类不存在')

    const batchId = 'BATCH_CAT_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    const results = {
      total: filterIds.length,
      success: [],
      failed: [],
      filtered: [],
      batchId,
      targetCategoryId,
      targetCategoryName: targetCategory.name
    }

    for (const filterId of filterIds) {
      try {
        const filter = await FilterEffect.findByPk(filterId)
        if (!filter) {
          results.failed.push({ id: filterId, reason: '滤镜不存在' })
          continue
        }

        if (filter.categoryId === targetCategoryId) {
          results.filtered.push({
            id: filterId,
            filterCode: filter.filterCode,
            name: filter.name,
            reason: '已在目标分类中'
          })
          continue
        }

        const validation = await this.validateCategoryBind(filterId, targetCategoryId, userId)
        if (!validation.valid) {
          results.filtered.push({
            id: filterId,
            filterCode: filter.filterCode,
            name: filter.name,
            reason: validation.errors.join('；'),
            adaptScore: validation.adaptScore
          })
          continue
        }

        const oldCategoryId = filter.categoryId
        const oldCategoryName = filter.categoryName
        const beforeData = filter.toJSON()

        const existingPrimary = await FilterCategoryAdapt.findOne({
          where: { filterId, isPrimary: true }
        })
        if (existingPrimary) {
          await existingPrimary.update({ isPrimary: false, changeType: 'unbind' })
        }

        await FilterCategoryAdapt.create({
          filterId,
          filterCode: filter.filterCode,
          filterName: filter.name,
          categoryId: targetCategoryId,
          categoryName: targetCategory.name,
          adaptScore: validation.adaptScore,
          isMatched: validation.isMatched,
          isPrimary: true,
          filterScenes: filter.adaptScene || [],
          categorySceneRule: CATEGORY_SCENE_RULES[targetCategory.name] || [],
          bindType: 'migration',
          changeType: 'migrate',
          operatorId: userId,
          operatorName,
          reason: `批量分类迁移：${oldCategoryName || '无'}→${targetCategory.name}`,
          beforeCategoryId: oldCategoryId,
          beforeCategoryName: oldCategoryName,
          batchId
        })

        await filter.update({
          categoryId: targetCategoryId,
          categoryName: targetCategory.name
        })

        await FilterEditLog.create({
          filterId,
          filterCode: filter.filterCode,
          filterName: filter.name,
          editStep: 1,
          changeType: 'category_migrate',
          changedFields: ['categoryId', 'categoryName'],
          beforeData,
          afterData: filter.toJSON(),
          operatorId: userId,
          operatorName,
          batchId,
          reason: `批量分类迁移：${oldCategoryName || '无'}→${targetCategory.name}`
        })

        results.success.push({
          id: filterId,
          filterCode: filter.filterCode,
          name: filter.name,
          adaptScore: validation.adaptScore
        })
      } catch (err) {
        results.failed.push({ id: filterId, reason: err.message || '未知错误' })
      }
    }

    await this._refreshCategoryStats(targetCategoryId)
    return results
  }

  async traceCategoryAdapt(categoryId) {
    const category = await Category.findByPk(categoryId)
    if (!category) throw ApiError.notFound('分类不存在')

    const filters = await FilterEffect.findAll({
      where: { categoryId },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    })

    const adapts = await FilterCategoryAdapt.findAll({
      where: { categoryId },
      order: [['createdAt', 'DESC']]
    })

    const issues = []
    const duplicateBindFilterIds = new Set()
    const adaptsByFilter = {}
    for (const a of adapts) {
      if (!adaptsByFilter[a.filterId]) adaptsByFilter[a.filterId] = []
      adaptsByFilter[a.filterId].push(a)
    }

    for (const [fId, aList] of Object.entries(adaptsByFilter)) {
      const primaryBinds = aList.filter(a => a.isPrimary)
      if (primaryBinds.length > 1) {
        duplicateBindFilterIds.add(Number(fId))
        issues.push({
          type: 'duplicate_primary',
          severity: 'high',
          message: `滤镜ID=${fId}存在多个核心分类绑定`,
          filterId: Number(fId)
        })
      }
    }

    for (const filter of filters) {
      const filterAdapts = adaptsByFilter[filter.id] || []
      const primaryAdapt = filterAdapts.find(a => a.isPrimary)

      if (primaryAdapt && !primaryAdapt.isMatched) {
        issues.push({
          type: 'mismatch',
          severity: 'high',
          message: `滤镜「${filter.name}」与分类「${category.name}」适配不匹配(评分${primaryAdapt.adaptScore})`,
          filterId: filter.id
        })
      }

      const filterScenes = filter.adaptScene || []
      const catRuleScenes = CATEGORY_SCENE_RULES[category.name] || []
      const matchCount = filterScenes.filter(s => catRuleScenes.includes(s)).length
      const adaptScore = filterScenes.length > 0
        ? Math.round((matchCount / filterScenes.length) * 100)
        : (catRuleScenes.length > 0 ? 20 : 50)

      if (adaptScore < ADAPT_SCORE_THRESHOLD && !issues.some(i => i.filterId === filter.id && i.type === 'mismatch')) {
        issues.push({
          type: 'low_adapt',
          severity: 'medium',
          message: `滤镜「${filter.name}」当前适配度仅${adaptScore}分，建议重新分类`,
          filterId: filter.id
        })
      }
    }

    const otherCatFilters = await FilterCategoryAdapt.findAll({
      where: {
        filterId: { [Op.in]: filters.map(f => f.id) },
        categoryId: { [Op.ne]: categoryId },
        isPrimary: false
      }
    })

    const filterDetails = filters.map(f => {
      const fAdapts = (adaptsByFilter[f.id] || []).map(a => a.toJSON())
      const otherBinds = otherCatFilters
        .filter(o => o.filterId === f.id)
        .map(o => ({ categoryId: o.categoryId, categoryName: o.categoryName, bindType: o.bindType }))

      return {
        ...f.toJSON(),
        adaptRecords: fAdapts,
        otherCategoryBinds: otherBinds,
        useHeat: f.useHeat || 0,
        inUseCount: f.inUseCount || 0
      }
    })

    return {
      category: { id: category.id, name: category.name },
      filterCount: filters.length,
      filters: filterDetails,
      adaptRecords: adapts.map(a => a.toJSON()),
      issues,
      duplicateBindCount: duplicateBindFilterIds.size,
      mismatchCount: issues.filter(i => i.type === 'mismatch').length,
      overallValid: issues.filter(i => i.severity === 'high' || i.severity === 'critical').length === 0
    }
  }

  async getCategoryAdaptList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = {}

    if (params.categoryId) where.categoryId = params.categoryId
    if (params.isMatched !== undefined) where.isMatched = params.isMatched
    if (params.bindType) where.bindType = params.bindType
    if (params.changeType) where.changeType = params.changeType

    const { count, rows } = await FilterCategoryAdapt.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    })

    return { list: rows, total: count, page, pageSize }
  }

  async _refreshCategoryStats(categoryId) {
    if (!categoryId) return
    try {
      const count = await FilterEffect.count({ where: { categoryId } })
      cache.del('filter_list_*')
    } catch {}
  }

  async validateWeightAdjust(filterId, targetWeight, userId) {
    const filter = await FilterEffect.findByPk(filterId)
    if (!filter) throw ApiError.notFound('滤镜不存在')

    const errors = []

    if (targetWeight < WEIGHT_GLOBAL_MIN || targetWeight > WEIGHT_GLOBAL_MAX) {
      errors.push(`权重数值超出规范区间，允许范围：${WEIGHT_GLOBAL_MIN}-${WEIGHT_GLOBAL_MAX}`)
    }

    const qualityRange = WEIGHT_QUALITY_RANGES[filter.qualityLevel] || WEIGHT_QUALITY_RANGES.normal
    if (targetWeight < qualityRange.min || targetWeight > qualityRange.max) {
      errors.push(
        `当前滤镜质量等级为「${filter.qualityLevel}」，权重需在 ${qualityRange.min}-${qualityRange.max} 之间`
      )
    }

    const useHeat = filter.useHeat || 0
    const heatRange =
      WEIGHT_HEAT_RULES.find(r => useHeat >= r.minHeat && useHeat < r.maxHeat)?.range ||
      { min: 0, max: WEIGHT_GLOBAL_MAX }
    const matchPercent =
      targetWeight >= heatRange.min && targetWeight <= heatRange.max
        ? 100
        : targetWeight < heatRange.min
          ? Math.round((targetWeight / heatRange.min) * 100)
          : Math.round((heatRange.max / targetWeight) * 100)

    if (matchPercent < WEIGHT_MATCH_THRESHOLD) {
      errors.push(
        `权重与热度匹配度过低(${matchPercent}%)，当前热度${useHeat}对应权重区间${heatRange.min}-${heatRange.max}`
      )
    }

    const rating = Number(filter.userRating) || 0
    if (targetWeight > 500 && rating < WEIGHT_ADJUST_RATING_THRESHOLD) {
      errors.push(
        `低质量滤镜禁止设置高权重，当前好评率${(rating * 100).toFixed(0)}%低于${(WEIGHT_ADJUST_RATING_THRESHOLD * 100)}%，不得超过500`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
      matchPercent,
      heatRange,
      qualityRange,
      qualityLevel: filter.qualityLevel,
      useHeat,
      userRating: rating,
      suggestedWeight: qualityRange.default
    }
  }

  async adjustWeightStep(filterId, newWeight, userId, options = {}) {
    const { operatorName = '', reason = '' } = options
    const validation = await this.validateWeightAdjust(filterId, newWeight, userId)
    if (!validation.valid) {
      throw ApiError.badRequest(validation.errors.join('；'))
    }

    const filter = await FilterEffect.findByPk(filterId)
    if (!filter) throw ApiError.notFound('滤镜不存在')

    const beforeWeight = filter.sortWeight
    const beforeRecommend = filter.recommendWeight

    const beforeRank = await FilterEffect.count({
      where: {
        status: 'published',
        sortWeight: { [Op.gt]: beforeWeight }
      }
    })

    const beforeData = filter.toJSON()

    const newRecommend = Math.round(newWeight * 0.8)
    await filter.update({
      sortWeight: newWeight,
      recommendWeight: newRecommend,
      weightChangeCount: (filter.weightChangeCount || 0) + 1,
      lastWeightChangeAt: new Date(),
      weightRangeMin: validation.qualityRange.min,
      weightRangeMax: validation.qualityRange.max
    })

    const afterRank = await FilterEffect.count({
      where: {
        status: 'published',
        sortWeight: { [Op.gt]: newWeight }
      }
    })

    await FilterWeightLog.create({
      filterId,
      filterCode: filter.filterCode,
      filterName: filter.name,
      beforeWeight,
      afterWeight: newWeight,
      beforeRecommendWeight: beforeRecommend,
      afterRecommendWeight: newRecommend,
      useHeatAtAdjust: filter.useHeat || 0,
      userRatingAtAdjust: filter.userRating || 0,
      qualityLevelAtAdjust: filter.qualityLevel,
      changeType: 'manual',
      weightMatchScore: validation.matchPercent,
      matchIssues: validation.errors,
      operatorId: userId,
      operatorName,
      reason: reason || `权重微调：${beforeWeight}→${newWeight}`,
      sortRankBefore: beforeRank + 1,
      sortRankAfter: afterRank + 1,
      displayPriorityBefore: beforeRank < 10 ? 'TOP10' : beforeRank < 50 ? 'TOP50' : '普通',
      displayPriorityAfter: afterRank < 10 ? 'TOP10' : afterRank < 50 ? 'TOP50' : '普通'
    })

    await FilterEditLog.create({
      filterId,
      filterCode: filter.filterCode,
      filterName: filter.name,
      editStep: 1,
      changeType: 'weight_adjust',
      changedFields: ['sortWeight', 'recommendWeight', 'weightChangeCount', 'lastWeightChangeAt'],
      beforeData,
      afterData: filter.toJSON(),
      operatorId: userId,
      operatorName,
      reason: reason || `权重微调：${beforeWeight}→${newWeight}（推荐排序#${beforeRank + 1}→#${afterRank + 1}）`
    })

    cache.del('filter_list_*')

    return {
      updated: true,
      filter: filter.toJSON(),
      beforeWeight,
      afterWeight: newWeight,
      rankChange: (beforeRank + 1) - (afterRank + 1),
      matchScore: validation.matchPercent,
      suggestedWeight: validation.suggestedWeight
    }
  }

  async batchWeightConfig(filterIds, mode, userId, options = {}) {
    const { operatorName = '' } = options
    const batchId = 'BATCH_WEIGHT_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    const results = {
      total: filterIds.length,
      success: [],
      failed: [],
      filtered: [],
      batchId,
      excellentCount: 0,
      goodCount: 0,
      normalCount: 0,
      poorCount: 0
    }

    for (const filterId of filterIds) {
      try {
        const filter = await FilterEffect.findByPk(filterId)
        if (!filter) {
          results.failed.push({ id: filterId, reason: '滤镜不存在' })
          continue
        }

        const useHeat = filter.useHeat || 0
        const qualityLevel = filter.qualityLevel || 'normal'
        const rating = Number(filter.userRating) || 0
        const createdDays = Math.floor((Date.now() - new Date(filter.createdAt).getTime()) / 86400000)
        const isNew = createdDays <= NEW_FILTER_DAYS

        let targetWeight = filter.sortWeight
        if (mode === 'by_heat') {
          const heatRule =
            WEIGHT_HEAT_RULES.find(r => useHeat >= r.minHeat && useHeat < r.maxHeat) || WEIGHT_HEAT_RULES[0]
          targetWeight = Math.round((heatRule.range.min + heatRule.range.max) / 2)
        } else if (mode === 'by_quality') {
          const qr = WEIGHT_QUALITY_RANGES[qualityLevel] || WEIGHT_QUALITY_RANGES.normal
          targetWeight = qr.default
        } else if (mode === 'by_newest') {
          targetWeight = isNew ? Math.max(filter.sortWeight, 1500) : filter.sortWeight
        } else if (mode === 'auto') {
          const qr = WEIGHT_QUALITY_RANGES[qualityLevel] || WEIGHT_QUALITY_RANGES.normal
          let base = qr.default
          if (isNew) base = Math.max(base, 800)
          if (useHeat > 300) base = Math.min(base + 300, WEIGHT_GLOBAL_MAX)
          if (rating >= 0.9) base = Math.min(base + 200, WEIGHT_GLOBAL_MAX)
          targetWeight = Math.round(base)
        }

        if (results.poorCount !== undefined && qualityLevel === 'poor') results.poorCount++
        if (qualityLevel === 'normal') results.normalCount++
        if (qualityLevel === 'good') results.goodCount++
        if (qualityLevel === 'excellent') results.excellentCount++

        const validation = await this.validateWeightAdjust(filterId, targetWeight, userId)
        if (!validation.valid) {
          results.filtered.push({
            id: filterId,
            filterCode: filter.filterCode,
            name: filter.name,
            reason: validation.errors.join('；'),
            qualityLevel,
            useHeat,
            suggestedWeight: validation.suggestedWeight
          })
          continue
        }

        const beforeWeight = filter.sortWeight
        const beforeRecommend = filter.recommendWeight
        const beforeData = filter.toJSON()
        const newRecommend = Math.round(targetWeight * 0.8)

        await filter.update({
          sortWeight: targetWeight,
          recommendWeight: newRecommend,
          weightChangeCount: (filter.weightChangeCount || 0) + 1,
          lastWeightChangeAt: new Date(),
          weightRangeMin: validation.qualityRange.min,
          weightRangeMax: validation.qualityRange.max
        })

        await FilterWeightLog.create({
          filterId,
          filterCode: filter.filterCode,
          filterName: filter.name,
          beforeWeight,
          afterWeight: targetWeight,
          beforeRecommendWeight: beforeRecommend,
          afterRecommendWeight: newRecommend,
          useHeatAtAdjust: useHeat,
          userRatingAtAdjust: rating,
          qualityLevelAtAdjust: qualityLevel,
          changeType: 'batch',
          weightMatchScore: validation.matchPercent,
          matchIssues: validation.errors,
          operatorId: userId,
          operatorName,
          reason: `批量配置模式=${mode}：${beforeWeight}→${targetWeight}`,
          batchId
        })

        await FilterEditLog.create({
          filterId,
          filterCode: filter.filterCode,
          filterName: filter.name,
          editStep: 1,
          changeType: 'weight_batch',
          changedFields: ['sortWeight', 'recommendWeight'],
          beforeData,
          afterData: filter.toJSON(),
          operatorId: userId,
          operatorName,
          batchId,
          reason: `批量配置模式=${mode}：${beforeWeight}→${targetWeight}`
        })

        results.success.push({
          id: filterId,
          filterCode: filter.filterCode,
          name: filter.name,
          beforeWeight,
          afterWeight: targetWeight,
          qualityLevel,
          useHeat,
          matchScore: validation.matchPercent
        })
      } catch (err) {
        results.failed.push({ id: filterId, reason: err.message || '未知错误' })
      }
    }

    cache.del('filter_list_*')
    return results
  }

  async traceWeightHistory(filterId) {
    const filter = await FilterEffect.findByPk(filterId)
    if (!filter) throw ApiError.notFound('滤镜不存在')

    const logs = await FilterWeightLog.findAll({
      where: { filterId },
      order: [['createdAt', 'DESC']]
    })

    const issues = []
    for (const log of logs) {
      if (log.weightMatchScore < WEIGHT_MATCH_THRESHOLD) {
        issues.push({
          type: 'weight_mismatch',
          severity: 'high',
          message: `权重错配：调整分数${log.weightMatchScore}%低于阈值${WEIGHT_MATCH_THRESHOLD}%`,
          logId: log.id,
          weight: log.afterWeight,
          heat: log.useHeatAtAdjust
        })
      }

      if (log.afterWeight > (WEIGHT_QUALITY_RANGES[log.qualityLevelAtAdjust]?.max || 500)) {
        issues.push({
          type: 'weight_quality_mismatch',
          severity: 'high',
          message: `质量等级「${log.qualityLevelAtAdjust}」权重虚高：${log.afterWeight}`,
          logId: log.id,
          weight: log.afterWeight,
          qualityLevel: log.qualityLevelAtAdjust
        })
      }
    }

    const avgMatchScore = logs.length > 0
      ? Math.round(logs.reduce((s, l) => s + Number(l.weightMatchScore), 0) / logs.length * 100) / 100
      : 0

    const virtualHighCount = issues.filter(i => i.type === 'weight_quality_mismatch').length
    const mismatchCount = issues.filter(i => i.type === 'weight_mismatch').length

    return {
      filter: filter.toJSON(),
      weightLogs: logs.map(l => l.toJSON()),
      totalAdjustments: logs.length,
      avgMatchScore,
      virtualHighCount,
      mismatchCount,
      overallValid: issues.filter(i => i.severity === 'high' || i.severity === 'critical').length === 0,
      issues,
      currentWeight: filter.sortWeight,
      currentRecommend: filter.recommendWeight,
      weightChangeCount: filter.weightChangeCount || 0
    }
  }

  async getWeightLogList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = {}

    if (params.filterId) where.filterId = params.filterId
    if (params.changeType) where.changeType = params.changeType
    if (params.operatorId) where.operatorId = params.operatorId

    const { count, rows } = await FilterWeightLog.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  }

  async delete(id) {
    const filter = await FilterEffect.findByPk(id)
    if (!filter) throw ApiError.notFound('滤镜不存在')
    if (filter.status === 'published' || filter.status === 'violation') {
      throw ApiError.badRequest('已上架或违规滤镜不可删除，请先变更状态')
    }
    await filter.destroy()
    return null
  }
}

module.exports = new FilterService()
