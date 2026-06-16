const { Op } = require('sequelize')
const { Coupon } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      type,
      status,
      name
    } = req.query

    const where = {}

    if (type !== undefined && type !== '') where.type = type
    if (status !== undefined && status !== '') where.status = status
    if (name) where.name = { [Op.like]: `%${name}%` }

    const { count, rows } = await Coupon.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const coupon = await Coupon.findByPk(id)
    if (!coupon) throw new AppError('优惠券不存在', 404, 404)
    res.json(success(coupon))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    const coupon = await Coupon.create(data)
    res.json(success(coupon, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const coupon = await Coupon.findByPk(id)
    if (!coupon) throw new AppError('优惠券不存在', 404, 404)
    await coupon.update(data)
    res.json(success(coupon, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params
    const coupon = await Coupon.findByPk(id)
    if (!coupon) throw new AppError('优惠券不存在', 404, 404)
    await coupon.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const coupon = await Coupon.findByPk(id)
    if (!coupon) throw new AppError('优惠券不存在', 404, 404)
    await coupon.update({ status: coupon.status === 1 ? 0 : 1 })
    res.json(success(null, coupon.status === 1 ? '已禁用' : '已启用'))
  } catch (error) {
    next(error)
  }
}

const distribute = async (req, res, next) => {
  try {
    const { couponId, userIds, all } = req.body

    const coupon = await Coupon.findByPk(couponId)
    if (!coupon) throw new AppError('优惠券不存在', 404, 404)
    if (coupon.status !== 1) throw new AppError('优惠券未启用', 400, 400)

    const distributeCount = all ? coupon.totalCount - coupon.usedCount : (userIds ? userIds.length : 0)
    if (coupon.usedCount + distributeCount > coupon.totalCount) {
      throw new AppError('优惠券剩余数量不足', 400, 400)
    }

    await coupon.update({ usedCount: coupon.usedCount + distributeCount })

    res.json(success({
      couponId,
      distributeCount,
      targetUsers: all ? '全部用户' : userIds
    }, '发放成功'))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deleteCoupon,
  toggleStatus,
  distribute
}
