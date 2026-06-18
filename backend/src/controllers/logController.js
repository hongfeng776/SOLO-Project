const logService = require('../services/logService')
const ApiResponse = require('../utils/response')

class LogController {
  async validateParams(req, res, next) {
    try {
      const result = logService.validateQueryParams(req.query)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getList(req, res, next) {
    try {
      const result = await logService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize, result.warnings))
    } catch (error) {
      if (error.code === 400) {
        res.json(ApiResponse.badRequest(error.message))
      } else {
        next(error)
      }
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const result = await logService.getDetail(id)
      res.json(ApiResponse.success(result))
    } catch (error) {
      if (error.code === 404) {
        res.json(ApiResponse.notFound(error.message))
      } else {
        next(error)
      }
    }
  }

  async create(req, res, next) {
    try {
      const log = await logService.create(req.body)
      res.json(ApiResponse.success(log, '日志记录成功'))
    } catch (error) {
      next(error)
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await logService.getStats(req.query)
      res.json(ApiResponse.success(stats))
    } catch (error) {
      next(error)
    }
  }

  async getTrace(req, res, next) {
    try {
      const { traceId } = req.params
      const result = await logService.getTrace(traceId)
      res.json(ApiResponse.success(result))
    } catch (error) {
      if (error.code === 404) {
        res.json(ApiResponse.notFound(error.message))
      } else if (error.code === 400) {
        res.json(ApiResponse.badRequest(error.message))
      } else {
        next(error)
      }
    }
  }

  async getTraceByLogId(req, res, next) {
    try {
      const { id } = req.params
      const result = await logService.getTraceByLogId(id)
      res.json(ApiResponse.success(result))
    } catch (error) {
      if (error.code === 404) {
        res.json(ApiResponse.notFound(error.message))
      } else if (error.code === 400) {
        res.json(ApiResponse.badRequest(error.message))
      } else {
        next(error)
      }
    }
  }

  async validateExport(req, res, next) {
    try {
      const result = await logService.validateExportParams(req.body)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async exportLogs(req, res, next) {
    try {
      const result = await logService.exportLogs(req.body)
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="operation_logs_${Date.now()}.json"`)
      res.json(ApiResponse.success(result, '导出成功'))
    } catch (error) {
      if (error.code === 400) {
        res.json(ApiResponse.badRequest(error.message))
      } else {
        next(error)
      }
    }
  }

  async getOperators(req, res, next) {
    try {
      const result = await logService.getOperators(req.query)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getModuleList(req, res, next) {
    try {
      const result = await logService.getModuleList()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getActionList(req, res, next) {
    try {
      const result = await logService.getActionList()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new LogController()
