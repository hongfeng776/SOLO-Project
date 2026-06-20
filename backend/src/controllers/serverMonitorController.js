const serverMonitorService = require('../services/serverMonitorService')
const { success, failure } = require('../utils/response')

const getUserRole = (req) => {
  return req.user?.role || req.headers['x-user-role'] || 'user'
}

const getPermission = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const result = serverMonitorService.getPermission(userRole)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const validateParams = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const result = serverMonitorService.validateQueryParams(req.query, userRole)
    return res.json(success(result))
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getList = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const result = await serverMonitorService.getList({
      ...req.query,
      pageNum: parseInt(req.query.pageNum) || 1,
      pageSize: parseInt(req.query.pageSize) || 20
    }, userRole)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getRealtimeData = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const result = await serverMonitorService.getRealtimeData(req.query, userRole)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getHistoryData = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const result = await serverMonitorService.getHistoryData(req.query, userRole)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getPeakData = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const result = await serverMonitorService.getPeakData(req.query, userRole)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getStats = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const result = await serverMonitorService.getStats(req.query, userRole)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getAlertDetail = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const { id } = req.params
    const result = await serverMonitorService.getAlertDetail(parseInt(id), userRole)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const exportData = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const progressCallback = (progress) => {
      if (req.app && req.app.emit) {
        req.app.emit('exportProgress', { progress })
      }
    }
    const result = await serverMonitorService.exportData(req.query, userRole, progressCallback)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getTraceability = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const result = await serverMonitorService.getTraceability(req.query, userRole)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getServerList = async (req, res) => {
  try {
    const userRole = getUserRole(req)
    const result = await serverMonitorService.getServerList(userRole)
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getAlertTypeList = async (req, res) => {
  try {
    const result = serverMonitorService.getAlertTypeList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getAlertLevelList = async (req, res) => {
  try {
    const result = serverMonitorService.getAlertLevelList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getEnvironmentList = async (req, res) => {
  try {
    const result = serverMonitorService.getEnvironmentList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getApiLoadLevelList = async (req, res) => {
  try {
    const result = serverMonitorService.getApiLoadLevelList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

const getRiskLevelList = async (req, res) => {
  try {
    const result = serverMonitorService.getRiskLevelList()
    return res.json(result)
  } catch (err) {
    return res.json(failure(500, err.message))
  }
}

module.exports = {
  getPermission,
  validateParams,
  getList,
  getRealtimeData,
  getHistoryData,
  getPeakData,
  getStats,
  getAlertDetail,
  exportData,
  getTraceability,
  getServerList,
  getAlertTypeList,
  getAlertLevelList,
  getEnvironmentList,
  getApiLoadLevelList,
  getRiskLevelList
}
