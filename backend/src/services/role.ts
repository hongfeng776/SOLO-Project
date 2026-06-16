import { Role } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

export const roleService = {
  async list(params: { page: number; pageSize: number; keyword?: string; status?: number }) {
    const { page, pageSize, keyword, status } = params
    const where: any = {}

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ]
    }
    if (status !== undefined) where.status = status

    const { count, rows } = await Role.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async all() {
    return Role.findAll({ where: { status: 1 }, order: [['create_time', 'DESC']] })
  },

  async create(data: { name: string; code: string; description?: string; permissions?: string[] }) {
    const existing = await Role.findOne({ where: { code: data.code } })
    if (existing) throw new AppError('角色编码已存在', 400)
    const role = await Role.create({ ...data, status: 1 } as any)
    return { id: role.id }
  },

  async update(id: number, data: Partial<{ name: string; code: string; description: string; status: number; permissions: string[] }>) {
    const role = await Role.findByPk(id)
    if (!role) throw new AppError('角色不存在', 404)
    await role.update(data as any)
    return { id: role.id }
  },

  async remove(id: number) {
    const role = await Role.findByPk(id)
    if (!role) throw new AppError('角色不存在', 404)
    await role.destroy()
    return true
  }
}
