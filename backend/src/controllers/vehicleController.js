const { Op } = require('sequelize')
const { Vehicle } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      plateNumber,
      brand,
      capacityType,
      status,
      auditStatus
    } = req.query

    const where = {}

    if (plateNumber) where.plateNumber = { [Op.like]: `%${plateNumber}%` }
    if (brand) where.brand = { [Op.like]: `%${brand}%` }
    if (capacityType) where.capacityType = capacityType
    if (status !== undefined && status !== '') where.status = status
    if (auditStatus !== undefined && auditStatus !== '') where.auditStatus = auditStatus

    const { count, rows } = await Vehicle.findAndCountAll({
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
    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)
    res.json(success(vehicle))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    const vehicle = await Vehicle.create(data)
    res.json(success(vehicle, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)
    await vehicle.update(data)
    res.json(success(vehicle, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params
    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)
    await vehicle.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)
    await vehicle.update({ status })
    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

const audit = async (req, res, next) => {
  try {
    const { id } = req.params
    const { auditStatus, remark } = req.body
    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)
    await vehicle.update({ auditStatus, auditRemark: remark })
    res.json(success(null, '审核成功'))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deleteVehicle,
  updateStatus,
  audit
}
