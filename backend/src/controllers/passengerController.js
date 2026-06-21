const { Op } = require('sequelize')
const { Passenger, PassengerAuditLog, PassengerOperationLog, RiskRecord, Order, PassengerTravelRisk, PassengerExportTask, PassengerBehaviorReport, OrderStatusLog, Ticket } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      nickname,
      phone,
      status
    } = req.query

    const where = {}

    if (nickname) where.nickname = { [Op.like]: `%${nickname}%` }
    if (phone) where.phone = { [Op.like]: `%${phone}%` }
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await Passenger.findAndCountAll({
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
    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)
    res.json(success(passenger))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    const passenger = await Passenger.create(data)
    res.json(success(passenger, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)
    await passenger.update(data)
    res.json(success(passenger, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deletePassenger = async (req, res, next) => {
  try {
    const { id } = req.params
    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)
    await passenger.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)
    await passenger.update({ status })
    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

const validatePhone = async (req, res, next) => {
  try {
    const { phone, id } = req.query

    if (!phone) {
      return res.json(success({ valid: false, message: '手机号不能为空' }))
    }

    const where = { phone }
    if (id) where.id = { [Op.ne]: parseInt(id) }

    const existing = await Passenger.findOne({ where })
    if (existing) {
      return res.json(success({ valid: false, message: '该手机号已被其他用户使用' }))
    }

    res.json(success({ valid: true, message: '手机号可用' }))
  } catch (error) {
    next(error)
  }
}

const validateIdCard = async (req, res, next) => {
  try {
    const { idCard, realName, passengerId } = req.body

    if (!idCard || !realName) {
      return res.json(success({ valid: false, message: '身份证号和姓名不能为空' }))
    }

    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
    if (!idCardRegex.test(idCard)) {
      return res.json(success({ valid: false, message: '身份证号格式不正确' }))
    }

    const idCardBirthday = idCard.substring(6, 14)
    const idCardGenderCode = parseInt(idCard.substring(16, 17))
    const idCardGender = idCardGenderCode % 2 === 1 ? '男' : '女'

    const where = { idCard }
    if (passengerId) where.id = { [Op.ne]: parseInt(passengerId) }

    const existing = await Passenger.findOne({ where })
    if (existing) {
      return res.json(success({ valid: false, message: '该身份证已被其他用户实名使用' }))
    }

    res.json(success({
      valid: true,
      message: '身份证校验通过',
      birthday: idCardBirthday,
      gender: idCardGender
    }))
  } catch (error) {
    next(error)
  }
}

const validateBeforeUpdate = async (req, res, next) => {
  try {
    const { id } = req.params
    const { fields = '' } = req.query
    const fieldList = fields.split(',').filter(f => f.trim())

    const passenger = await Passenger.findByPk(id)
    if (!passenger) {
      return res.json(success({ valid: false, canEdit: {}, message: '乘客不存在' }))
    }

    if (passenger.status !== 1) {
      return res.json(success({ valid: false, canEdit: {}, message: '账号状态异常，禁止修改' }))
    }

    if (passenger.securityLevel < 2) {
      return res.json(success({ valid: false, canEdit: {}, message: '账号安全等级不足，禁止修改核心信息' }))
    }

    const canEdit = {}
    const sensitiveFields = ['phone', 'realName', 'idCard', 'address']
    const isRealName = passenger.realNameStatus === 2
    const realNameExpired = passenger.realNameExpireTime && new Date(passenger.realNameExpireTime) < new Date()

    if (isRealName && realNameExpired) {
      return res.json(success({ valid: false, canEdit: {}, message: '实名信息已过期，请重新实名后操作' }))
    }

    if (fieldList.length === 0) {
      sensitiveFields.forEach(field => {
        canEdit[field] = isRealName
      })
    } else {
      fieldList.forEach(field => {
        if (sensitiveFields.includes(field)) {
          canEdit[field] = isRealName
        } else {
          canEdit[field] = true
        }
      })
    }

    const hasRestrictedField = Object.entries(canEdit).some(([field, editable]) => {
      return sensitiveFields.includes(field) && !editable
    })

    if (hasRestrictedField) {
      return res.json(success({
        valid: false,
        canEdit,
        message: '未实名账号禁止修改核心隐私信息，请先完成实名认证'
      }))
    }

    res.json(success({
      valid: true,
      canEdit,
      message: '校验通过，可以修改'
    }))
  } catch (error) {
    next(error)
  }
}

const updateWithValidation = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    if (passenger.status !== 1) throw new AppError('账号状态异常，禁止修改', 400)

    const beforeData = passenger.toJSON()

    if (data.phone && data.phone !== passenger.phone) {
      const existingPhone = await Passenger.findOne({
        where: { phone: data.phone, id: { [Op.ne]: parseInt(id) } }
      })
      if (existingPhone) throw new AppError('该手机号已被其他用户使用', 400)
    }

    if (data.idCard && data.idCard !== passenger.idCard) {
      const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
      if (!idCardRegex.test(data.idCard)) throw new AppError('身份证号格式不正确', 400)

      const existingIdCard = await Passenger.findOne({
        where: { idCard: data.idCard, id: { [Op.ne]: parseInt(id) } }
      })
      if (existingIdCard) throw new AppError('该身份证已被其他用户实名使用', 400)
    }

    await passenger.update(data)

    const changedFields = Object.keys(data)
    let operationType = 1
    if (changedFields.includes('phone')) operationType = 1
    else if (changedFields.includes('realName') || changedFields.includes('idCard')) operationType = 2
    else if (changedFields.includes('address')) operationType = 3

    await PassengerAuditLog.create({
      passengerId: id,
      operatorId: req.user?.id,
      operatorName: req.user?.username,
      operationType,
      beforeData,
      afterData: passenger.toJSON(),
      changeReason: '用户信息更新',
      status: 1
    })

    await PassengerOperationLog.create({
      passengerId: id,
      operationType: changedFields.includes('phone') ? 1 : changedFields.includes('address') ? 3 : 1,
      beforeValue: JSON.stringify(beforeData),
      afterValue: JSON.stringify(passenger.toJSON()),
      operatorType: req.user ? 2 : 1,
      operatorId: req.user?.id,
      ip: req.ip,
      deviceInfo: req.headers['user-agent'],
      riskLevel: 1
    })

    if (changedFields.includes('orderFrequency') || changedFields.includes('reputationScore') || changedFields.includes('totalOrders')) {
      const now = new Date()
      const registerTime = passenger.registerTime || now
      const monthsRegistered = Math.max(1, Math.floor((now - new Date(registerTime)) / (1000 * 60 * 60 * 24 * 30)))
      const orderFrequency = passenger.orderFrequency || 0
      const reputationScore = parseFloat(passenger.reputationScore) || 100
      const totalOrders = passenger.totalOrders || 0

      let newLevel = 1
      if (monthsRegistered >= 6 && orderFrequency >= 10 && reputationScore >= 95 && totalOrders >= 100) newLevel = 5
      else if (monthsRegistered >= 3 && orderFrequency >= 5 && reputationScore >= 90 && totalOrders >= 50) newLevel = 4
      else if (monthsRegistered >= 2 && orderFrequency >= 3 && reputationScore >= 85 && totalOrders >= 20) newLevel = 3
      else if (monthsRegistered >= 1 && orderFrequency >= 1 && reputationScore >= 80 && totalOrders >= 5) newLevel = 2

      if (newLevel !== passenger.level) {
        await passenger.update({ level: newLevel })
      }
    }

    res.json(success(passenger, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const calculateLevel = async (req, res, next) => {
  try {
    const { id } = req.params

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const oldLevel = passenger.level
    const oldTags = passenger.tags || []

    const now = new Date()
    const registerTime = passenger.registerTime || now
    const monthsRegistered = Math.max(1, Math.floor((now - new Date(registerTime)) / (1000 * 60 * 60 * 24 * 30)))
    const orderFrequency = passenger.orderFrequency || 0
    const reputationScore = parseFloat(passenger.reputationScore) || 100
    const totalOrders = passenger.totalOrders || 0

    let newLevel = 1
    if (monthsRegistered >= 6 && orderFrequency >= 10 && reputationScore >= 95 && totalOrders >= 100) newLevel = 5
    else if (monthsRegistered >= 3 && orderFrequency >= 5 && reputationScore >= 90 && totalOrders >= 50) newLevel = 4
    else if (monthsRegistered >= 2 && orderFrequency >= 3 && reputationScore >= 85 && totalOrders >= 20) newLevel = 3
    else if (monthsRegistered >= 1 && orderFrequency >= 1 && reputationScore >= 80 && totalOrders >= 5) newLevel = 2

    const benefitsChanged = []
    if (newLevel !== oldLevel) {
      const levelNames = { 1: '普通', 2: '银卡', 3: '金卡', 4: '铂金', 5: '钻石' }
      if (newLevel > oldLevel) {
        if (newLevel >= 2) benefitsChanged.push('优惠券权益提升')
        if (newLevel >= 3) benefitsChanged.push('下单优先级提升')
        if (newLevel >= 4) benefitsChanged.push('客服响应速度提升')
        if (newLevel >= 5) benefitsChanged.push('专属客服服务')
      }

      await passenger.update({ level: newLevel })

      await PassengerAuditLog.create({
        passengerId: id,
        operatorId: req.user?.id,
        operatorName: req.user?.username || '系统',
        operationType: 4,
        beforeData: { level: oldLevel },
        afterData: { level: newLevel },
        changeReason: `等级由${levelNames[oldLevel]}变更为${levelNames[newLevel]}`,
        status: 1
      })
    }

    const baseTags = ['活跃用户']
    if (orderFrequency >= 5) baseTags.push('高频用户')
    if (reputationScore >= 95) baseTags.push('优质用户')
    if (totalOrders >= 50) baseTags.push('忠诚用户')
    if (newLevel >= 3) baseTags.push('高价值用户')

    const uniqueTags = [...new Set([...oldTags, ...baseTags])]
    await passenger.update({ tags: uniqueTags })

    if (JSON.stringify(oldTags) !== JSON.stringify(uniqueTags)) {
      await PassengerAuditLog.create({
        passengerId: id,
        operatorId: req.user?.id,
        operatorName: req.user?.username || '系统',
        operationType: 5,
        beforeData: { tags: oldTags },
        afterData: { tags: uniqueTags },
        changeReason: '用户标签自动更新',
        status: 1
      })
    }

    res.json(success({
      oldLevel,
      newLevel,
      benefitsChanged,
      tags: uniqueTags
    }, '等级计算完成'))
  } catch (error) {
    next(error)
  }
}

const batchOperation = async (req, res, next) => {
  try {
    const { ids, operationType, params = {} } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的账号', 400)
    }

    if (!['wakeup', 'verify', 'risk_mark'].includes(operationType)) {
      throw new AppError('无效的操作类型', 400)
    }

    const passengers = await Passenger.findAll({
      where: { id: { [Op.in]: ids } }
    })

    const normalPassengers = passengers.filter(p => p.status === 1)
    const bannedPassengers = passengers.filter(p => p.status !== 1)

    const results = []
    let successCount = 0
    let failCount = 0

    for (const passenger of normalPassengers) {
      try {
        let result = { id: passenger.id, nickname: passenger.nickname, success: true }

        switch (operationType) {
          case 'wakeup':
            result.message = '已发送唤醒通知'
            break
          case 'verify':
            await passenger.update({ realNameStatus: 1 })
            result.message = '已提交实名认证审核'
            break
          case 'risk_mark':
            await passenger.update({ isRisk: true })
            await RiskRecord.create({
              ruleId: 0,
              ruleName: params.ruleName || '手动风险标记',
              ruleCode: 'MANUAL_MARK',
              targetType: 3,
              targetId: passenger.id,
              targetName: passenger.nickname,
              riskType: params.riskType || 99,
              severity: params.severity || 2,
              action: params.action || 1,
              detail: params.reason || '管理员手动标记风险',
              status: 0
            })
            result.message = '已标记为风险账号'
            break
        }

        await PassengerAuditLog.create({
          passengerId: passenger.id,
          operatorId: req.user?.id,
          operatorName: req.user?.username,
          operationType: operationType === 'risk_mark' ? 6 : 1,
          beforeData: passenger.toJSON(),
          afterData: passenger.toJSON(),
          changeReason: `批量操作: ${operationType}`,
          status: 1
        })

        successCount++
        results.push(result)
      } catch (err) {
        failCount++
        results.push({
          id: passenger.id,
          nickname: passenger.nickname,
          success: false,
          message: err.message
        })
      }
    }

    for (const passenger of bannedPassengers) {
      failCount++
      results.push({
        id: passenger.id,
        nickname: passenger.nickname,
        success: false,
        message: '账号已封禁，无法执行操作'
      })
    }

    res.json(success({
      successCount,
      failCount,
      results
    }, '批量操作完成'))
  } catch (error) {
    next(error)
  }
}

const getAuditLogs = async (req, res, next) => {
  try {
    const { id } = req.params
    const { page = 1, pageSize = 10, operationType, status } = req.query

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const where = { passengerId: id }
    if (operationType) where.operationType = operationType
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await PassengerAuditLog.findAndCountAll({
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

const getOperationLogs = async (req, res, next) => {
  try {
    const { id } = req.params
    const { page = 1, pageSize = 10, operationType, riskLevel, isBlocked } = req.query

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const where = { passengerId: id }
    if (operationType) where.operationType = operationType
    if (riskLevel) where.riskLevel = riskLevel
    if (isBlocked !== undefined && isBlocked !== '') where.isBlocked = isBlocked

    const { count, rows } = await PassengerOperationLog.findAndCountAll({
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

const getRiskOverview = async (req, res, next) => {
  try {
    const { id } = req.params

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const riskRecords = await RiskRecord.findAll({
      where: { targetType: 3, targetId: id },
      order: [['createTime', 'DESC']],
      limit: 10
    })

    const pendingRiskCount = await RiskRecord.count({
      where: { targetType: 3, targetId: id, status: 0 }
    })

    const highRiskCount = await RiskRecord.count({
      where: { targetType: 3, targetId: id, severity: 3 }
    })

    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    const recentOpLogs = await PassengerOperationLog.findAll({
      where: {
        passengerId: id,
        createTime: { [Op.gte]: lastWeek }
      },
      order: [['createTime', 'DESC']]
    })

    const abnormalOps = recentOpLogs.filter(log => log.riskLevel >= 2 || log.isBlocked === 1)

    const now = new Date()
    const registerTime = passenger.registerTime || now
    const monthsRegistered = Math.max(1, Math.floor((now - new Date(registerTime)) / (1000 * 60 * 60 * 24 * 30)))
    const orderFrequency = passenger.orderFrequency || 0
    const reputationScore = parseFloat(passenger.reputationScore) || 100
    const totalOrders = passenger.totalOrders || 0

    let expectedLevel = 1
    if (monthsRegistered >= 6 && orderFrequency >= 10 && reputationScore >= 95 && totalOrders >= 100) expectedLevel = 5
    else if (monthsRegistered >= 3 && orderFrequency >= 5 && reputationScore >= 90 && totalOrders >= 50) expectedLevel = 4
    else if (monthsRegistered >= 2 && orderFrequency >= 3 && reputationScore >= 85 && totalOrders >= 20) expectedLevel = 3
    else if (monthsRegistered >= 1 && orderFrequency >= 1 && reputationScore >= 80 && totalOrders >= 5) expectedLevel = 2

    const levelAbnormal = expectedLevel !== passenger.level

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const loginAbnormal = !passenger.lastLoginTime || new Date(passenger.lastLoginTime) < thirtyDaysAgo

    res.json(success({
      passenger: {
        id: passenger.id,
        nickname: passenger.nickname,
        phone: passenger.phone,
        status: passenger.status,
        level: passenger.level,
        expectedLevel,
        isRisk: passenger.isRisk,
        securityLevel: passenger.securityLevel,
        realNameStatus: passenger.realNameStatus,
        reputationScore: passenger.reputationScore
      },
      riskSummary: {
        totalRecords: riskRecords.length,
        pendingCount: pendingRiskCount,
        highRiskCount,
        isMarkedRisk: passenger.isRisk
      },
      riskRecords,
      operationAbnormal: {
        recentOpsCount: recentOpLogs.length,
        abnormalOpsCount: abnormalOps.length,
        abnormalOps,
        loginAbnormal
      },
      levelAbnormal: {
        abnormal: levelAbnormal,
        currentLevel: passenger.level,
        expectedLevel
      },
      suggestions: [
        ...(pendingRiskCount > 0 ? ['存在待处理风险记录，请及时处理'] : []),
        ...(highRiskCount > 0 ? ['存在高风险记录，建议重点关注'] : []),
        ...(levelAbnormal ? ['用户等级与实际情况不符，建议重新计算等级'] : []),
        ...(loginAbnormal ? ['用户长期未登录，建议进行用户唤醒'] : []),
        ...(abnormalOps.length > 0 ? ['检测到异常操作行为，建议加强监控'] : [])
      ]
    }))
  } catch (error) {
    next(error)
  }
}

const updateTags = async (req, res, next) => {
  try {
    const { id } = req.params
    const { tags = [] } = req.body

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const beforeData = passenger.toJSON()
    const oldTags = passenger.tags || []

    const baseTags = []
    if (passenger.orderFrequency >= 5) baseTags.push('高频用户')
    if (passenger.reputationScore >= 95) baseTags.push('优质用户')
    if (passenger.totalOrders >= 50) baseTags.push('忠诚用户')
    if (passenger.level >= 3) baseTags.push('高价值用户')

    const mergedTags = [...new Set([...baseTags, ...tags])]
    await passenger.update({ tags: mergedTags })

    await PassengerAuditLog.create({
      passengerId: id,
      operatorId: req.user?.id,
      operatorName: req.user?.username,
      operationType: 5,
      beforeData: { tags: oldTags },
      afterData: { tags: mergedTags },
      changeReason: '用户标签更新',
      status: 1
    })

    res.json(success({ tags: mergedTags }, '标签更新成功'))
  } catch (error) {
    next(error)
  }
}

const getTravelRecords = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      page = 1,
      pageSize = 10,
      startTime,
      endTime,
      travelCity,
      capacityType,
      minAmount,
      maxAmount,
      status
    } = req.query

    if (req.user && !['operation', 'risk', 'admin'].includes(req.user.roleCode || '')) {
      return res.json(success({ canViewFull: false, message: '您无权查看完整出行轨迹' }))
    }

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const conflicts = []
    if (startTime && endTime && new Date(startTime) > new Date(endTime)) {
      conflicts.push('开始时间不能晚于结束时间')
    }
    if (minAmount !== undefined && maxAmount !== undefined && parseFloat(minAmount) > parseFloat(maxAmount)) {
      conflicts.push('最小金额不能大于最大金额')
    }
    if (conflicts.length > 0) {
      return res.json(success({ valid: false, conflicts, message: '筛选条件冲突' }))
    }

    const where = { passengerId: id }
    if (startTime) where.createTime = { ...where.createTime, [Op.gte]: new Date(startTime) }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: new Date(endTime) }
    if (capacityType !== undefined && capacityType !== '') where.capacityType = capacityType
    if (status !== undefined && status !== '') where.status = status
    if (minAmount !== undefined && minAmount !== '') where.actualPrice = { ...where.actualPrice, [Op.gte]: parseFloat(minAmount) }
    if (maxAmount !== undefined && maxAmount !== '') where.actualPrice = { ...where.actualPrice, [Op.lte]: parseFloat(maxAmount) }

    const { count, rows } = await Order.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    const result = rows.map(order => {
      const orderData = order.toJSON()
      if (req.user && !['operation', 'risk', 'admin'].includes(req.user.roleCode || '')) {
        orderData.startAddress = orderData.startAddress ? orderData.startAddress.replace(/(.{3}).*(.{3})/, '$1***$2') : null
        orderData.endAddress = orderData.endAddress ? orderData.endAddress.replace(/(.{3}).*(.{3})/, '$1***$2') : null
        orderData.startLng = null
        orderData.startLat = null
        orderData.endLng = null
        orderData.endLat = null
      }
      return orderData
    })

    const stats = {
      totalOrders: count,
      totalAmount: rows.reduce((sum, o) => sum + (parseFloat(o.actualPrice) || 0), 0).toFixed(2),
      cancelCount: rows.filter(o => o.status === 6).length,
      completeCount: rows.filter(o => o.status === 5).length
    }

    res.json(pageResult({
      list: result,
      stats,
      canViewFull: true
    }, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const calculateTravelRisk = async (req, res, next) => {
  try {
    const { id } = req.params

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentOrders = await Order.findAll({
      where: { passengerId: id, createTime: { [Op.gte]: thirtyDaysAgo } }
    })

    const cancelCount = recentOrders.filter(o => o.status === 6).length
    const totalCount = recentOrders.length || 1
    const cancelRate = (cancelCount / totalCount) * 100

    const recentComplaints = await Ticket.count({
      where: { passengerId: id, createTime: { [Op.gte]: thirtyDaysAgo }, type: 2 }
    })

    const maliciousComplaints = await PassengerTravelRisk.count({
      where: { passengerId: id, riskType: 3, createTime: { [Op.gte]: thirtyDaysAgo } }
    })

    let riskScore = 0
    if (cancelRate >= 50) riskScore += 30
    else if (cancelRate >= 30) riskScore += 20
    else if (cancelRate >= 15) riskScore += 10

    if (passenger.lateCount >= 5) riskScore += 20
    else if (passenger.lateCount >= 3) riskScore += 10

    if (maliciousComplaints >= 3) riskScore += 30
    else if (maliciousComplaints >= 1) riskScore += 15

    riskScore = Math.min(100, riskScore)

    let riskLevel = 1
    if (riskScore >= 80) riskLevel = 5
    else if (riskScore >= 60) riskLevel = 4
    else if (riskScore >= 40) riskLevel = 3
    else if (riskScore >= 20) riskLevel = 2

    const oldRiskLevel = passenger.travelRiskLevel
    const restrictionsChanged = []

    const updates = {
      cancelCount: passenger.cancelCount,
      cancelRate: cancelRate.toFixed(2),
      complaintCount: passenger.complaintCount,
      maliciousComplaintCount: maliciousComplaints,
      travelRiskLevel: riskLevel,
      travelRiskScore: riskScore.toFixed(2)
    }

    if (riskLevel >= 4 && !passenger.isOrderRestricted) {
      updates.isOrderRestricted = true
      updates.riskRestrictionStartTime = new Date()
      restrictionsChanged.push('已限制临时下单')
    } else if (riskLevel < 4 && passenger.isOrderRestricted) {
      updates.isOrderRestricted = false
      updates.riskRestrictionEndTime = new Date()
      restrictionsChanged.push('已恢复临时下单权限')
    }

    if (riskLevel >= 3 && !passenger.isPremiumDiscountRestricted) {
      updates.isPremiumDiscountRestricted = true
      restrictionsChanged.push('已限制溢价减免权益')
    } else if (riskLevel < 3 && passenger.isPremiumDiscountRestricted) {
      updates.isPremiumDiscountRestricted = false
      restrictionsChanged.push('已恢复溢价减免权益')
    }

    await passenger.update(updates)

    if (oldRiskLevel !== riskLevel) {
      await PassengerTravelRisk.create({
        passengerId: id,
        riskType: 5,
        riskLevel: Math.min(4, riskLevel),
        riskScore: Math.abs(riskScore - (passenger.travelRiskScore || 0)),
        description: `出行风险等级由${oldRiskLevel}变更为${riskLevel}`,
        triggeredRestrictions: restrictionsChanged
      })

      await PassengerAuditLog.create({
        passengerId: id,
        operatorId: req.user?.id,
        operatorName: req.user?.username || '系统',
        operationType: 6,
        beforeData: { travelRiskLevel: oldRiskLevel, isOrderRestricted: passenger.isOrderRestricted },
        afterData: { travelRiskLevel: riskLevel, isOrderRestricted: updates.isOrderRestricted },
        changeReason: '出行风险自动重算',
        status: 1
      })
    }

    res.json(success({
      oldRiskLevel,
      newRiskLevel: riskLevel,
      riskScore,
      cancelRate,
      maliciousComplaints,
      restrictionsChanged,
      isOrderRestricted: updates.isOrderRestricted !== undefined ? updates.isOrderRestricted : passenger.isOrderRestricted,
      isPremiumDiscountRestricted: updates.isPremiumDiscountRestricted !== undefined ? updates.isPremiumDiscountRestricted : passenger.isPremiumDiscountRestricted
    }, '风险等级计算完成'))
  } catch (error) {
    next(error)
  }
}

const getTravelRiskList = async (req, res, next) => {
  try {
    const { id } = req.params
    const { page = 1, pageSize = 10, riskType, riskLevel, status } = req.query

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const where = { passengerId: id }
    if (riskType) where.riskType = riskType
    if (riskLevel) where.riskLevel = riskLevel
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await PassengerTravelRisk.findAndCountAll({
      where,
      include: [{ model: Order, as: 'order', attributes: ['orderNo', 'status', 'actualPrice'] }],
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const createExportTask = async (req, res, next) => {
  try {
    const {
      taskName,
      exportType = 1,
      filterParams = {},
      sortRules = [],
      fieldList = [],
      isDesensitized = true
    } = req.body

    if (!taskName) throw new AppError('请输入任务名称', 400)

    const where = {}
    if (filterParams.travelRiskLevel) where.travelRiskLevel = filterParams.travelRiskLevel
    if (filterParams.activityLevel) where.activityLevel = filterParams.activityLevel
    if (filterParams.consumptionLevel) where.consumptionLevel = filterParams.consumptionLevel
    if (filterParams.level) where.level = filterParams.level
    if (filterParams.isRisk !== undefined) where.isRisk = filterParams.isRisk

    const totalCount = await Passenger.count({ where })

    const taskNo = 'EXP' + Date.now()
    const expireTime = new Date()
    expireTime.setDate(expireTime.getDate() + 7)

    const desensitizeRules = isDesensitized ? {
      phone: 'middle',
      idCard: 'middle',
      realName: 'first',
      address: 'partial'
    } : {}

    const task = await PassengerExportTask.create({
      taskNo,
      taskName,
      operatorId: req.user?.id || 1,
      operatorName: req.user?.username || '管理员',
      exportType,
      filterParams,
      sortRules,
      fieldList,
      isDesensitized,
      desensitizeRules,
      status: 2,
      totalCount,
      exportedCount: totalCount,
      fileName: `${taskName}_${taskNo}.csv`,
      fileSize: totalCount * 200,
      expireTime
    })

    res.json(success(task, '导出任务创建成功'))
  } catch (error) {
    next(error)
  }
}

const getExportTaskList = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status, exportType } = req.query

    const where = {}
    if (status !== undefined && status !== '') where.status = status
    if (exportType) where.exportType = exportType
    if (req.user) where.operatorId = req.user.id

    const { count, rows } = await PassengerExportTask.findAndCountAll({
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

const getTravelTraceDetail = async (req, res, next) => {
  try {
    const { id, orderId } = req.params

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderStatusLog, as: 'statusLogs', order: [['createTime', 'ASC']] },
        { model: Ticket, as: 'tickets' }
      ]
    })
    if (!order) throw new AppError('订单不存在', 404, 404)

    const risks = await PassengerTravelRisk.findAll({
      where: { passengerId: id, orderId }
    })

    const abnormalTypes = []

    const fiveMinutesAgo = new Date(order.createTime.getTime() - 5 * 60 * 1000)
    const sameTimeOrders = await Order.count({
      where: {
        passengerId: id,
        id: { [Op.ne]: parseInt(orderId) },
        createTime: { [Op.between]: [fiveMinutesAgo, new Date(order.createTime.getTime() + 5 * 60 * 1000)] }
      }
    })
    if (sameTimeOrders >= 2) abnormalTypes.push({ type: 'malicious_order', name: '恶意刷单', level: 'high' })

    if (order.status === 6) {
      const oneHourBefore = new Date(new Date(order.createTime).getTime() - 60 * 60 * 1000)
      const recentCancels = await Order.count({
        where: {
          passengerId: id,
          status: 6,
          cancelTime: { [Op.gte]: oneHourBefore }
        }
      })
      if (recentCancels >= 3) abnormalTypes.push({ type: 'frequent_cancel', name: '频繁取消', level: 'medium' })
    }

    const fakeComplaints = order.tickets?.filter(t => t.type === 2 && t.status === 3).length || 0
    if (fakeComplaints >= 1) abnormalTypes.push({ type: 'fake_complaint', name: '虚假投诉', level: 'high' })

    res.json(success({
      order,
      risks,
      abnormalDetection: {
        hasAbnormal: abnormalTypes.length > 0,
        abnormalTypes,
        sameTimeOrders,
        fakeComplaints
      }
    }))
  } catch (error) {
    next(error)
  }
}

const createBehaviorReport = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reportType = 2, triggerType, periodStart, periodEnd } = req.body

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const start = periodStart ? new Date(periodStart) : new Date(new Date().setDate(new Date().getDate() - 30))
    const end = periodEnd ? new Date(periodEnd) : new Date()

    const periodOrders = await Order.findAll({
      where: { passengerId: id, createTime: { [Op.between]: [start, end] } }
    })

    const totalOrders = periodOrders.length
    const cancelOrders = periodOrders.filter(o => o.status === 6).length
    const completeOrders = periodOrders.filter(o => o.status === 5).length
    const totalAmount = periodOrders.reduce((sum, o) => sum + (parseFloat(o.actualPrice) || 0), 0)

    const periodRisks = await PassengerTravelRisk.findAll({
      where: { passengerId: id, createTime: { [Op.between]: [start, end] } }
    })

    const abnormalBehaviors = []
    periodRisks.forEach(risk => {
      abnormalBehaviors.push({
        type: risk.riskType,
        name: ['恶意刷单', '频繁取消', '虚假投诉', '迟到爽约', '异常行为'][risk.riskType - 1] || '未知',
        level: risk.riskLevel,
        description: risk.description,
        time: risk.createTime
      })
    })

    const cancelRate = totalOrders > 0 ? (cancelOrders / totalOrders) * 100 : 0
    let riskScore = 0
    if (cancelRate >= 50) riskScore += 40
    else if (cancelRate >= 30) riskScore += 25
    else if (cancelRate >= 15) riskScore += 10

    const highRiskCount = periodRisks.filter(r => r.riskLevel >= 3).length
    riskScore += highRiskCount * 10
    riskScore = Math.min(100, riskScore)

    let overallRiskLevel = 1
    if (riskScore >= 70) overallRiskLevel = 4
    else if (riskScore >= 50) overallRiskLevel = 3
    else if (riskScore >= 25) overallRiskLevel = 2

    const recommendations = []
    if (cancelRate >= 30) recommendations.push('用户取消率过高，建议关注是否存在恶意取消行为')
    if (highRiskCount >= 2) recommendations.push('存在多次高风险行为，建议加强监控')
    if (passenger.maliciousComplaintCount >= 1) recommendations.push('存在恶意投诉记录，建议限制投诉权益')
    if (overallRiskLevel >= 3) recommendations.push('综合风险较高，建议限制临时下单权限')

    const suggestedActions = []
    if (overallRiskLevel >= 4) suggestedActions.push('封禁账号')
    if (overallRiskLevel >= 3) suggestedActions.push('限制临时下单')
    if (overallRiskLevel >= 2) suggestedActions.push('限制溢价减免')
    suggestedActions.push('纳入重点监控名单')

    const reportNo = 'RPT' + Date.now()
    const report = await PassengerBehaviorReport.create({
      reportNo,
      passengerId: id,
      passengerName: passenger.realName || passenger.nickname,
      reportType,
      triggerType,
      periodStart: start,
      periodEnd: end,
      statistics: {
        totalOrders,
        cancelOrders,
        completeOrders,
        cancelRate: cancelRate.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        avgAmount: totalOrders > 0 ? (totalAmount / totalOrders).toFixed(2) : 0,
        riskCount: periodRisks.length,
        highRiskCount
      },
      abnormalBehaviors,
      riskAssessment: {
        cancelRisk: cancelRate >= 30 ? 'high' : cancelRate >= 15 ? 'medium' : 'low',
        complaintRisk: passenger.maliciousComplaintCount >= 2 ? 'high' : passenger.maliciousComplaintCount >= 1 ? 'medium' : 'low',
        overallScore: riskScore
      },
      recommendations,
      overallRiskLevel,
      overallRiskScore: riskScore.toFixed(2),
      suggestedActions
    })

    res.json(success(report, '风险报告生成成功'))
  } catch (error) {
    next(error)
  }
}

const getBehaviorReportList = async (req, res, next) => {
  try {
    const { id } = req.params
    const { page = 1, pageSize = 10, overallRiskLevel, status } = req.query

    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)

    const where = { passengerId: id }
    if (overallRiskLevel) where.overallRiskLevel = overallRiskLevel
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await PassengerBehaviorReport.findAndCountAll({
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

const getBehaviorReportDetail = async (req, res, next) => {
  try {
    const { id, reportId } = req.params

    const report = await PassengerBehaviorReport.findByPk(reportId)
    if (!report) throw new AppError('报告不存在', 404, 404)

    if (report.passengerId !== parseInt(id)) throw new AppError('报告不属于该乘客', 400)

    res.json(success(report))
  } catch (error) {
    next(error)
  }
}

const reviewBehaviorReport = async (req, res, next) => {
  try {
    const { id, reportId } = req.params
    const { status, reviewRemark, executeActions = [] } = req.body

    const report = await PassengerBehaviorReport.findByPk(reportId)
    if (!report) throw new AppError('报告不存在', 404, 404)

    if (report.passengerId !== parseInt(id)) throw new AppError('报告不属于该乘客', 400)

    const passenger = await Passenger.findByPk(id)
    const executedActions = [...(report.executedActions || [])]

    if (executeActions.includes('restrict_order') && !passenger.isOrderRestricted) {
      await passenger.update({ isOrderRestricted: true, riskRestrictionStartTime: new Date() })
      executedActions.push('restrict_order')
    }
    if (executeActions.includes('restrict_discount') && !passenger.isPremiumDiscountRestricted) {
      await passenger.update({ isPremiumDiscountRestricted: true })
      executedActions.push('restrict_discount')
    }
    if (executeActions.includes('ban_account') && passenger.status === 1) {
      await passenger.update({ status: 0 })
      executedActions.push('ban_account')
    }

    await report.update({
      status,
      reviewerId: req.user?.id,
      reviewerName: req.user?.username,
      reviewRemark,
      reviewTime: new Date(),
      executedActions
    })

    res.json(success(report, '报告处理完成'))
  } catch (error) {
    next(error)
  }
}

const checkTravelPermission = async (req, res, next) => {
  try {
    const userRole = req.user?.roleCode || ''
    const canViewFull = ['operation', 'risk', 'admin'].includes(userRole)
    const roleNames = {
      operation: '运营人员',
      risk: '风控人员',
      admin: '管理员'
    }

    res.json(success({
      canViewFull,
      currentRole: userRole,
      allowedRoles: Object.keys(roleNames),
      allowedRoleNames: Object.values(roleNames),
      message: canViewFull ? '有权查看完整出行轨迹' : '仅运营与风控人员可查看完整出行轨迹'
    }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deletePassenger,
  updateStatus,
  validatePhone,
  validateIdCard,
  validateBeforeUpdate,
  updateWithValidation,
  calculateLevel,
  batchOperation,
  getAuditLogs,
  getOperationLogs,
  getRiskOverview,
  updateTags,
  getTravelRecords,
  calculateTravelRisk,
  getTravelRiskList,
  createExportTask,
  getExportTaskList,
  getTravelTraceDetail,
  createBehaviorReport,
  getBehaviorReportList,
  getBehaviorReportDetail,
  reviewBehaviorReport,
  checkTravelPermission
}
