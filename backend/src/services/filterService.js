const { FilterEffect, FilterEditLog, Category, OperationLog } = require('../models')
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
