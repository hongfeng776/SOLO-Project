import { ViolationRecord, Note, Comment, User, Creator } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import { notificationService } from './notification'

export const violationService = {
  async list(params: {
    page: number
    pageSize: number
    targetType?: string
    violationLevel?: number
    status?: number
    keyword?: string
    type?: string
    reporterId?: number
    targetId?: number
  }) {
    const { page, pageSize, targetType, violationLevel, status, keyword, type, reporterId, targetId } = params
    const where: any = {}

    if (targetType) where.targetType = targetType
    if (violationLevel !== undefined) where.violationLevel = violationLevel
    if (status !== undefined) where.status = status
    if (type) where.violationType = type
    if (reporterId !== undefined) where.reporterId = reporterId
    if (targetId !== undefined) where.targetId = targetId
    if (keyword) {
      where[Op.or] = [
        { targetTitle: { [Op.like]: `%${keyword}%` } },
        { violationType: { [Op.like]: `%${keyword}%` } }
      ]
    }

    const { count, rows } = await ViolationRecord.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const violation = await ViolationRecord.findByPk(id)
    if (!violation) throw new AppError('违规记录不存在', 404)
    return violation
  },

  async create(data: {
    targetType: string
    targetId: number
    targetTitle?: string
    violationType: string
    violationLevel: number
    description?: string
    evidence?: string
    reporterId?: number
    reporterName?: string
  }) {
    const violation = await ViolationRecord.create({
      ...data,
      status: 0,
      handlerId: 0,
      handlerName: '',
      handleResult: 0
    } as any)
    return { id: violation.id }
  },

  async handle(id: number, data: {
    handleResult: number
    handleNote?: string
    handlerId?: number
    handlerName?: string
  }) {
    const violation = await ViolationRecord.findByPk(id)
    if (!violation) throw new AppError('违规记录不存在', 404)
    if (violation.status !== 0) {
      throw new AppError('该违规记录已处理', 400)
    }

    const updateData: any = {
      status: 1,
      handleResult: data.handleResult,
      handleNote: data.handleNote || '',
      handlerId: data.handlerId || 0,
      handlerName: data.handlerName || ''
    }
    await violation.update(updateData)

    if (data.handleResult === 1) {
      await this.executePunishment(violation)
    }

    return { id: violation.id }
  },

  async executePunishment(violation: any) {
    const { targetType, targetId, violationLevel, targetTitle } = violation

    let userId = 0

    if (targetType === 'note') {
      const note = await Note.findByPk(targetId)
      if (note) {
        await note.update({ status: 4 })
        userId = note.authorId
      }
    } else if (targetType === 'comment') {
      const comment = await Comment.findByPk(targetId)
      if (comment) {
        await comment.update({ status: 2 })
        userId = comment.userId
      }
    } else if (targetType === 'user') {
      const user = await User.findByPk(targetId)
      if (user) {
        userId = user.id
      }
    } else if (targetType === 'creator') {
      const creator = await Creator.findByPk(targetId)
      if (creator) {
        userId = creator.id
      }
    }

    let punishmentDesc = ''
    switch (violationLevel) {
      case 1:
        punishmentDesc = '警告'
        break
      case 2:
        punishmentDesc = '内容下架/删除'
        break
      case 3:
        punishmentDesc = '内容下架 + 账号限流7天'
        break
      case 4:
        punishmentDesc = '永久封禁账号'
        if (targetType === 'user') {
          await User.update(
            { status: 0 },
            { where: { id: targetId } }
          )
        } else if (targetType === 'creator') {
          await Creator.update(
            { qualificationStatus: 3 },
            { where: { id: targetId } }
          )
        }
        break
    }

    if (userId > 0) {
      await notificationService.create({
        userId,
        type: 'violation',
        title: '违规处理通知',
        content: `您的${targetTitle || '内容'}因违反规定已被处理，处罚：${punishmentDesc}`,
        relatedId: violation.id,
        relatedType: 'violation'
      })
    }
  },

  async batchHandle(ids: number[], data: {
    handleResult: number
    handleNote?: string
    handlerId?: number
    handlerName?: string
  }) {
    const violations = await ViolationRecord.findAll({ where: { id: { [Op.in]: ids } } })
    for (const violation of violations) {
      if (violation.status === 0) {
        await this.handle(violation.id, data)
      }
    }
    return true
  },

  async appeal(id: number, appealContent: string) {
    const violation = await ViolationRecord.findByPk(id)
    if (!violation) throw new AppError('违规记录不存在', 404)
    if (violation.status !== 1) {
      throw new AppError('只有已处理的违规记录才能申诉', 400)
    }
    await violation.update({ status: 2, appealContent })
    return { id: violation.id }
  },

  async remove(id: number) {
    const violation = await ViolationRecord.findByPk(id)
    if (!violation) throw new AppError('违规记录不存在', 404)
    await violation.destroy()
    return true
  },

  async getStats() {
    const total = await ViolationRecord.count()
    const pending = await ViolationRecord.count({ where: { status: 0 } })
    const handled = await ViolationRecord.count({ where: { status: 1 } })
    const appealing = await ViolationRecord.count({ where: { status: 2 } })
    const appealRejected = await ViolationRecord.count({ where: { status: 3 } })

    const level1 = await ViolationRecord.count({ where: { violationLevel: 1 } })
    const level2 = await ViolationRecord.count({ where: { violationLevel: 2 } })
    const level3 = await ViolationRecord.count({ where: { violationLevel: 3 } })
    const level4 = await ViolationRecord.count({ where: { violationLevel: 4 } })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayNew = await ViolationRecord.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    return {
      total,
      pending,
      handled,
      appealing,
      appealRejected,
      level1,
      level2,
      level3,
      level4,
      todayNew
    }
  }
}
