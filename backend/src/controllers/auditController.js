const auditService = require('../services/auditService')
const ApiResponse = require('../utils/response')

class AuditController {
  async getPendingList(req, res, next) {
    try {
      const result = await auditService.getPendingList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getRecords(req, res, next) {
    try {
      const result = await auditService.getRecords(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async auditResource(req, res, next) {
    try {
      const { id } = req.params
      const auditor = {
        id: req.user.id,
        username: req.user.username
      }
      const result = await auditService.auditResource(parseInt(id), req.body, auditor)
      res.json(ApiResponse.success(result, '审核完成'))
    } catch (error) {
      next(error)
    }
  }

  async batchAudit(req, res, next) {
    try {
      const { ids, ...auditData } = req.body
      const auditor = {
        id: req.user.id,
        username: req.user.username
      }
      const result = await auditService.batchAudit(ids, auditData, auditor)
      res.json(ApiResponse.success(result, '批量审核完成'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AuditController()
