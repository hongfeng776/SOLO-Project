const { User, Member } = require('../models')
const { comparePassword, hashPassword, generateToken } = require('../utils/auth')
const ApiError = require('../utils/apiError')

class AuthService {
  async login(username, password, ip) {
    const user = await User.findOne({ where: { username } })

    if (!user) {
      throw ApiError.badRequest('用户名或密码错误')
    }

    if (user.status === 'disabled') {
      throw ApiError.forbidden('账号已被禁用')
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      throw ApiError.badRequest('用户名或密码错误')
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    })

    await user.update({
      lastLoginTime: new Date(),
      lastLoginIp: ip
    })

    const userInfo = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      email: user.email,
      phone: user.phone
    }

    return {
      token,
      user: userInfo
    }
  }

  async logout() {
    return true
  }

  async getUserInfo(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    })

    if (!user) {
      throw ApiError.notFound('用户不存在')
    }

    return user
  }

  async register(userData) {
    const { username, password, email, phone } = userData

    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      throw ApiError.badRequest('用户名已存在')
    }

    const hashedPassword = await hashPassword(password)

    const user = await User.create({
      username,
      password: hashedPassword,
      nickname: userData.nickname || username,
      email,
      phone,
      role: 'member',
      status: 'active'
    })

    await Member.create({
      userId: user.id,
      username: user.username,
      level: 'normal',
      points: 0,
      balance: 0
    })

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    })

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role
      }
    }
  }
}

module.exports = new AuthService()
