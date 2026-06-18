const BaseController = require('./BaseController');
const flightService = require('../services/FlightService');
const { success, pagination } = require('../utils/result');

class FlightController extends BaseController {
  constructor() {
    super(flightService);
  }

  _getOperator(req) {
    if (req.user) {
      return {
        id: req.user.id,
        username: req.user.username,
        name: req.user.name,
        roles: req.user.roles
      };
    }
    return null;
  }

  async list(req, res, next) {
    try {
      const { pageNum, pageSize } = req.pagination;
      const params = { ...req.query, pageNum, pageSize };
      const result = await flightService.getList(params);
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const result = await flightService.getById(id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const operator = this._getOperator(req);
      const result = await flightService.createFlight(req.body, operator);
      res.json(success(result, '创建成功', 201));
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const operator = this._getOperator(req);
      const result = await flightService.updateFlight(id, req.body, operator);
      res.json(success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const operator = this._getOperator(req);
      await flightService.deleteFlight(id, operator);
      res.json(success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchRemove(req, res, next) {
    try {
      const { ids } = req.body;
      const operator = this._getOperator(req);
      const result = await flightService.batchDeleteFlights(ids, operator);
      res.json(success(result, '批量删除完成'));
    } catch (error) {
      next(error);
    }
  }

  async validate(req, res, next) {
    try {
      const { id } = req.params;
      const result = await flightService.validateFlightData(req.body, id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async validateField(req, res, next) {
    try {
      const { field, value, id } = req.query;
      const result = await flightService.validateFieldUniqueness(field, value, id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async updateOperationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { operationStatus, delayMinutes, cancelReason, remark } = req.body;
      const operator = this._getOperator(req);
      const result = await flightService.updateOperationStatus(
        id,
        operationStatus,
        { delayMinutes, cancelReason, remark },
        operator
      );
      res.json(success(result, '状态更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async updateDisplayStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { displayStatus } = req.body;
      const operator = this._getOperator(req);
      const result = await flightService.updateDisplayStatus(id, displayStatus, operator);
      res.json(success(result, displayStatus === 1 ? '上架成功' : '下架成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchUpdateTime(req, res, next) {
    try {
      const { ids, timeData } = req.body;
      const operator = this._getOperator(req);
      const result = await flightService.batchUpdateTime(ids, timeData, operator);
      res.json(success(result, '批量调整完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchUpdateDisplayStatus(req, res, next) {
    try {
      const { ids, displayStatus } = req.body;
      const operator = this._getOperator(req);
      const result = await flightService.batchUpdateDisplayStatus(ids, displayStatus, operator);
      res.json(success(result, '批量操作完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchOfflineAbnormal(req, res, next) {
    try {
      const { ids } = req.body;
      const operator = this._getOperator(req);
      const checkPermission = true;
      const result = await flightService.batchOfflineAbnormal(ids, operator, checkPermission);
      res.json(success(result, '批量下架完成'));
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req, res, next) {
    try {
      const { id } = req.params;
      const { pageNum = 1, pageSize = 20, operationType } = req.query;
      const result = await flightService.getFlightLogs(id, {
        pageNum: Number(pageNum),
        pageSize: Number(pageSize),
        operationType: operationType ? Number(operationType) : undefined
      });
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const result = await flightService.getFlightStats();
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FlightController();
