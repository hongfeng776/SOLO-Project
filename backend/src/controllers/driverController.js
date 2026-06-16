const { Op } = require('sequelize')
const { Driver } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      name,
      phone,
      status,
      auditStatus
    } = req.query

    const where = {}

    if (name) where.name = { [Op.like]: `%${name}%` }
    if (phone) where.phone = { [Op.like]: `%${phone}%` }
    if (status !== undefined && status !== '') where.status = status
    if (auditStatus !== undefined && auditStatus !== '') where.auditStatus = auditStatus

    const { count, rows } = await Driver.findAndCountAll({
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
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    res.json(success(driver))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    const driver = await Driver.create(data)
    res.json(success(driver, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    await driver.update(data)
    res.json(success(driver, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    await driver.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    await driver.update({ status })
    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

const audit = async (req, res, next) => {
  try {
    const { id } = req.params
    const { auditStatus, remark } = req.body
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    await driver.update({ auditStatus, auditRemark: remark })
    res.json(success(null, '审核成功'))
  } catch (error) {
    next(error)
  }
}

const getPendingAuditCount = async (req, res, next) => {
  try {
    const count = await Driver.count({ where: { auditStatus: 0 } })
    res.json(success(count))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deleteDriver,
  updateStatus,
  audit,
  getPendingAuditCount
}
