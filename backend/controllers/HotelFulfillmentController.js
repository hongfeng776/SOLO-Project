const HotelFulfillmentService = require('../services/HotelFulfillmentService');

const HotelFulfillmentController = {
  async list(req, res) {
    try {
      const data = await HotelFulfillmentService.list({ ...req.query, ...req.pagination });
      res.success(data);
    } catch (e) { res.fail(e.message); }
  },
  async get(req, res) {
    try {
      const data = await HotelFulfillmentService.get(req.params.id);
      if (!data) return res.fail('履约记录不存在');
      res.success(data);
    } catch (e) { res.fail(e.message); }
  },
  async checkPermission(req, res) {
    try {
      const data = await HotelFulfillmentService.checkPermission(req.user);
      res.success(data);
    } catch (e) { res.fail(e.message); }
  },
  async verifyCheckIn(req, res) {
    try {
      const data = await HotelFulfillmentService.verifyCheckIn(req.params.id, req.user, req.body);
      res.success(data, '入住核验完成');
    } catch (e) { res.fail(e.message); }
  },
  async checkout(req, res) {
    try {
      const data = await HotelFulfillmentService.checkout(req.params.id, req.body, req.user);
      res.success(data, '退房操作完成');
    } catch (e) { res.fail(e.message); }
  },
  async extendStay(req, res) {
    try {
      await HotelFulfillmentService.extendStay(req.params.id, req.body, req.user);
      res.success(null, '续住操作完成');
    } catch (e) { res.fail(e.message); }
  },
  async markNoShow(req, res) {
    try {
      const { reason } = req.body;
      await HotelFulfillmentService.markNoShow(req.params.id, reason, req.user);
      res.success(null, '标记未到完成');
    } catch (e) { res.fail(e.message); }
  },
  async batchOperation(req, res) {
    try {
      const { operation, ...params } = req.body;
      const data = await HotelFulfillmentService.batchOperation(operation, params, req.user);
      res.success(data, `批量操作完成：成功${data.success}，失败${data.failed}`);
    } catch (e) { res.fail(e.message); }
  },
  async getLogs(req, res) {
    try {
      const data = await HotelFulfillmentService.getLogs(req.params.id, req.pagination);
      res.success(data);
    } catch (e) { res.fail(e.message); }
  },
  async getAllLogs(req, res) {
    try {
      const data = await HotelFulfillmentService.getAllLogs({ ...req.query, ...req.pagination });
      res.success(data);
    } catch (e) { res.fail(e.message); }
  }
};

module.exports = HotelFulfillmentController;
