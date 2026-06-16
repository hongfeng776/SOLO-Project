import { User, Role } from '@models/index'
import { comparePassword, generateToken, generateRefreshToken } from '@utils/auth'
import { AppError } from '@utils/response'
import type { JwtPayload } from '@/types/index'

export const authService = {
  async login(username: string, password: string) {
    const user = await User.findOne({
      where: { username, status: 1 },
      include: [{ model: Role, as: 'roles', attributes: ['id', 'code', 'name', 'permissions'] }]
    })

    if (!user) {
      throw new AppError('用户名或密码错误', 400)
    }

    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      throw new AppError('用户名或密码错误', 400)
    }

    const roles = (user as any).roles?.map((r: any) => r.code) || []
    const permissions = (user as any).roles?.flatMap((r: any) => r.permissions || []) || []

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      roles
    }

    const token = generateToken(payload)
    const refreshToken = generateRefreshToken(payload)

    return {
      token,
      refreshToken,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        status: user.status,
        createTime: user.createTime,
        updateTime: user.updateTime
      },
      roles,
      permissions
    }
  },

  async getUserInfo(userId: number) {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'roles', attributes: ['id', 'code', 'name', 'permissions'] }]
    })

    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const roles = (user as any).roles?.map((r: any) => r.code) || []
    const permissions = (user as any).roles?.flatMap((r: any) => r.permissions || []) || []

    return {
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        status: user.status,
        createTime: user.createTime,
        updateTime: user.updateTime
      },
      roles,
      permissions
    }
  },

  async logout(_userId: number) {
    return true
  },

  async refreshToken(payload: JwtPayload) {
    const token = generateToken(payload)
    const refreshToken = generateRefreshToken(payload)
    return { token, refreshToken }
  }
}
