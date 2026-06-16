const { Op } = require('sequelize')
const { CapacityType, Driver } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getMonitor = async (req, res, next) => {
  try {
    const totalOnline = await Driver.count({ where: { status: 1 } })
    const totalInOrder = await Driver.count({ where: { status: 2 } })
    const totalIdle = await Driver.count({ where: { status: 0 } })

    const typeDistribution = [
      { type: 1, typeName: '快车', onlineCount: 45, inOrderCount: 15 },
      { type: 2, typeName: '专车', onlineCount: 25, inOrderCount: 8 },
      { type: 3, typeName: '豪华车', onlineCount: 10, inOrderCount: 3 },
      { type: 4, typeName: '拼车', onlineCount: 30, inOrderCount: 12 },
      { type: 5, typeName: '出租车', onlineCount: 20, inOrderCount: 10 }
    ]

    const hotAreas = [
      { area: '朝阳区望京', orderCount: 156, driverCount: 45 },
      { area: '海淀区中关村', orderCount: 128, driverCount: 38 },
      { area: '东城区王府井', orderCount: 98, driverCount: 32 },
      { area: '西城区金融街', orderCount: 87, driverCount: 28 },
      { area: '丰台区丽泽', orderCount: 76, driverCount: 25 }
    ]

    res.json(success({
      totalOnline,
      totalInOrder,
      totalIdle,
      typeDistribution,
      hotAreas
    }))
  } catch (error) {
    next(error)
  }
}

const getTypeList = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, name, status } = req.query

    const where = {}
    if (name) where.name = { [Op.like]: `%${name}%` }
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await CapacityType.findAndCountAll({
      where,
      order: [['sort', 'ASC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const getTypeDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const capacityType = await CapacityType.findByPk(id)
    if (!capacityType) throw new AppError('运力类型不存在', 404, 404)
    res.json(success(capacityType))
  } catch (error) {
    next(error)
  }
}

const createType = async (req, res, next) => {
  try {
    const data = req.body
    const capacityType = await CapacityType.create(data)
    res.json(success(capacityType, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const updateType = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const capacityType = await CapacityType.findByPk(id)
    if (!capacityType) throw new AppError('运力类型不存在', 404, 404)
    await capacityType.update(data)
    res.json(success(capacityType, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteType = async (req, res, next) => {
  try {
    const { id } = req.params
    const capacityType = await CapacityType.findByPk(id)
    if (!capacityType) throw new AppError('运力类型不存在', 404, 404)
    await capacityType.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getMonitor,
  getTypeList,
  getTypeDetail,
  createType,
  updateType,
  deleteType
}
