import { ResourceSlot } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

export const resourceSlotService = {
  async list(params: {
    page: number
    pageSize: number
    keyword?: string
    type?: string
    status?: number
  }) {
    const { page, pageSize, keyword, type, status } = params
    const where: any = {}

    if (keyword) where.name = { [Op.like]: `%${keyword}%` }
    if (type) where.type = type
    if (status !== undefined) where.status = status

    const { count, rows } = await ResourceSlot.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['sort', 'ASC'], ['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const slot = await ResourceSlot.findByPk(id)
    if (!slot) throw new AppError('资源位不存在', 404)
    return slot
  },

  async create(data: {
    code: string
    name: string
    description?: string
    type?: string
    status?: number
    sort?: number
  }) {
    const existing = await ResourceSlot.findOne({ where: { code: data.code } })
    if (existing) throw new AppError('资源位编码已存在', 400)

    const slot = await ResourceSlot.create(data as any)
    return { id: slot.id }
  },

  async update(id: number, data: Partial<{
    name: string
    description: string
    type: string
    sort: number
  }>) {
    const slot = await ResourceSlot.findByPk(id)
    if (!slot) throw new AppError('资源位不存在', 404)
    await slot.update(data)
    return { id: slot.id }
  },

  async remove(id: number) {
    const slot = await ResourceSlot.findByPk(id)
    if (!slot) throw new AppError('资源位不存在', 404)
    await slot.destroy()
    return true
  },

  async updateStatus(id: number, status: number) {
    const slot = await ResourceSlot.findByPk(id)
    if (!slot) throw new AppError('资源位不存在', 404)
    await slot.update({ status })
    return { id: slot.id }
  },

  async getByCode(code: string) {
    const slot = await ResourceSlot.findOne({ where: { code } })
    if (!slot) throw new AppError('资源位不存在', 404)
    return slot
  },

  async getAllEnabled() {
    const slots = await ResourceSlot.findAll({
      where: { status: 1 },
      order: [['sort', 'ASC']]
    })
    return slots
  }
}
