const { Op } = require('sequelize')
const { Passenger } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      nickname,
      phone,
      status
    } = req.query

    const where = {}

    if (nickname) where.nickname = { [Op.like]: `%${nickname}%` }
    if (phone) where.phone = { [Op.like]: `%${phone}%` }
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await Passenger.findAndCountAll({
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
    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)
    res.json(success(passenger))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    const passenger = await Passenger.create(data)
    res.json(success(passenger, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)
    await passenger.update(data)
    res.json(success(passenger, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deletePassenger = async (req, res, next) => {
  try {
    const { id } = req.params
    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)
    await passenger.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const passenger = await Passenger.findByPk(id)
    if (!passenger) throw new AppError('乘客不存在', 404, 404)
    await passenger.update({ status })
    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deletePassenger,
  updateStatus
}
