const HotelRoomPriceService = require('../services/HotelRoomPriceService');

const HotelRoomPriceController = {
  async list(req, res) {
    try {
      const data = await HotelRoomPriceService.list({ ...req.query, ...req.pagination });
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async get(req, res) {
    try {
      const data = await HotelRoomPriceService.get(req.params.id);
      if (!data) return res.fail('价格套餐不存在');
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async create(req, res) {
    try {
      const data = await HotelRoomPriceService.create(req.body, req.user);
      res.success(data, '创建成功');
    } catch (e) {
      res.fail(e.message);
    }
  },

  async update(req, res) {
    try {
      await HotelRoomPriceService.update(req.params.id, req.body, req.user);
      res.success(null, '更新成功');
    } catch (e) {
      res.fail(e.message);
    }
  },

  async checkPermission(req, res) {
    try {
      const data = await HotelRoomPriceService.checkPermission(req.user);
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async verifyParams(req, res) {
    try {
      const data = await HotelRoomPriceService.verifyPriceParams(req.body, req.params.id || null);
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async changeStatus(req, res) {
    try {
      const { status, reason } = req.body;
      await HotelRoomPriceService.changeStatus(req.params.id, status, req.user, reason);
      res.success(null, '状态变更成功');
    } catch (e) {
      res.fail(e.message);
    }
  },

  async batchOperation(req, res) {
    try {
      const { operation, ...params } = req.body;
      const data = await HotelRoomPriceService.batchOperation(operation, params, req.user);
      res.success(data, `批量操作完成：成功${data.success}，失败${data.failed}`);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async getLogs(req, res) {
    try {
      const data = await HotelRoomPriceService.getLogs(req.params.id, req.pagination);
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async getAllLogs(req, res) {
    try {
      const data = await HotelRoomPriceService.getAllLogs({ ...req.query, ...req.pagination });
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async getPurchaseDetails(req, res) {
    try {
      const data = await HotelRoomPriceService.getPurchaseDetails(req.params.id, req.pagination);
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  }
};

module.exports = HotelRoomPriceController;
