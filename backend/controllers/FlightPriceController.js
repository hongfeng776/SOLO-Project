const flightPriceService = require('../services/FlightPriceService');

class FlightPriceController {
  async getPriceList(req, res) {
    try {
      const params = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 20
      };
      const result = await flightPriceService.getPriceList(params);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async getPriceById(req, res) {
    try {
      const { id } = req.params;
      const price = await flightPriceService.getPriceById(id);
      if (!price) {
        return res.fail('价格配置不存在');
      }
      res.success(price);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async validatePrice(req, res) {
    try {
      const userRoles = req.user?.roles || [];
      const result = await flightPriceService.validatePriceData(req.body, userRoles);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async validateField(req, res) {
    try {
      const { fieldName, value, ...params } = req.query;
      const result = await flightPriceService.validateField(fieldName, value, params);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async createPrice(req, res) {
    try {
      const userRoles = req.user?.roles || [];
      const price = await flightPriceService.createPrice(req.body, req.user, userRoles);
      res.success(price, '价格配置创建成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async updatePrice(req, res) {
    try {
      const { id } = req.params;
      const userRoles = req.user?.roles || [];
      const price = await flightPriceService.updatePrice(id, req.body, req.user, userRoles);
      res.success(price, '价格配置更新成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async deletePrice(req, res) {
    try {
      const { id } = req.params;
      const userRoles = req.user?.roles || [];
      await flightPriceService.deletePrice(id, req.user, userRoles);
      res.success(null, '价格配置删除成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async updateDisplayStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const userRoles = req.user?.roles || [];
      const result = await flightPriceService.batchUpdateDisplayStatus([id], isActive, req.user, userRoles);
      res.success(result, isActive === 1 ? '价格已启用' : '价格已停用');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchUpdateTime(req, res) {
    try {
      const { flightIds, cabinClass, timeAdjustMinutes } = req.body;
      const userRoles = req.user?.roles || [];
      const result = await flightPriceService.batchUpdateTime(flightIds, cabinClass, timeAdjustMinutes, req.user, userRoles);
      res.success(result, `批量调整成功，共更新${result.updatedCount}条价格配置`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchUpdatePrice(req, res) {
    try {
      const userRoles = req.user?.roles || [];
      const result = await flightPriceService.batchUpdatePrice(req.body, req.user, userRoles);
      res.success(result, `批量更新成功，共更新${result.updatedCount}/${result.totalCount}条价格配置`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchUpdateDisplayStatus(req, res) {
    try {
      const { priceIds, isActive } = req.body;
      const userRoles = req.user?.roles || [];
      const result = await flightPriceService.batchUpdateDisplayStatus(priceIds, isActive, req.user, userRoles);
      res.success(result, `批量${isActive === 1 ? '启用' : '停用'}成功，共更新${result.updatedCount}条价格配置`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async getPriceLogs(req, res) {
    try {
      const { id } = req.params;
      const params = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 20
      };
      const result = await flightPriceService.getPriceLogs(id, params);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async getPriceStats(req, res) {
    try {
      const result = await flightPriceService.getPriceStats(req.query);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }
}

module.exports = new FlightPriceController();
