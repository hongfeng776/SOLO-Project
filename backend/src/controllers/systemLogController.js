const systemLogService = require('../services/systemLogService')
const { success, fail, page } = require('../utils/response')

exports.validateParams = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : null
    const result = systemLogService.validateQueryParams(req.query, userRole)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getList = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : null
    const result = await systemLogService.getList(req.query, userRole)
    return page(res, result.list, result.total, result.page, result.pageSize, { warnings: result.warnings })
  } catch (err) {
    return fail(res, err.message, err.code || 400, { warnings: err.warnings })
  }
}

exports.getStats = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : null
    const result = await systemLogService.getStats(req.query, userRole)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getDetail = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : null
    const log = await systemLogService.getDetail(req.params.id, userRole)
    return success(res, log)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.create = async (req, res) => {
  try {
    const log = await systemLogService.create(req.body)
    return success(res, log, '创建成功')
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.backupLogs = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : null
    const result = await systemLogService.backupLogs(req.body, userRole)
    return success(res, result, result.message)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.cleanupLogs = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : null
    const result = await systemLogService.cleanupLogs(req.body, userRole)
    return success(res, result, result.message)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getTraceability = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : null
    const result = await systemLogService.getTraceability(req.query, userRole)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getTypeList = async (req, res) => {
  try {
    const result = await systemLogService.getTypeList()
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getLevelList = async (req, res) => {
  try {
    const result = await systemLogService.getLevelList()
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getModuleList = async (req, res) => {
  try {
    const result = await systemLogService.getModuleList()
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getPermission = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : null
    const result = await systemLogService.getUserLogViewPermission(userRole)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}
