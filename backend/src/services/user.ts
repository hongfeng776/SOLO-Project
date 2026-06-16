import { User, Role } from '@models/index'
import { hashPassword } from '@utils/auth'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

export const userService = {
  async list(params: { page: number; pageSize: number; keyword?: string; status?: number }) {
    const { page, pageSize, keyword, status } = params
    const where: any = {}

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } }
      ]
    }

    if (status !== undefined) {
      where.status = status
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Role, as: 'roles', attributes: ['id', 'code', 'name'] }],
      attributes: { exclude: ['password'] },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async create(data: { username: string; password: string; nickname: string; email?: string; phone?: string; roleIds?: number[] }) {
    const existing = await User.findOne({ where: { username: data.username } })
    if (existing) {
      throw new AppError('用户名已存在', 400)
    }

    const hashedPassword = await hashPassword(data.password)
    const user = await User.create({ ...data, password: hashedPassword, status: 1, avatar: '' } as any)

    if (data.roleIds?.length) {
      const roles = await Role.findAll({ where: { id: data.roleIds } })
      await (user as any).addRoles(roles)
    }

    return { id: user.id, username: user.username }
  },

  async update(id: number, data: Partial<{ nickname: string; email: string; phone: string; status: number; password: string; roleIds: number[] }>) {
    const user = await User.findByPk(id)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    if (data.password) {
      data.password = await hashPassword(data.password)
    }

    await user.update(data)

    if (data.roleIds) {
      const roles = await Role.findAll({ where: { id: data.roleIds } })
      await (user as any).setRoles(roles)
    }

    return { id: user.id }
  },

  async remove(id: number) {
    const user = await User.findByPk(id)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    await user.destroy()
    return true
  }
}
