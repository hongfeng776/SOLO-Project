import { Creator } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

export const creatorService = {
  async list(params: { page: number; pageSize: number; keyword?: string; level?: number; qualificationStatus?: number }) {
    const { page, pageSize, keyword, level, qualificationStatus } = params
    const where: any = {}

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { contactName: { [Op.like]: `%${keyword}%` } }
      ]
    }
    if (level !== undefined) where.level = level
    if (qualificationStatus !== undefined) where.qualificationStatus = qualificationStatus

    const { count, rows } = await Creator.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    return creator
  },

  async create(data: { name: string; avatar?: string; platform?: string; category?: string; contactName?: string; contactPhone?: string }) {
    const creator = await Creator.create({ ...data, followers: 0, likes: 0, level: 1, qualificationStatus: 0 } as any)
    return { id: creator.id }
  },

  async update(id: number, data: Partial<{ name: string; avatar: string; platform: string; category: string; contactName: string; contactPhone: string; level: number }>) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    await creator.update(data)
    return { id: creator.id }
  },

  async auditQualification(id: number, qualificationStatus: number, _rejectReason?: string) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    await creator.update({ qualificationStatus })
    return { id: creator.id }
  },

  async remove(id: number) {
    const creator = await Creator.findByPk(id)
    if (!creator) throw new AppError('达人不存在', 404)
    await creator.destroy()
    return true
  }
}
