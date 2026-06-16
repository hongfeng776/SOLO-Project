const userService = require('../services/userService')
const ApiResponse = require('../utils/response')

class UserController {
  async getList(req, res, next) {
    try {
      const result = await userService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const user = await userService.getDetail(parseInt(id))
      res.json(ApiResponse.success(user))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const user = await userService.create(req.body)
      res.json(ApiResponse.success(user, '创建成功'))
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const user = await userService.update(parseInt(id), req.body)
      res.json(ApiResponse.success(user, '更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      await userService.delete(parseInt(id))
      res.json(ApiResponse.success(null, '删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchDelete(req, res, next) {
    try {
      const { ids } = req.body
      await userService.batchDelete(ids)
      res.json(ApiResponse.success(null, '批量删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status } = req.body
      await userService.updateStatus(parseInt(id), status)
      res.json(ApiResponse.success(null, '状态更新成功'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new UserController()
