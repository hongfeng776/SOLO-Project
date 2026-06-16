const memberService = require('../services/memberService')
const ApiResponse = require('../utils/response')

class MemberController {
  async getList(req, res, next) {
    try {
      const result = await memberService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const member = await memberService.getDetail(parseInt(id))
      res.json(ApiResponse.success(member))
    } catch (error) {
      next(error)
    }
  }

  async updateLevel(req, res, next) {
    try {
      const { id } = req.params
      const { level } = req.body
      const member = await memberService.updateLevel(parseInt(id), level)
      res.json(ApiResponse.success(member, '等级更新成功'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new MemberController()
