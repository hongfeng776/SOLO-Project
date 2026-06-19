const cronLogService = require('../services/cronLogService')
const { success, fail, page } = require('../utils/response')

exports.validateParams = async (req, res) => {
  try {
    const result = cronLogService.validateQueryParams(req.query)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getList = async (req, res) => {
  try {
    const result = await cronLogService.getList(req.query)
    return page(res, result.list, result.total, result.page, result.pageSize, { warnings: result.warnings })
  } catch (err) {
    return fail(res, err.message, err.code || 400, { warnings: err.warnings })
  }
}

exports.getDetail = async (req, res) => {
  try {
    const log = await cronLogService.getDetail(req.params.id)
    return success(res, log)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getStats = async (req, res) => {
  try {
    const result = await cronLogService.getStats(req.query)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getBatchStats = async (req, res) => {
  try {
    const result = await cronLogService.getBatchStats(req.query)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getTraceability = async (req, res) => {
  try {
    const result = await cronLogService.getTraceability(req.query)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.create = async (req, res) => {
  try {
    const log = await cronLogService.create(req.body)
    return success(res, log, '创建成功')
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getTaskTypeList = async (req, res) => {
  try {
    const result = await cronLogService.getTaskTypeList()
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getStatusList = async (req, res) => {
  try {
    const result = await cronLogService.getStatusList()
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getTriggerTypeList = async (req, res) => {
  try {
    const result = await cronLogService.getTriggerTypeList()
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getTaskNameList = async (req, res) => {
  try {
    const result = await cronLogService.getTaskNameList(req.query)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}

exports.getTaskGroupList = async (req, res) => {
  try {
    const result = await cronLogService.getTaskGroupList()
    return success(res, result)
  } catch (err) {
    return fail(res, err.message, err.code || 400)
  }
}
