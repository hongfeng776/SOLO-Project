const flightFulfillmentService = require('../services/FlightFulfillmentService');
const { success, failure } = require('../utils/result');

class FlightFulfillmentController {
  async getList(req, res) {
    try {
      const params = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 10
      };
      const result = await flightFulfillmentService.getList(params);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await flightFulfillmentService.getById(id);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async validateFulfillment(req, res) {
    try {
      const user = this._getOperatorInfo(req);
      const { operationType, ...params } = req.body;
      const result = await flightFulfillmentService._validateFulfillmentData(params, operationType, user);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async validateField(req, res) {
    try {
      const { fieldName, value, fulfillmentId } = req.query;
      const result = await flightFulfillmentService.validateField(fieldName, value, fulfillmentId);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  _getOperatorInfo(req) {
    return {
      id: req.user?.id,
      name: req.user?.username || req.user?.name,
      role: req.user?.role,
      roles: req.user?.roles || [],
      ip: req.ip
    };
  }

  async createFulfillment(req, res) {
    try {
      const { orderId } = req.params;
      const user = this._getOperatorInfo(req);
      const result = await flightFulfillmentService.createFulfillment(orderId, req.body, user);
      res.success(result, '履约记录创建成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async auditFulfillment(req, res) {
    try {
      const { id } = req.params;
      const { auditResult, remark } = req.body;
      const user = this._getOperatorInfo(req);
      const result = await flightFulfillmentService.auditFulfillment(id, auditResult, user, remark);
      res.success(result, '履约审核完成');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async issueTicket(req, res) {
    try {
      const { id } = req.params;
      const user = this._getOperatorInfo(req);
      const result = await flightFulfillmentService.issueTicket(id, req.body, user);
      res.success(result, '出票成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async handleFlightChange(req, res) {
    try {
      const { id } = req.params;
      const user = this._getOperatorInfo(req);
      const result = await flightFulfillmentService.handleFlightChange(id, req.body, user);
      res.success(result, '航班变动处理完成');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async terminateFulfillment(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = this._getOperatorInfo(req);
      const result = await flightFulfillmentService.terminateFulfillment(id, reason, user);
      res.success(result, '行程已终止');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async markAbnormal(req, res) {
    try {
      const { id } = req.params;
      const { abnormalType, reason } = req.body;
      const user = this._getOperatorInfo(req);
      const result = await flightFulfillmentService.markAbnormal(id, abnormalType, reason, user);
      res.success(result, '已标记为异常订单');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async handleAbnormal(req, res) {
    try {
      const { id } = req.params;
      const { handleRemark } = req.body;
      const user = this._getOperatorInfo(req);
      const result = await flightFulfillmentService.handleAbnormal(id, handleRemark, user);
      res.success(result, '异常处理完成');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchIssueTickets(req, res) {
    try {
      const { ids, ticketDataList } = req.body;
      const user = this._getOperatorInfo(req);
      const result = await flightFulfillmentService.batchIssueTickets(ids, ticketDataList, user);
      res.success(result, `批量出票完成，成功${result.success}条，失败${result.failed}条`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchHandleFlightChanges(req, res) {
    try {
      const { ids } = req.body;
      const user = this._getOperatorInfo(req);
      const result = await flightFulfillmentService.batchHandleFlightChanges(ids, user);
      res.success(result, `批量处理完成，成功${result.success}条，失败${result.failed}条`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchMarkAbnormal(req, res) {
    try {
      const { ids, abnormalType, reason } = req.body;
      const user = this._getOperatorInfo(req);
      const result = await flightFulfillmentService.batchMarkAbnormal(ids, abnormalType, reason, user);
      res.success(result, `批量标记完成，成功${result.success}条，失败${result.failed}条`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async getLogs(req, res) {
    try {
      const { fulfillmentId } = req.params;
      const params = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 20
      };
      const result = await flightFulfillmentService.getLogs(fulfillmentId, params);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async getStats(req, res) {
    try {
      const result = await flightFulfillmentService.getStats(req.query);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async checkTicketTimeout(req, res) {
    try {
      const result = await flightFulfillmentService.checkTicketTimeout();
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }
}

module.exports = new FlightFulfillmentController();
