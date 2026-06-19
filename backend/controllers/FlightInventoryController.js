const flightInventoryService = require('../services/FlightInventoryService');

class FlightInventoryController {
  async getInventoryList(req, res) {
    try {
      const params = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 20
      };
      const result = await flightInventoryService.getInventoryList(params);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async getInventoryById(req, res) {
    try {
      const { id } = req.params;
      const inventory = await flightInventoryService.getInventoryById(id);
      if (!inventory) {
        return res.fail('库存记录不存在');
      }
      res.success(inventory);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async validateInventory(req, res) {
    try {
      const userRoles = req.user?.roles || [];
      const result = await flightInventoryService.validateInventory(req.body, userRoles);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async validateField(req, res) {
    try {
      const { fieldName, value, ...params } = req.query;
      const userRoles = req.user?.roles || [];
      const result = await flightInventoryService.validateField(fieldName, value, params, userRoles);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async createInventory(req, res) {
    try {
      const operator = {
        id: req.user?.id,
        name: req.user?.username,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const inventory = await flightInventoryService.createInventory(req.body, operator);
      res.success(inventory, '库存创建成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async updateInventory(req, res) {
    try {
      const { id } = req.params;
      const operator = {
        id: req.user?.id,
        name: req.user?.username,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const inventory = await flightInventoryService.updateInventory(id, req.body, operator);
      res.success(inventory, '库存更新成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async deleteInventory(req, res) {
    try {
      const { id } = req.params;
      const operator = {
        id: req.user?.id,
        name: req.user?.username,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      await flightInventoryService.deleteInventory(id, operator);
      res.success(null, '库存删除成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async lockStock(req, res) {
    try {
      const { id } = req.params;
      const { lockQuantity } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const inventory = await flightInventoryService.lockStock(id, lockQuantity, operator);
      res.success(inventory, '库存锁定成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async unlockStock(req, res) {
    try {
      const { id } = req.params;
      const { unlockQuantity } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const inventory = await flightInventoryService.unlockStock(id, unlockQuantity, operator);
      res.success(inventory, '库存解锁成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async releaseReservation(req, res) {
    try {
      const { id } = req.params;
      const { releaseQuantity } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const inventory = await flightInventoryService.releaseReservation(id, releaseQuantity, operator);
      res.success(inventory, '预留库存释放成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchLock(req, res) {
    try {
      const { ids, lockQuantity } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.batchLockInventories(ids, lockQuantity, operator);
      res.success(result, `批量锁定完成：成功${result.success}条，失败${result.failed}条`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchUnlock(req, res) {
    try {
      const { ids, unlockQuantity } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.batchUnlockInventories(ids, unlockQuantity, operator);
      res.success(result, `批量解锁完成：成功${result.success}条，失败${result.failed}条`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchSupplement(req, res) {
    try {
      const { ids, supplementQuantity, isHolidayBatch } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.batchSupplementInventories(
        ids, supplementQuantity, operator, isHolidayBatch
      );
      res.success(result, `批量补录完成：成功${result.success}条，失败${result.failed}条`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchReleaseExpired(req, res) {
    try {
      const operator = {
        id: req.user?.id,
        name: req.user?.username,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.batchReleaseExpiredReservations(operator);
      res.success(result, `批量释放过期预留库存完成：成功${result.success}条，失败${result.failed}条`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async getInventoryLogs(req, res) {
    try {
      const params = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 20
      };
      const result = await flightInventoryService.getInventoryLogs(params);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async getInventoryStats(req, res) {
    try {
      const stats = await flightInventoryService.getInventoryStats(req.query);
      res.success(stats);
    } catch (error) {
      res.fail(error.message);
    }
  }
}

module.exports = new FlightInventoryController();
