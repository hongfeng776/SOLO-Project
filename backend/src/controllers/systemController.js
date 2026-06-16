const { Op } = require('sequelize')
const { User, Role } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const { hashPassword } = require('../utils/jwt')

const getUserList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      username,
      nickname,
      status
    } = req.query

    const where = {}

    if (username) where.username = { [Op.like]: `%${username}%` }
    if (nickname) where.nickname = { [Op.like]: `%${nickname}%` }
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'deleteTime'] },
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const getUserDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'deleteTime'] }
    })
    if (!user) throw new AppError('用户不存在', 404, 404)
    res.json(success(user))
  } catch (error) {
    next(error)
  }
}

const createUser = async (req, res, next) => {
  try {
    const data = req.body

    const exists = await User.findOne({ where: { username: data.username } })
    if (exists) throw new AppError('用户名已存在', 400, 400)

    data.password = await hashPassword(data.password || '123456')
    const user = await User.create(data)

    const result = user.toJSON()
    delete result.password
    delete result.deleteTime

    res.json(success(result, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body

    const user = await User.findByPk(id)
    if (!user) throw new AppError('用户不存在', 404, 404)

    if (data.password) {
      data.password = await hashPassword(data.password)
    } else {
      delete data.password
    }

    await user.update(data)

    const result = user.toJSON()
    delete result.password
    delete result.deleteTime

    res.json(success(result, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id)
    if (!user) throw new AppError('用户不存在', 404, 404)
    if (user.username === 'admin') throw new AppError('超级管理员不能删除', 400, 400)
    await user.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const user = await User.findByPk(id)
    if (!user) throw new AppError('用户不存在', 404, 404)
    if (user.username === 'admin') throw new AppError('超级管理员不能禁用', 400, 400)
    await user.update({ status })
    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

const getRoleList = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, name } = req.query

    const where = {}
    if (name) where.name = { [Op.like]: `%${name}%` }

    const { count, rows } = await Role.findAndCountAll({
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

const getRoleDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const role = await Role.findByPk(id)
    if (!role) throw new AppError('角色不存在', 404, 404)
    res.json(success(role))
  } catch (error) {
    next(error)
  }
}

const createRole = async (req, res, next) => {
  try {
    const data = req.body
    const role = await Role.create(data)
    res.json(success(role, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const role = await Role.findByPk(id)
    if (!role) throw new AppError('角色不存在', 404, 404)
    await role.update(data)
    res.json(success(role, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const role = await Role.findByPk(id)
    if (!role) throw new AppError('角色不存在', 404, 404)
    await role.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const getMenuList = async (req, res, next) => {
  try {
    const menus = [
      { id: 1, name: '工作台', path: '/dashboard', icon: 'DataBoard', sort: 1, children: [] },
      {
        id: 2, name: '订单管理', path: '/order', icon: 'List', sort: 2,
        children: [
          { id: 21, name: '订单列表', path: 'list', icon: 'Document', sort: 1 },
          { id: 22, name: '订单调度', path: 'dispatch', icon: 'Connection', sort: 2 }
        ]
      },
      {
        id: 3, name: '司机管理', path: '/driver', icon: 'User', sort: 3,
        children: [
          { id: 31, name: '司机列表', path: 'list', icon: 'User', sort: 1 },
          { id: 32, name: '资质审核', path: 'audit', icon: 'CircleCheck', sort: 2 }
        ]
      },
      {
        id: 4, name: '车辆管理', path: '/vehicle', icon: 'Van', sort: 4,
        children: [
          { id: 41, name: '车辆列表', path: 'list', icon: 'Van', sort: 1 },
          { id: 42, name: '车辆审核', path: 'audit', icon: 'CircleCheck', sort: 2 }
        ]
      },
      {
        id: 5, name: '乘客管理', path: '/passenger', icon: 'UserFilled', sort: 5,
        children: [
          { id: 51, name: '乘客列表', path: 'list', icon: 'UserFilled', sort: 1 }
        ]
      },
      {
        id: 6, name: '运力管控', path: '/capacity', icon: 'TrendCharts', sort: 6,
        children: [
          { id: 61, name: '运力监控', path: 'monitor', icon: 'TrendCharts', sort: 1 },
          { id: 62, name: '运力类型', path: 'type', icon: 'Menu', sort: 2 }
        ]
      },
      {
        id: 7, name: '财务管理', path: '/finance', icon: 'Money', sort: 7,
        children: [
          { id: 71, name: '对账流水', path: 'statement', icon: 'Tickets', sort: 1 },
          { id: 72, name: '结算管理', path: 'settlement', icon: 'Money', sort: 2 }
        ]
      },
      {
        id: 8, name: '系统管理', path: '/system', icon: 'Setting', sort: 8,
        children: [
          { id: 81, name: '用户管理', path: 'user', icon: 'User', sort: 1 },
          { id: 82, name: '角色管理', path: 'role', icon: 'Avatar', sort: 2 },
          { id: 83, name: '菜单管理', path: 'menu', icon: 'Menu', sort: 3 }
        ]
      }
    ]

    res.json(success(menus))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  getMenuList
}
