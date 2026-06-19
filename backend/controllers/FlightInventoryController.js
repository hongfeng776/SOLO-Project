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
        return res.fail('库存配置不存在');
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
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const inventory = await flightInventoryService.createInventory(req.body, operator);
      res.success(inventory, '库存配置创建成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async updateInventory(req, res) {
    try {
      const { id } = req.params;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const inventory = await flightInventoryService.updateInventory(id, req.body, operator);
      res.success(inventory, '库存配置更新成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async deleteInventory(req, res) {
    try {
      const { id } = req.params;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      await flightInventoryService.deleteInventory(id, operator);
      res.success(null, '库存配置删除成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async updateActiveStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.updateActiveStatus(id, isActive, operator);
      res.success(result, isActive ? '库存已启用' : '库存已停用');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async lockInventory(req, res) {
    try {
      const { id } = req.params;
      const { lockReason } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.lockInventory(id, lockReason, operator);
      res.success(result, '库存锁定成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async unlockInventory(req, res) {
    try {
      const { id } = req.params;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.unlockInventory(id, operator);
      res.success(result, '库存解锁成功');
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchLockInventory(req, res) {
    try {
      const { inventoryIds, lockReason } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.batchLockInventory(inventoryIds, lockReason, operator);
      res.success(result, `批量锁定成功，共锁定${result.success}条库存配置`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchUnlockInventory(req, res) {
    try {
      const { inventoryIds } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.batchUnlockInventory(inventoryIds, operator);
      res.success(result, `批量解锁成功，共解锁${result.success}条库存配置`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchReleaseReservations(req, res) {
    try {
      const { inventoryIds } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.batchReleaseExpiredReservations(inventoryIds, operator);
      res.success(result, `批量释放成功，共释放${result.success}条预留库存`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchSupplementInventory(req, res) {
    try {
      const { inventoryIds, supplementQuantity, supplementSource, supplementRemark } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.batchSupplementInventory(
        inventoryIds,
        supplementQuantity,
        supplementSource,
        supplementRemark,
        operator
      );
      res.success(result, `批量补录成功，共补录${result.success}条库存配置`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async batchUpdateActiveStatus(req, res) {
    try {
      const { inventoryIds, isActive } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        role: req.user?.role,
        roles: req.user?.roles || [],
        ip: req.ip
      };
      const result = await flightInventoryService.batchUpdateActiveStatus(inventoryIds, isActive, operator);
      res.success(result, `批量${isActive ? '启用' : '停用'}成功，共更新${result.success}条库存配置`);
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
      if (req.params.id) {
        params.inventoryId = req.params.id;
      }
      const result = await flightInventoryService.getInventoryLogs(params);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async getInventoryStats(req, res) {
    try {
      const result = await flightInventoryService.getInventoryStats(req.query);
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async releaseExpiredReservations(req, res) {
    try {
      const result = await flightInventoryService.releaseExpiredReservations();
      res.success(result, `共释放${result.releasedCount}条过期预留库存`);
    } catch (error) {
      res.fail(error.message);
    }
  }

  async checkLowStockWarning(req, res) {
    try {
      const result = await flightInventoryService.checkLowStockWarning();
      res.success(result);
    } catch (error) {
      res.fail(error.message);
    }
  }
}

module.exports = new FlightInventoryController();
