const cronLogService = require('../services/cronLogService')
const { success, failure } = require('../utils/response')

const validateParams = async (req, res) => {
  try {
    const result = cronLogService.validateQueryParams(req.query)
    return res.json(success(result))
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getList = async (req, res) => {
  try {
    const result = await cronLogService.getList({
      ...req.query,
      pageNum: parseInt(req.query.pageNum) || 1,
      pageSize: parseInt(req.query.pageSize) || 20
    })
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getStats = async (req, res) => {
  try {
    const result = await cronLogService.getStats(req.query)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getDetail = async (req, res) => {
  try {
    const { id } = req.params
    const result = await cronLogService.getDetail(parseInt(id))
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const create = async (req, res) => {
  try {
    const result = await cronLogService.create(req.body)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getTraceability = async (req, res) => {
  try {
    const result = await cronLogService.getTraceability(req.query)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getTaskList = async (req, res) => {
  try {
    const result = await cronLogService.getTaskList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getTypeList = async (req, res) => {
  try {
    const result = cronLogService.getTypeList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getStatusList = async (req, res) => {
  try {
    const result = cronLogService.getStatusList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getTriggerTypeList = async (req, res) => {
  try {
    const result = cronLogService.getTriggerTypeList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getAnomalyTypeList = async (req, res) => {
  try {
    const result = cronLogService.getAnomalyTypeList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getRetryStrategyList = async (req, res) => {
  try {
    const result = cronLogService.getRetryStrategyList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

module.exports = {
  validateParams,
  getList,
  getStats,
  getDetail,
  create,
  getTraceability,
  getTaskList,
  getTypeList,
  getStatusList,
  getTriggerTypeList,
  getAnomalyTypeList,
  getRetryStrategyList
}
