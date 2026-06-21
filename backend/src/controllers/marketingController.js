const { Op } = require('sequelize')
const { MarketingCampaign, MarketingAuditLog, Passenger } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const { validateCampaign, SCENE_CONFIG } = require('../services/marketingValidateService')
const { logAction, getAuditLogs, getRiskInterceptStats, ACTION_MAP } = require('../services/marketingAuditService')
const {
  USER_TAG_OPTIONS,
  EXCLUDE_TAG_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
  CONSUMPTION_LEVEL_OPTIONS,
  USER_LEVEL_OPTIONS,
  AUDIENCE_PURPOSE_CONFIG,
  getAudiencePreview,
  applyPurposeStrategy,
  buildAudienceQuery
} = require('../services/marketingAudienceService')
const {
  AUDIENCE_ACTION_MAP,
  logAudienceAction,
  getAudienceLogs,
  getAudienceInterceptStats,
  calculateAudienceDiff
} = require('../services/marketingAudienceAuditService')

const getOperatorInfo = (req) => {
  return {
    id: req.user?.id || 1,
    name: req.user?.nickname || req.user?.username || '系统',
    ip: req.ip || req.connection?.remoteAddress || '127.0.0.1'
  }
}

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      scene,
      type,
      status,
      targetUser,
      city,
      keyword,
      startDate,
      endDate
    } = req.query

    const where = {}

    if (scene !== undefined && scene !== '') where.scene = scene
    if (type !== undefined && type !== '') where.type = type
    if (status !== undefined && status !== '') where.status = status
    if (targetUser !== undefined && targetUser !== '') where.targetUser = targetUser
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ]
    }

    if (city) {
      where[Op.and] = [
        {
          [Op.or]: [
            { cities: { [Op.is]: null } },
            { cities: { [Op.like]: `%${city}%` } }
          ]
        }
      ]
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) where.startTime[Op.gte] = new Date(startDate)
      if (endDate) where.startTime[Op.lte] = new Date(endDate + ' 23:59:59')
    }

    const { count, rows } = await MarketingCampaign.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const campaign = await MarketingCampaign.findByPk(id, {
      include: [{
        model: MarketingAuditLog,
        as: 'auditLogs',
        order: [['createTime', 'DESC']],
        limit: 10
      }]
    })
    if (!campaign) throw new AppError('活动不存在', 404, 404)
    res.json(success(campaign))
  } catch (error) {
    next(error)
  }
}

const validateCampaignConfig = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const excludeId = id || null

    const result = await validateCampaign(data, excludeId)

    const operator = getOperatorInfo(req)
    await logAction({
      campaignId: excludeId || 0,
      campaignName: data.name || '未命名活动',
      action: 'validate',
      operatorId: operator.id,
      operatorName: operator.name,
      actionDetail: '活动配置预校验',
      validateResult: result,
      ip: operator.ip,
      riskLevel: result.riskLevel
    })

    res.json(success(result, '校验完成'))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    const operator = getOperatorInfo(req)

    const validation = await validateCampaign(data, null)
    if (!validation.valid) {
      await logAction({
        campaignId: 0,
        campaignName: data.name || '未命名活动',
        action: 'validate',
        operatorId: operator.id,
        operatorName: operator.name,
        actionDetail: '创建活动被拦截',
        validateResult: validation,
        ip: operator.ip,
        riskLevel: 3,
        remark: validation.errors.map(e => e.message).join('; ')
      })
      throw new AppError(
        '活动配置校验未通过：' + validation.errors.filter(e => e.blocking).map(e => e.message).join('；'),
        400, 400
      )
    }

    data.creatorId = operator.id
    data.creatorName = operator.name
    data.code = data.code || generateCampaignCode(data.scene)

    const campaign = await MarketingCampaign.create(data)

    await logAction({
      campaignId: campaign.id,
      campaignName: campaign.name,
      action: 'create',
      operatorId: operator.id,
      operatorName: operator.name,
      actionDetail: '创建营销活动',
      afterData: campaign.toJSON(),
      validateResult: validation,
      ip: operator.ip,
      riskLevel: validation.riskLevel
    })

    res.json(success(campaign, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const operator = getOperatorInfo(req)

    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    const beforeData = campaign.toJSON()

    if ([2].includes(campaign.status)) {
      throw new AppError('进行中的活动不允许修改，请先下线', 400, 400)
    }

    const validation = await validateCampaign(data, id)
    if (!validation.valid) {
      await logAction({
        campaignId: id,
        campaignName: campaign.name,
        action: 'validate',
        operatorId: operator.id,
        operatorName: operator.name,
        actionDetail: '修改活动被拦截',
        beforeData,
        afterData: data,
        validateResult: validation,
        ip: operator.ip,
        riskLevel: 3,
        remark: validation.errors.map(e => e.message).join('; ')
      })
      throw new AppError(
        '活动配置校验未通过：' + validation.errors.filter(e => e.blocking).map(e => e.message).join('；'),
        400, 400
      )
    }

    await campaign.update(data)

    await logAction({
      campaignId: campaign.id,
      campaignName: campaign.name,
      action: 'update',
      operatorId: operator.id,
      operatorName: operator.name,
      actionDetail: '修改营销活动',
      beforeData,
      afterData: campaign.toJSON(),
      validateResult: validation,
      ip: operator.ip,
      riskLevel: validation.riskLevel
    })

    res.json(success(campaign, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params
    const operator = getOperatorInfo(req)

    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    if ([1, 2].includes(campaign.status)) {
      throw new AppError('请先下线活动再删除', 400, 400)
    }

    const beforeData = campaign.toJSON()
    await campaign.destroy()

    await logAction({
      campaignId: id,
      campaignName: campaign.name,
      action: 'delete',
      operatorId: operator.id,
      operatorName: operator.name,
      actionDetail: '删除营销活动',
      beforeData,
      ip: operator.ip,
      riskLevel: 1
    })

    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const operator = getOperatorInfo(req)

    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    const beforeData = campaign.toJSON()
    const actionMap = { 1: 'online', 2: 'online', 3: 'offline', 4: 'offline', 5: 'offline' }
    const action = actionMap[status] || 'update'
    const actionDetailMap = {
      0: '转为草稿',
      1: '上线（待生效）',
      2: '上线（立即生效）',
      3: '暂停活动',
      4: '结束活动',
      5: '下线活动'
    }

    if (status === 1 || status === 2) {
      const validation = await validateCampaign(campaign.toJSON(), id)
      if (!validation.valid) {
        throw new AppError(
          '上线校验失败：' + validation.errors.filter(e => e.blocking).map(e => e.message).join('；'),
          400, 400
        )
      }
      await campaign.update({
        status,
        onlineTime: new Date()
      })
    } else if (status === 4 || status === 5) {
      await campaign.update({
        status,
        offlineTime: new Date()
      })
    } else {
      await campaign.update({ status })
    }

    await logAction({
      campaignId: campaign.id,
      campaignName: campaign.name,
      action,
      operatorId: operator.id,
      operatorName: operator.name,
      actionDetail: actionDetailMap[status] || `更新状态为${status}`,
      beforeData,
      afterData: campaign.toJSON(),
      ip: operator.ip,
      riskLevel: 0
    })

    res.json(success(campaign, `状态更新成功`))
  } catch (error) {
    next(error)
  }
}

const copyCampaign = async (req, res, next) => {
  try {
    const { id } = req.params
    const operator = getOperatorInfo(req)
    const { nameSuffix = '_副本', newCode = null } = req.body

    const source = await MarketingCampaign.findByPk(id)
    if (!source) throw new AppError('源活动不存在', 404, 404)

    const data = source.toJSON()
    delete data.id
    data.name = (data.name || '活动') + nameSuffix
    data.code = newCode || generateCampaignCode(data.scene)
    data.status = 0
    data.sourceCampaignId = id
    data.creatorId = operator.id
    data.creatorName = operator.name
    data.participantCount = 0
    data.orderCount = 0
    data.receiveCount = 0
    data.useCount = 0
    data.usedBudget = 0
    data.onlineTime = null
    data.offlineTime = null

    const validation = await validateCampaign(data, null)
    if (!validation.valid) {
      throw new AppError(
        '复制活动校验失败：' + validation.errors.filter(e => e.blocking).map(e => e.message).join('；'),
        400, 400
      )
    }

    const newCampaign = await MarketingCampaign.create(data)

    await logAction({
      campaignId: newCampaign.id,
      campaignName: newCampaign.name,
      action: 'copy',
      operatorId: operator.id,
      operatorName: operator.name,
      actionDetail: `复制自活动「${source.name}」(ID:${id})`,
      beforeData: source.toJSON(),
      afterData: newCampaign.toJSON(),
      validateResult: validation,
      ip: operator.ip,
      riskLevel: validation.riskLevel
    })

    res.json(success(newCampaign, '复制成功'))
  } catch (error) {
    next(error)
  }
}

const batchCopy = async (req, res, next) => {
  try {
    const { ids, nameSuffix = '_副本' } = req.body
    const operator = getOperatorInfo(req)
    const results = { success: [], failed: [] }

    for (const id of ids) {
      try {
        const source = await MarketingCampaign.findByPk(id)
        if (!source) {
          results.failed.push({ id, reason: '源活动不存在' })
          continue
        }

        const data = source.toJSON()
        delete data.id
        data.name = (data.name || '活动') + nameSuffix
        data.code = generateCampaignCode(data.scene)
        data.status = 0
        data.sourceCampaignId = id
        data.creatorId = operator.id
        data.creatorName = operator.name
        data.participantCount = 0
        data.orderCount = 0
        data.receiveCount = 0
        data.useCount = 0
        data.usedBudget = 0

        const newCampaign = await MarketingCampaign.create(data)
        results.success.push({ id, newId: newCampaign.id, name: newCampaign.name })
      } catch (err) {
        results.failed.push({ id, reason: err.message })
      }
    }

    await logAction({
      campaignId: 0,
      campaignName: `批量复制${ids.length}个活动`,
      action: 'batch_copy',
      operatorId: operator.id,
      operatorName: operator.name,
      actionDetail: `成功${results.success.length}个，失败${results.failed.length}个`,
      ip: operator.ip,
      riskLevel: results.failed.length > 0 ? 1 : 0
    })

    res.json(success(results, `批量复制完成：成功${results.success.length}个`))
  } catch (error) {
    next(error)
  }
}

const batchUpdate = async (req, res, next) => {
  try {
    const { ids, updateFields } = req.body
    const operator = getOperatorInfo(req)
    const results = { success: [], failed: [] }

    const allowedFields = [
      'endTime', 'dailyBudget', 'perUserLimit', 'perDayLimit',
      'totalCount', 'description', 'status', 'cities', 'vehicleTypes'
    ]

    const cleanUpdate = {}
    Object.keys(updateFields).forEach(key => {
      if (allowedFields.includes(key)) {
        cleanUpdate[key] = updateFields[key]
      }
    })

    if (Object.keys(cleanUpdate).length === 0) {
      throw new AppError('没有可更新的字段', 400, 400)
    }

    for (const id of ids) {
      try {
        const campaign = await MarketingCampaign.findByPk(id)
        if (!campaign) {
          results.failed.push({ id, reason: '活动不存在' })
          continue
        }
        if ([2].includes(campaign.status)) {
          results.failed.push({ id, reason: '进行中的活动不允许修改' })
          continue
        }

        const beforeData = campaign.toJSON()
        await campaign.update(cleanUpdate)

        results.success.push({ id, name: campaign.name })

        await logAction({
          campaignId: id,
          campaignName: campaign.name,
          action: 'batch_update',
          operatorId: operator.id,
          operatorName: operator.name,
          actionDetail: `批量更新字段: ${Object.keys(cleanUpdate).join(',')}`,
          beforeData,
          afterData: campaign.toJSON(),
          ip: operator.ip,
          riskLevel: 0
        })
      } catch (err) {
        results.failed.push({ id, reason: err.message })
      }
    }

    res.json(success(results, `批量更新完成：成功${results.success.length}个`))
  } catch (error) {
    next(error)
  }
}

const batchUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body
    const operator = getOperatorInfo(req)
    const results = { success: [], failed: [] }

    const actionMap = { 1: 'batch_online', 2: 'batch_online', 3: 'batch_offline', 5: 'batch_offline' }
    const action = actionMap[status] || 'batch_update'

    for (const id of ids) {
      try {
        const campaign = await MarketingCampaign.findByPk(id)
        if (!campaign) {
          results.failed.push({ id, reason: '活动不存在' })
          continue
        }

        if (status === 1 || status === 2) {
          const validation = await validateCampaign(campaign.toJSON(), id)
          if (!validation.valid) {
            results.failed.push({
              id,
              reason: '上线校验失败：' + validation.errors.filter(e => e.blocking).map(e => e.message).join('；')
            })
            continue
          }
        }

        const beforeData = campaign.toJSON()
        const updateData = { status }
        if (status === 1 || status === 2) updateData.onlineTime = new Date()
        if (status === 4 || status === 5) updateData.offlineTime = new Date()

        await campaign.update(updateData)
        results.success.push({ id, name: campaign.name })

        await logAction({
          campaignId: id,
          campaignName: campaign.name,
          action,
          operatorId: operator.id,
          operatorName: operator.name,
          actionDetail: status === 1 || status === 2 ? '批量上线' : '批量下线',
          beforeData,
          afterData: campaign.toJSON(),
          ip: operator.ip,
          riskLevel: 0
        })
      } catch (err) {
        results.failed.push({ id, reason: err.message })
      }
    }

    res.json(success(results, `批量操作完成：成功${results.success.length}个，失败${results.failed.length}个`))
  } catch (error) {
    next(error)
  }
}

const batchUpdateCityTier = async (req, res, next) => {
  try {
    const { ids, tierConfigs } = req.body
    const operator = getOperatorInfo(req)
    const results = { success: [], failed: [] }

    for (const id of ids) {
      try {
        const campaign = await MarketingCampaign.findByPk(id)
        if (!campaign) {
          results.failed.push({ id, reason: '活动不存在' })
          continue
        }

        const beforeData = campaign.toJSON()
        await campaign.update({ cityTierConfig: tierConfigs })
        results.success.push({ id, name: campaign.name })

        await logAction({
          campaignId: id,
          campaignName: campaign.name,
          action: 'batch_update',
          operatorId: operator.id,
          operatorName: operator.name,
          actionDetail: '更新城市圈层差异化配置',
          beforeData,
          afterData: campaign.toJSON(),
          ip: operator.ip,
          riskLevel: 0
        })
      } catch (err) {
        results.failed.push({ id, reason: err.message })
      }
    }

    res.json(success(results, `城市圈层配置完成：成功${results.success.length}个`))
  } catch (error) {
    next(error)
  }
}

const getStatistics = async (req, res, next) => {
  try {
    const { id } = req.params
    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    const budgetUsage = campaign.budget > 0
      ? ((campaign.usedBudget / campaign.budget) * 100).toFixed(1)
      : '0.0'
    const dailyBudgetUsage = campaign.dailyBudget > 0 && campaign.usedBudget > 0
      ? (((campaign.usedBudget / Math.max(1, Math.ceil((new Date(campaign.endTime) - new Date(campaign.startTime)) / (1000 * 60 * 60 * 24)))) / campaign.dailyBudget) * 100).toFixed(1)
      : null

    res.json(success({
      participantCount: campaign.participantCount,
      orderCount: campaign.orderCount,
      receiveCount: campaign.receiveCount,
      useCount: campaign.useCount,
      usedBudget: campaign.usedBudget,
      budget: campaign.budget,
      budgetUsage,
      dailyBudgetUsage,
      conversionRate: campaign.receiveCount > 0
        ? ((campaign.useCount / campaign.receiveCount) * 100).toFixed(1)
        : '0.0'
    }))
  } catch (error) {
    next(error)
  }
}

const getAuditList = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await getAuditLogs(id, req.query)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const getRiskStats = async (req, res, next) => {
  try {
    const result = await getRiskInterceptStats(req.query)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const getSceneConfig = async (req, res, next) => {
  try {
    const configs = Object.keys(SCENE_CONFIG).map(key => ({
      scene: parseInt(key),
      ...SCENE_CONFIG[key]
    }))
    res.json(success(configs))
  } catch (error) {
    next(error)
  }
}

const generateCampaignCode = (scene) => {
  const prefixMap = { 1: 'NEW', 2: 'HOL', 3: 'SUB', 4: 'REC' }
  const prefix = prefixMap[scene] || 'MK'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}_${timestamp}${random}`
}

const getAudienceConfig = async (req, res, next) => {
  try {
    res.json(success({
      userTags: USER_TAG_OPTIONS,
      excludeTags: EXCLUDE_TAG_OPTIONS,
      activityLevels: ACTIVITY_LEVEL_OPTIONS,
      consumptionLevels: CONSUMPTION_LEVEL_OPTIONS,
      userLevels: USER_LEVEL_OPTIONS,
      audiencePurposes: Object.keys(AUDIENCE_PURPOSE_CONFIG).map(key => ({
        purpose: parseInt(key),
        ...AUDIENCE_PURPOSE_CONFIG[key]
      }))
    }))
  } catch (error) {
    next(error)
  }
}

const applyAudienceStrategy = async (req, res, next) => {
  try {
    const { purpose } = req.params
    const data = req.body || {}
    const operator = getOperatorInfo(req)

    const applied = applyPurposeStrategy({ ...data }, parseInt(purpose))

    if (data.id) {
      await logAudienceAction({
        campaignId: data.id,
        action: 'purpose_update',
        audiencePurpose: parseInt(purpose),
        operatorId: operator.id,
        operatorName: operator.name,
        ipAddress: operator.ip,
        beforeRule: data,
        afterRule: applied,
        diffFields: calculateAudienceDiff(data, applied),
        remark: `切换人群策略为「${AUDIENCE_PURPOSE_CONFIG[purpose]?.name || '自定义'}」`
      })
    }

    res.json(success(applied, '人群策略已适配'))
  } catch (error) {
    next(error)
  }
}

const previewAudience = async (req, res, next) => {
  try {
    const data = req.body
    const operator = getOperatorInfo(req)

    const preview = await getAudiencePreview(data)

    if (data.id) {
      await logAudienceAction({
        campaignId: data.id,
        action: 'preview',
        audiencePurpose: data.audiencePurpose || 0,
        operatorId: operator.id,
        operatorName: operator.name,
        ipAddress: operator.ip,
        afterRule: data,
        affectedCount: preview.total,
        validCount: preview.valid,
        excludedRiskCount: preview.riskExcluded,
        excludedBlockedCount: preview.blockedExcluded,
        coveragePreview: preview
      })
    }

    res.json(success(preview, '人群预览计算完成'))
  } catch (error) {
    next(error)
  }
}

const batchImportAudience = async (req, res, next) => {
  try {
    const { id } = req.params
    const { userIds = [], phones = [], tagSource = 'manual' } = req.body
    const operator = getOperatorInfo(req)

    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    const beforeData = campaign.toJSON()
    let matchedUsers = []

    if (userIds && userIds.length > 0) {
      matchedUsers = await Passenger.findAll({
        where: { id: { [Op.in]: userIds }, status: 1 },
        attributes: ['id', 'phone', 'nickname', 'level', 'isRisk', 'travelRiskLevel']
      })
    } else if (phones && phones.length > 0) {
      matchedUsers = await Passenger.findAll({
        where: { phone: { [Op.in]: phones }, status: 1 },
        attributes: ['id', 'phone', 'nickname', 'level', 'isRisk', 'travelRiskLevel']
      })
    }

    const validUsers = matchedUsers.filter(u => !u.isRisk && u.travelRiskLevel < 4)
    const riskCount = matchedUsers.length - validUsers.length
    const validIds = validUsers.map(u => u.id)

    const currentIds = Array.isArray(campaign.targetedUserIds) ? campaign.targetedUserIds : []
    const mergedIds = [...new Set([...currentIds, ...validIds])]

    await campaign.update({
      targetedUserIds: mergedIds,
      audienceVersion: (campaign.audienceVersion || 0) + 1
    })

    const afterData = campaign.toJSON()

    await logAudienceAction({
      campaignId: id,
      action: 'import',
      audiencePurpose: campaign.audiencePurpose || 0,
      operatorId: operator.id,
      operatorName: operator.name,
      ipAddress: operator.ip,
      beforeRule: beforeData,
      afterRule: afterData,
      diffFields: [{
        field: 'targetedUserIds',
        before: currentIds.length,
        after: mergedIds.length,
        type: 'modified',
        added: validIds.length,
        duplicates: validIds.filter(id => currentIds.includes(id)).length
      }],
      affectedCount: matchedUsers.length,
      validCount: validUsers.length,
      excludedRiskCount: riskCount,
      remark: `从${tagSource}导入用户${matchedUsers.length}个，有效${validUsers.length}个，自动排除风险${riskCount}个`
    })

    res.json(success({
      totalImported: matchedUsers.length,
      validCount: validUsers.length,
      excludedRisk: riskCount,
      duplicates: validIds.filter(id => currentIds.includes(id)).length,
      totalAfter: mergedIds.length,
      sampleUsers: validUsers.slice(0, 10).map(u => ({
        id: u.id,
        phone: u.phone,
        nickname: u.nickname,
        level: u.level
      }))
    }, `批量导入完成，成功导入${validUsers.length}个有效用户`))
  } catch (error) {
    next(error)
  }
}

const batchExcludeAudience = async (req, res, next) => {
  try {
    const { id } = req.params
    const { userIds = [], phones = [], reason = '无效用户' } = req.body
    const operator = getOperatorInfo(req)

    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    const beforeData = campaign.toJSON()
    let matchedUsers = []

    if (userIds && userIds.length > 0) {
      matchedUsers = await Passenger.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'phone', 'nickname']
      })
    } else if (phones && phones.length > 0) {
      matchedUsers = await Passenger.findAll({
        where: { phone: { [Op.in]: phones } },
        attributes: ['id', 'phone', 'nickname']
      })
    }

    const matchedIds = matchedUsers.map(u => u.id)

    const currentExcluded = Array.isArray(campaign.excludedUserIds) ? campaign.excludedUserIds : []
    const currentTargeted = Array.isArray(campaign.targetedUserIds) ? campaign.targetedUserIds : []
    const mergedExcluded = [...new Set([...currentExcluded, ...matchedIds])]
    const filteredTargeted = currentTargeted.filter(id => !matchedIds.includes(id))

    await campaign.update({
      excludedUserIds: mergedExcluded,
      targetedUserIds: filteredTargeted,
      audienceVersion: (campaign.audienceVersion || 0) + 1
    })

    await logAudienceAction({
      campaignId: id,
      action: 'exclude',
      audiencePurpose: campaign.audiencePurpose || 0,
      operatorId: operator.id,
      operatorName: operator.name,
      ipAddress: operator.ip,
      beforeRule: beforeData,
      afterRule: campaign.toJSON(),
      affectedCount: matchedUsers.length,
      excludedInvalidCount: matchedIds.length,
      remark: `批量剔除无效用户：${reason}，共${matchedUsers.length}个`
    })

    res.json(success({
      totalExcluded: matchedUsers.length,
      removedFromTargeted: currentTargeted.filter(id => matchedIds.includes(id)).length,
      totalExcludedAfter: mergedExcluded.length
    }, `批量剔除完成，已排除${matchedUsers.length}个用户`))
  } catch (error) {
    next(error)
  }
}

const batchUpdateUserTags = async (req, res, next) => {
  try {
    const { id } = req.params
    const { addTags = [], removeTags = [], scope = 'targeted' } = req.body
    const operator = getOperatorInfo(req)

    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    const beforeData = campaign.toJSON()

    let currentTags = Array.isArray(campaign.userTags) ? campaign.userTags : []
    if (addTags && addTags.length > 0) {
      currentTags = [...new Set([...currentTags, ...addTags])]
    }
    if (removeTags && removeTags.length > 0) {
      currentTags = currentTags.filter(t => !removeTags.includes(t))
    }

    let affectedCount = 0
    if (scope === 'targeted' && campaign.targetedUserIds) {
      affectedCount = campaign.targetedUserIds.length
    }

    await campaign.update({
      userTags: currentTags,
      audienceVersion: (campaign.audienceVersion || 0) + 1
    })

    await logAudienceAction({
      campaignId: id,
      action: 'tag_update',
      audiencePurpose: campaign.audiencePurpose || 0,
      operatorId: operator.id,
      operatorName: operator.name,
      ipAddress: operator.ip,
      beforeRule: beforeData,
      afterRule: campaign.toJSON(),
      diffFields: [
        { field: 'userTags.added', value: addTags, type: 'added' },
        { field: 'userTags.removed', value: removeTags, type: 'removed' }
      ],
      affectedCount,
      remark: `批量更新用户标签：新增[${addTags.join(',')}]，移除[${removeTags.join(',')}]`
    })

    res.json(success({
      currentTags,
      addTags,
      removeTags,
      affectedCount
    }, '用户标签批量更新完成'))
  } catch (error) {
    next(error)
  }
}

const updateAudienceWeights = async (req, res, next) => {
  try {
    const { id } = req.params
    const { weightConfig } = req.body
    const operator = getOperatorInfo(req)

    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    const beforeData = campaign.toJSON()

    await campaign.update({
      userWeights: weightConfig,
      audienceVersion: (campaign.audienceVersion || 0) + 1
    })

    await logAudienceAction({
      campaignId: id,
      action: 'weight_update',
      audiencePurpose: campaign.audiencePurpose || 0,
      operatorId: operator.id,
      operatorName: operator.name,
      ipAddress: operator.ip,
      beforeRule: beforeData,
      afterRule: campaign.toJSON(),
      weightConfig,
      remark: '更新用户参与权重配置'
    })

    res.json(success(campaign, '参与权重配置已更新'))
  } catch (error) {
    next(error)
  }
}

const getCampaignAudienceLogs = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await getAudienceLogs(id, req.query)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const getAudienceRiskStats = async (req, res, next) => {
  try {
    const result = await getAudienceInterceptStats(req.query)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const verifyUserEligibility = async (req, res, next) => {
  try {
    const { campaignId, userId, phone } = req.body
    const operator = getOperatorInfo(req)

    const campaign = await MarketingCampaign.findByPk(campaignId)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    const userWhere = { status: 1 }
    if (userId) userWhere.id = userId
    else if (phone) userWhere.phone = phone
    else throw new AppError('缺少用户标识', 400, 400)

    const user = await Passenger.findOne({ where: userWhere })
    if (!user) {
      await logAudienceAction({
        campaignId,
        action: 'invalid_participation',
        operatorId: operator.id,
        operatorName: operator.name,
        userId: userId || 0,
        userPhone: phone,
        interceptionReason: '用户不存在或已被禁用',
        remark: '非定向用户参与被拦截'
      })
      return res.json(success({
        eligible: false,
        reason: '用户不存在或已被禁用',
        riskLevel: 3
      }))
    }

    if (user.isRisk || user.travelRiskLevel >= 4) {
      await logAudienceAction({
        campaignId,
        action: 'invalid_participation',
        operatorId: operator.id,
        operatorName: operator.name,
        userId: user.id,
        userPhone: user.phone,
        userLevel: user.level,
        tags: user.tags,
        interceptionReason: `高风险账号（riskLevel=${user.travelRiskLevel}）`,
        remark: '高风险用户参与被自动拦截'
      })
      return res.json(success({
        eligible: false,
        reason: '您的账号风控等级较高，暂无法参与本次活动',
        riskLevel: 3
      }))
    }

    if (campaign.excludedUserIds?.length && campaign.excludedUserIds.includes(user.id)) {
      await logAudienceAction({
        campaignId,
        action: 'invalid_participation',
        operatorId: operator.id,
        operatorName: operator.name,
        userId: user.id,
        userPhone: user.phone,
        interceptionReason: '用户在活动排除名单中',
        remark: '排除名单用户参与被拦截'
      })
      return res.json(success({
        eligible: false,
        reason: '抱歉，您暂不符合本次活动参与条件',
        riskLevel: 2
      }))
    }

    const audienceWhere = buildAudienceQuery(campaign)
    const matchUser = await Passenger.findOne({
      where: { ...audienceWhere, id: user.id }
    })

    if (!matchUser) {
      await logAudienceAction({
        campaignId,
        action: 'invalid_participation',
        operatorId: operator.id,
        operatorName: operator.name,
        userId: user.id,
        userPhone: user.phone,
        interceptionReason: '用户不满足定向筛选条件',
        remark: '非定向人群参与被拦截'
      })
      return res.json(success({
        eligible: false,
        reason: '抱歉，您暂不符合本次活动参与条件',
        riskLevel: 2
      }))
    }

    await logAudienceAction({
      campaignId,
      action: 'participate',
      operatorId: operator.id,
      operatorName: operator.name,
      userId: user.id,
      userPhone: user.phone,
      userLevel: user.level,
      tags: user.tags,
      remark: '用户通过定向校验，参与活动'
    })

    return res.json(success({
      eligible: true,
      userId: user.id,
      userLevel: user.level,
      weight: 1
    }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  validateCampaignConfig,
  create,
  update,
  delete: deleteCampaign,
  updateStatus,
  copyCampaign,
  batchCopy,
  batchUpdate,
  batchUpdateStatus,
  batchUpdateCityTier,
  getStatistics,
  getAuditList,
  getRiskStats,
  getSceneConfig,
  getAudienceConfig,
  applyAudienceStrategy,
  previewAudience,
  batchImportAudience,
  batchExcludeAudience,
  batchUpdateUserTags,
  updateAudienceWeights,
  getCampaignAudienceLogs,
  getAudienceRiskStats,
  verifyUserEligibility
}
