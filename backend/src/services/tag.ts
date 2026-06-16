import { Tag } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

export const tagService = {
  async list(params: { page: number; pageSize: number; type?: string; status?: number; keyword?: string }) {
    const { page, pageSize, type, status, keyword } = params
    const where: any = {}

    if (type) where.type = type
    if (status !== undefined) where.status = status
    if (keyword) where.name = { [Op.like]: `%${keyword}%` }

    const { count, rows } = await Tag.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['sort', 'ASC'], ['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async all(params?: { type?: string }) {
    const where: any = { status: 1 }
    if (params?.type) where.type = params.type
    return Tag.findAll({ where, order: [['sort', 'ASC']] })
  },

  async create(data: { name: string; type: string; sort?: number }) {
    const existing = await Tag.findOne({ where: { name: data.name, type: data.type } })
    if (existing) throw new AppError('标签已存在', 400)
    const tag = await Tag.create({ ...data, status: 1 })
    return { id: tag.id }
  },

  async update(id: number, data: Partial<{ name: string; type: string; sort: number; status: number }>) {
    const tag = await Tag.findByPk(id)
    if (!tag) throw new AppError('标签不存在', 404)
    await tag.update(data)
    return { id: tag.id }
  },

  async remove(id: number) {
    const tag = await Tag.findByPk(id)
    if (!tag) throw new AppError('标签不存在', 404)
    await tag.destroy()
    return true
  }
}
