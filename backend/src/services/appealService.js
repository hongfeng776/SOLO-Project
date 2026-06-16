const { Appeal, Violation, Resource } = require('../models')
const { getPagination, buildFuzzyWhere } = require('../utils/common')
const ApiError = require('../utils/apiError')
const notificationService = require('./notificationService')

class AppealService {
  async getList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.keyword) {
      Object.assign(where, buildFuzzyWhere(params.keyword, ['resourceTitle', 'reason']))
    }

    if (params.status) {
      where.status = params.status
    }

    const { count, rows } = await Appeal.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Violation, as: 'violation', attributes: ['id', 'violationType', 'violationLevel', 'status', 'action'] }
      ]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize
    }
  }

  async getDetail(id) {
    const appeal = await Appeal.findByPk(id, {
      include: [
        { model: Violation, as: 'violation' },
        { model: Resource, as: 'resource', attributes: ['id', 'title', 'status', 'fileType'] }
      ]
    })

    if (!appeal) {
      throw ApiError.notFound('申诉记录不存在')
    }

    return appeal
  }

  async create(data) {
    const violation = await Violation.findByPk(data.violationId)

    if (!violation) {
      throw ApiError.notFound('关联的违规记录不存在')
    }

    if (violation.status === 'appealed') {
      throw ApiError.badRequest('该违规记录已在申诉中')
    }

    const appeal = await Appeal.create({
      ...data,
      status: 'pending'
    })

    await violation.update({ status: 'appealed' })

    await notificationService.create({
      userId: violation.handlerId,
      title: '新申诉待复核',
      content: `资源"${data.resourceTitle}"的违规记录被申诉，请及时复核`,
      type: 'appeal',
      relatedId: appeal.id,
      relatedType: 'appeal'
    })

    return appeal
  }

  async review(id, result, opinion, reviewer) {
    const appeal = await Appeal.findByPk(id)

    if (!appeal) {
      throw ApiError.notFound('申诉记录不存在')
    }

    if (appeal.status !== 'pending' && appeal.status !== 'reviewing') {
      throw ApiError.badRequest('该申诉已被复核')
    }

    await appeal.update({
      reviewResult: result,
      reviewOpinion: opinion,
      reviewerId: reviewer.id,
      reviewerName: reviewer.username,
      reviewTime: new Date(),
      status: result === 'rejected' ? 'rejected' : 'approved'
    })

    if (result === 'upheld') {
      await appeal.update({ status: 'approved' })
    }

    if (result === 'overturned' || result === 'partial') {
      const violation = await Violation.findByPk(appeal.violationId)

      if (violation) {
        if (result === 'overturned') {
          await violation.update({ status: 'revoked', action: 'appeal_allowed' })

          const resource = await Resource.findByPk(appeal.resourceId)
          if (resource && resource.status === 'offline') {
            await resource.update({ status: 'published', isBlocked: false, blockReason: null })
          }
        }

        if (result === 'partial') {
          await violation.update({ status: 'revoked' })
        }
      }
    }

    await notificationService.create({
      userId: appeal.appellantId,
      title: '申诉复核结果',
      content: `您对资源"${appeal.resourceTitle}"的申诉已复核，结果：${result === 'upheld' ? '维持原判' : result === 'overturned' ? '撤销处罚' : '部分采纳'}`,
      type: 'appeal',
      relatedId: appeal.id,
      relatedType: 'appeal'
    })

    return appeal
  }

  async getPendingCount() {
    const count = await Appeal.count({
      where: { status: 'pending' }
    })

    return count
  }
}

module.exports = new AppealService()
