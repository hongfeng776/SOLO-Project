const { success, pagination } = require('../utils/result');

class BaseController {
  constructor(service) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const { pageNum, pageSize } = req.pagination;
      const params = { ...req.query, pageNum, pageSize };
      const result = await this.service.getList(params);
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.service.getById(id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await this.service.create(req.body);
      res.json(success(result, '创建成功', 201));
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.service.update(id, req.body);
      res.json(success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      await this.service.remove(id);
      res.json(success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchRemove(req, res, next) {
    try {
      const { ids } = req.body;
      await this.service.batchRemove(ids);
      res.json(success(null, '批量删除成功'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BaseController;
