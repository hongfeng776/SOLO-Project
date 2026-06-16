const categoryService = require('../services/categoryService')
const ApiResponse = require('../utils/response')

class CategoryController {
  async getList(req, res, next) {
    try {
      const list = await categoryService.getList(req.query)
      res.json(ApiResponse.success(list))
    } catch (error) {
      next(error)
    }
  }

  async getTree(req, res, next) {
    try {
      const tree = await categoryService.getTree(req.query)
      res.json(ApiResponse.success(tree))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const category = await categoryService.getDetail(parseInt(id))
      res.json(ApiResponse.success(category))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body)
      res.json(ApiResponse.success(category, '创建成功'))
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const category = await categoryService.update(parseInt(id), req.body)
      res.json(ApiResponse.success(category, '更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      await categoryService.delete(parseInt(id))
      res.json(ApiResponse.success(null, '删除成功'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new CategoryController()
