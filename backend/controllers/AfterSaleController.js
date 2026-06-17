const BaseController = require('./BaseController')
const afterSaleService = require('../services/AfterSaleService')
const { success, pagination } = require('../utils/result')
const { ValidationError, ForbiddenError } = require('../utils/error')

class AfterSaleController extends BaseController {
  constructor() {
    super(afterSaleService)
  }

  async apply(req, res, next) {
    try {
      const { orderId, type } = req.body
      const validated = req.validatedData
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await afterSaleService.initiateAfterSale(orderId, type, validated, operator)
      res.json(success(result, '售后申请已提交，请等待审核'))
    } catch (error) {
      next(error)
    }
  }

  async approve(req, res, next) {
    try {
      const { id } = req.params
      const { remark } = req.body

      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await afterSaleService.approveAfterSale(id, { remark }, operator)
      res.json(success(result, '审核通过，已进入退款流程'))
    } catch (error) {
      next(error)
    }
  }

  async reject(req, res, next) {
    try {
      const { id } = req.params
      const { rejectReason } = req.body

      if (!rejectReason || rejectReason.trim().length === 0) {
        throw new ValidationError('驳回原因不能为空')
      }

      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await afterSaleService.rejectAfterSale(id, rejectReason, operator)
      res.json(success(result, '审核已驳回'))
    } catch (error) {
      next(error)
    }
  }

  async postpone(req, res, next) {
    try {
      const { id } = req.params
      const { remark } = req.body

      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await afterSaleService.postponeAfterSale(id, remark, operator)
      res.json(success(result, '已暂缓处理'))
    } catch (error) {
      next(error)
    }
  }

  async executeRefund(req, res, next) {
    try {
      const { id } = req.params
      const roleCode = req.user?.roleCode

      if (roleCode !== 'admin') {
        throw new ForbiddenError('仅管理员可执行退款操作')
      }

      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await afterSaleService.executeRefund(id, operator)
      res.json(success(result, '退款执行成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchApprove(req, res, next) {
    try {
      const ids = req.batchIds || req.body.ids
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await afterSaleService.batchApprove(ids, operator)
      let msg = `批量审核通过完成：成功${result.successCount}条，失败${result.failCount}条`
      if (result.skippedLargeCount > 0) {
        msg += `，跳过大额退款${result.skippedLargeCount}条(需管理员审核)`
      }
      res.json(success(result, msg))
    } catch (error) {
      next(error)
    }
  }

  async batchReject(req, res, next) {
    try {
      const ids = req.batchIds || req.body.ids
      const { rejectReason } = req.body

      if (!rejectReason || rejectReason.trim().length === 0) {
        throw new ValidationError('驳回原因不能为空')
      }

      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await afterSaleService.batchReject(ids, rejectReason, operator)
      res.json(success(result, `批量驳回完成：成功${result.successCount}条，失败${result.failCount}条`))
    } catch (error) {
      next(error)
    }
  }

  async batchPostpone(req, res, next) {
    try {
      const ids = req.batchIds || req.body.ids
      const { remark } = req.body

      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await afterSaleService.batchPostpone(ids, remark, operator)
      res.json(success(result, `批量暂缓完成：成功${result.successCount}条，失败${result.failCount}条`))
    } catch (error) {
      next(error)
    }
  }

  async trace(req, res, next) {
    try {
      const { pageNum, pageSize } = req.pagination
      const params = { ...req.query, pageNum, pageSize }
      const result = await afterSaleService.traceAfterSales(params)

      const msg = result.abnormalCount > 0
        ? `溯源查询成功，发现${result.abnormalCount}条异常售后申请`
        : '售后申请溯源查询成功'

      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize, msg))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const result = await afterSaleService.getDetail(id)
      res.json(success(result, '查询成功'))
    } catch (error) {
      next(error)
    }
  }

  async list(req, res, next) {
    try {
      const { pageNum, pageSize } = req.pagination
      const params = { ...req.query, pageNum, pageSize }
      const result = await afterSaleService.getList(params)
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AfterSaleController()
