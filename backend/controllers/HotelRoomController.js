const HotelRoomService = require('../services/HotelRoomService');

const HotelRoomController = {
  async list(req, res) {
    try {
      const data = await HotelRoomService.list({ ...req.query, ...req.pagination }, req.user);
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async get(req, res) {
    try {
      const data = await HotelRoomService.get(req.params.id);
      if (!data) return res.fail('客房不存在');
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async create(req, res) {
    try {
      const data = await HotelRoomService.create(req.body, req.user);
      res.success(data, '创建成功');
    } catch (e) {
      res.fail(e.message);
    }
  },

  async update(req, res) {
    try {
      await HotelRoomService.update(req.params.id, req.body, req.user);
      res.success(null, '更新成功');
    } catch (e) {
      res.fail(e.message);
    }
  },

  async checkPermission(req, res) {
    try {
      const data = await HotelRoomService.checkPermission(req.user);
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async verifyParams(req, res) {
    try {
      const { id } = req.params;
      const data = await HotelRoomService.verifyRoomParams(req.body, id);
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async changeMaintainStatus(req, res) {
    try {
      const { id } = req.params;
      const { maintainStatus, reason } = req.body;
      await HotelRoomService.changeMaintainStatus(id, maintainStatus, req.user, reason);
      res.success(null, '维护状态变更成功');
    } catch (e) {
      res.fail(e.message);
    }
  },

  async batchOperation(req, res) {
    try {
      const { operation, ...params } = req.body;
      const data = await HotelRoomService.batchOperation(operation, params, req.user);
      res.success(data, `批量操作完成：成功${data.success}，失败${data.failed}`);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async getLogs(req, res) {
    try {
      const data = await HotelRoomService.getLogs(req.params.id, req.pagination);
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  },

  async getAllLogs(req, res) {
    try {
      const data = await HotelRoomService.getAllLogs({ ...req.query, ...req.pagination });
      res.success(data);
    } catch (e) {
      res.fail(e.message);
    }
  }
};

module.exports = HotelRoomController;
