const BaseController = require('./BaseController')
const paymentService = require('../services/PaymentService')
const { success } = require('../utils/result')
const { ValidationError, ForbiddenError } = require('../utils/error')

class PaymentController extends BaseController {
  constructor() {
    super(paymentService)
  }

  async initiatePayment(req, res, next) {
    try {
      const { orderId } = req.body
      const validated = req.validatedData
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await paymentService.initiatePayment(orderId, validated, operator)
      res.json(success(result, '支付流程已发起，请完成支付'))
    } catch (error) {
      next(error)
    }
  }

  async confirmPayment(req, res, next) {
    try {
      const { flowId } = req.params
      const { transactionId } = req.body

      if (!transactionId) {
        throw new ValidationError('第三方交易号不能为空')
      }

      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await paymentService.confirmPayment(flowId, transactionId, operator)
      res.json(success(result, '支付确认成功'))
    } catch (error) {
      next(error)
    }
  }

  async failPayment(req, res, next) {
    try {
      const { flowId } = req.params
      const { failCode, failReason } = req.body

      if (!failCode) {
        throw new ValidationError('失败错误码不能为空')
      }

      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await paymentService.failPayment(flowId, failCode, failReason || '', operator)
      res.json(success(result, '支付失败已记录'))
    } catch (error) {
      next(error)
    }
  }

  async batchRemindPayment(req, res, next) {
    try {
      const roleCode = req.user?.roleCode
      if (!['admin', 'operator'].includes(roleCode)) {
        throw new ForbiddenError('仅管理员和运营人员可批量提醒支付')
      }

      const ids = req.batchIds || req.body.ids
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await paymentService.batchRemindPayment(ids, operator)
      res.json(success(result, `批量提醒完成：成功${result.successCount}条，失败${result.failCount}条`))
    } catch (error) {
      next(error)
    }
  }

  async batchCancelTimeout(req, res, next) {
    try {
      const roleCode = req.user?.roleCode
      if (roleCode !== 'admin') {
        throw new ForbiddenError('仅管理员可批量取消超时订单')
      }

      const ids = req.batchIds || req.body.ids
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await paymentService.batchCancelTimeout(ids, operator)
      let msg = `批量取消完成：成功${result.successCount}条，失败${result.failCount}条`
      if (result.skippedHighPriorityCount > 0) {
        msg += `，跳过高端商旅订单${result.skippedHighPriorityCount}条`
      }
      res.json(success(result, msg))
    } catch (error) {
      next(error)
    }
  }

  async batchExemptTimeout(req, res, next) {
    try {
      const roleCode = req.user?.roleCode
      if (roleCode !== 'admin') {
        throw new ForbiddenError('仅管理员可批量豁免支付超时限制')
      }

      const ids = req.batchIds || req.body.ids
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await paymentService.batchExemptTimeout(ids, operator)
      res.json(success(result, `批量豁免完成：成功${result.successCount}条，失败${result.failCount}条`))
    } catch (error) {
      next(error)
    }
  }

  async tracePaymentFlows(req, res, next) {
    try {
      const { keyword, orderId } = req.query
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }

      const result = await paymentService.tracePaymentFlows(keyword, orderId, operator)
      const msg = result.abnormalCount > 0
        ? `溯源查询成功，发现${result.abnormalCount}条异常流水`
        : '支付流水溯源查询成功'
      res.json(success(result, msg))
    } catch (error) {
      next(error)
    }
  }

  async getFlowDetail(req, res, next) {
    try {
      const { flowId } = req.params
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }
      const result = await paymentService.getFlowDetail(flowId, operator)
      res.json(success(result, '查询成功'))
    } catch (error) {
      next(error)
    }
  }

  async getOrderFlows(req, res, next) {
    try {
      const { orderId } = req.params
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      }
      const result = await paymentService.getOrderFlows(orderId, operator)
      res.json(success(result, '查询成功'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new PaymentController()
