const { Op } = require('sequelize')
const { Driver } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const driverAuditService = require('../services/driverAuditService')
const driverStatusService = require('../services/driverStatusService')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      name,
      phone,
      status,
      auditStatus,
      city,
      vehicleType,
      reputationLevel,
      qualificationStatus,
      isUrgent,
      driverLevel,
      accountRiskLevel,
      minServiceScore,
      maxServiceScore,
      minComplaintRate,
      minViolationCount
    } = req.query

    const where = {}

    if (name) where.name = { [Op.like]: `%${name}%` }
    if (phone) where.phone = { [Op.like]: `%${phone}%` }
    if (status !== undefined && status !== '') where.status = status
    if (auditStatus !== undefined && auditStatus !== '') where.auditStatus = auditStatus
    if (city) where.city = city
    if (vehicleType) where.vehicleType = vehicleType
    if (reputationLevel !== undefined && reputationLevel !== '') where.reputationLevel = reputationLevel
    if (qualificationStatus !== undefined && qualificationStatus !== '') where.qualificationStatus = qualificationStatus
    if (isUrgent !== undefined && isUrgent !== '') where.isUrgent = isUrgent
    if (driverLevel !== undefined && driverLevel !== '') where.driverLevel = driverLevel
    if (accountRiskLevel !== undefined && accountRiskLevel !== '') where.accountRiskLevel = accountRiskLevel
    if (minServiceScore) where.serviceScore = { [Op.gte]: parseFloat(minServiceScore) }
    if (maxServiceScore) where.serviceScore = { ...where.serviceScore, [Op.lte]: parseFloat(maxServiceScore) }
    if (minComplaintRate) where.complaintRate = { [Op.gte]: parseFloat(minComplaintRate) }
    if (minViolationCount) where.violationCount = { [Op.gte]: parseInt(minViolationCount) }

    const order = []
    if (isUrgent === '1') {
      order.push(['isUrgent', 'DESC'])
    }
    order.push(['createTime', 'DESC'])

    const { count, rows } = await Driver.findAndCountAll({
      where,
      order,
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
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)

    const strictness = driverAuditService.getAuditStrictness(driver)

    res.json(success({
      ...driver.toJSON(),
      auditStrictness: strictness
    }))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    const driver = await Driver.create(data)

    await driverAuditService.createAuditLog(driver.id, 1, {
      remark: '司机提交入驻资料'
    })

    res.json(success(driver, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)

    await driver.update(data)

    await driverAuditService.createAuditLog(id, 2, {
      remark: '司机修改入驻资料',
      qualificationCheck: data
    })

    res.json(success(driver, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    await driver.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    await driver.update({ status })
    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

const checkQualification = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await driverAuditService.checkQualification(id)
    res.json(success(result, '资质校验完成'))
  } catch (error) {
    next(error)
  }
}

const getAuditStrictness = async (req, res, next) => {
  try {
    const { id } = req.params
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    const strictness = driverAuditService.getAuditStrictness(driver)
    res.json(success(strictness))
  } catch (error) {
    next(error)
  }
}

const audit = async (req, res, next) => {
  try {
    const { id } = req.params
    const { auditStatus, remark } = req.body
    const { userId, userName } = req.user || {}

    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)

    const oldStatus = driver.auditStatus

    await driver.update({
      auditStatus,
      auditRemark: remark,
      auditTime: new Date(),
      auditorId: userId
    })

    if (auditStatus === 1) {
      await driverAuditService.updateCanAcceptOrder(id, true)
    } else if (auditStatus === 2) {
      await driverAuditService.updateCanAcceptOrder(id, false)
    }

    await driverAuditService.createAuditLog(id, auditStatus === 1 ? 3 : 4, {
      oldStatus,
      newStatus: auditStatus,
      remark,
      operatorId: userId,
      operatorName: userName
    })

    await driverAuditService.sendAuditNotification(driver, auditStatus, remark)

    res.json(success(null, '审核成功'))
  } catch (error) {
    next(error)
  }
}

const batchAudit = async (req, res, next) => {
  try {
    const { ids, auditStatus, remark } = req.body
    const { userId, userName } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverAuditService.batchAudit(ids, auditStatus, remark, userId, userName)

    res.json(success(results, '批量操作完成'))
  } catch (error) {
    next(error)
  }
}

const batchReview = async (req, res, next) => {
  try {
    const { ids, remark } = req.body
    const { userId, userName } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverAuditService.batchReview(ids, remark, userId, userName)

    res.json(success(results, '批量复核完成'))
  } catch (error) {
    next(error)
  }
}

const batchRemind = async (req, res, next) => {
  try {
    const { ids, remark } = req.body
    const { userId, userName } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverAuditService.batchRemind(ids, remark, userId, userName)

    res.json(success(results, '批量提醒完成'))
  } catch (error) {
    next(error)
  }
}

const batchUrgent = async (req, res, next) => {
  try {
    const { ids } = req.body
    const { userId, userName } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverAuditService.batchUrgent(ids, userId, userName)

    res.json(success(results, '批量加急完成'))
  } catch (error) {
    next(error)
  }
}

const getAuditLogs = async (req, res, next) => {
  try {
    const { id } = req.params
    const logs = await driverAuditService.getAuditLogs(id)
    res.json(success(logs))
  } catch (error) {
    next(error)
  }
}

const getAuditDashboard = async (req, res, next) => {
  try {
    const dashboard = await driverAuditService.getAuditDashboard()
    res.json(success(dashboard))
  } catch (error) {
    next(error)
  }
}

const updateUploadProgress = async (req, res, next) => {
  try {
    const { id } = req.params
    const { progress } = req.body
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    await driver.update({ uploadProgress: progress })
    res.json(success({ progress }, '进度更新成功'))
  } catch (error) {
    next(error)
  }
}

const checkExpiredQualifications = async (req, res, next) => {
  try {
    const results = await driverAuditService.checkExpiredQualifications()
    res.json(success(results, `检测到${results.length}个过期资质`))
  } catch (error) {
    next(error)
  }
}

const getPendingAuditCount = async (req, res, next) => {
  try {
    const count = await Driver.count({ where: { auditStatus: 0 } })
    res.json(success(count))
  } catch (error) {
    next(error)
  }
}

const preCheckStatusChange = async (req, res, next) => {
  try {
    const { id } = req.params
    const { newStatus } = req.body
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)

    const result = await driverStatusService.preCheckStatusChange(driver, newStatus)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const changeAccountStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { newStatus, changeReason, banEndTime } = req.body
    const { userId, userName, role } = req.user || {}

    if (newStatus === undefined || newStatus === null) {
      throw new AppError('请选择目标状态', 400, 400)
    }

    const result = await driverStatusService.changeDriverStatus(id, newStatus, {
      changeReason,
      banEndTime,
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })

    res.json(success(result, '状态变更成功'))
  } catch (error) {
    next(error)
  }
}

const getRiskLevel = async (req, res, next) => {
  try {
    const { id } = req.params
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)

    const result = driverStatusService.calculateRiskLevel(driver)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const autoJudgeRiskLevel = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await driverStatusService.autoJudgeRiskLevel(id)
    res.json(success(result, '风险等级判定完成'))
  } catch (error) {
    next(error)
  }
}

const batchChangeAccountStatus = async (req, res, next) => {
  try {
    const { ids, newStatus, changeReason, banEndTime } = req.body
    const { userId, userName, role } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }
    if (newStatus === undefined || newStatus === null) {
      throw new AppError('请选择目标状态', 400, 400)
    }

    const results = await driverStatusService.batchChangeStatus(ids, newStatus, {
      changeReason,
      banEndTime,
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })

    res.json(success(results, '批量操作完成'))
  } catch (error) {
    next(error)
  }
}

const batchTempBan = async (req, res, next) => {
  try {
    const { ids, changeReason, banEndTime } = req.body
    const { userId, userName, role } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverStatusService.batchChangeStatus(ids, 2, {
      changeReason: changeReason || '批量临时封禁',
      banEndTime,
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })

    res.json(success(results, '批量临时封禁完成'))
  } catch (error) {
    next(error)
  }
}

const batchRemindRectification = async (req, res, next) => {
  try {
    const { ids } = req.body
    const { userId, userName } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverStatusService.batchRemindRectification(ids, {
      operatorId: userId,
      operatorName: userName
    })

    res.json(success(results, '批量整改提醒完成'))
  } catch (error) {
    next(error)
  }
}

const batchRestoreNormal = async (req, res, next) => {
  try {
    const { ids, changeReason } = req.body
    const { userId, userName, role } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverStatusService.batchChangeStatus(ids, 0, {
      changeReason: changeReason || '批量恢复正常',
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })

    res.json(success(results, '批量恢复完成'))
  } catch (error) {
    next(error)
  }
}

const getStatusLogs = async (req, res, next) => {
  try {
    const { id } = req.params
    const logs = await driverStatusService.getDriverStatusLogs(id)
    res.json(success(logs))
  } catch (error) {
    next(error)
  }
}

const getStatusDashboard = async (req, res, next) => {
  try {
    const dashboard = await driverStatusService.getStatusDashboard()
    res.json(success(dashboard))
  } catch (error) {
    next(error)
  }
}

const preCheckBatchOperation = async (req, res, next) => {
  try {
    const { ids, newStatus } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const result = await driverStatusService.preCheckBatchOperation(ids, newStatus)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deleteDriver,
  updateStatus,
  checkQualification,
  getAuditStrictness,
  audit,
  batchAudit,
  batchReview,
  batchRemind,
  batchUrgent,
  getAuditLogs,
  getAuditDashboard,
  updateUploadProgress,
  checkExpiredQualifications,
  getPendingAuditCount,
  preCheckStatusChange,
  changeAccountStatus,
  getRiskLevel,
  autoJudgeRiskLevel,
  batchChangeAccountStatus,
  batchTempBan,
  batchRemindRectification,
  batchRestoreNormal,
  getStatusLogs,
  getStatusDashboard,
  preCheckBatchOperation
}
