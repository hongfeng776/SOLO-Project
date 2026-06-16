const { User } = require('../models')
const { success, AppError } = require('../utils/response')
const { generateToken, comparePassword } = require('../utils/jwt')

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      throw new AppError('用户名和密码不能为空', 400, 400)
    }

    const user = await User.findOne({ where: { username } })

    if (!user) {
      throw new AppError('用户不存在', 400, 400)
    }

    if (user.status !== 1) {
      throw new AppError('账号已被禁用，请联系管理员', 400, 400)
    }

    const isValid = await comparePassword(password, user.password)

    if (!isValid) {
      throw new AppError('密码错误', 400, 400)
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      nickname: user.nickname
    })

    await user.update({
      lastLoginTime: new Date(),
      lastLoginIp: req.ip
    })

    res.json(success({ token }, '登录成功'))
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    res.json(success(null, '退出成功'))
  } catch (error) {
    next(error)
  }
}

const getUserInfo = async (req, res, next) => {
  try {
    const { id } = req.user

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'deleteTime'] }
    })

    if (!user) {
      throw new AppError('用户不存在', 404, 404)
    }

    const permissions = ['order:list', 'order:detail', 'driver:list', 'vehicle:list', 'passenger:list', 'finance:view']

    res.json(success({
      ...user.toJSON(),
      permissions
    }, '获取成功'))
  } catch (error) {
    next(error)
  }
}

const updatePassword = async (req, res, next) => {
  try {
    const { id } = req.user
    const { oldPassword, newPassword } = req.body

    const user = await User.findByPk(id)

    if (!user) {
      throw new AppError('用户不存在', 404, 404)
    }

    const isValid = await comparePassword(oldPassword, user.password)

    if (!isValid) {
      throw new AppError('原密码错误', 400, 400)
    }

    const { hashPassword } = require('../utils/jwt')
    user.password = await hashPassword(newPassword)
    await user.save()

    res.json(success(null, '密码修改成功'))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  login,
  logout,
  getUserInfo,
  updatePassword
}
