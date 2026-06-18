import { Comment, Note, CommentAuditLog } from '@models/index'
import { AppError } from '@utils/response'
import { Op, literal } from 'sequelize'
import { noteService } from './note'
import { commentComplianceService } from './comment-compliance'
import sequelize from '@config/database'

export const commentService = {
  async list(params: {
    page: number
    pageSize: number
    noteId?: number
    status?: number
    keyword?: string
    userId?: number
    riskLevel?: number
    violationType?: string
  }) {
    const { page, pageSize, noteId, status, keyword, userId, riskLevel, violationType } = params
    const where: any = {}

    if (noteId !== undefined) where.noteId = noteId
    if (status !== undefined) where.status = status
    if (keyword) where.content = { [Op.like]: `%${keyword}%` }
    if (userId !== undefined) where.userId = userId
    if (riskLevel !== undefined) where.riskLevel = riskLevel
    if (violationType) where.violationType = { [Op.like]: `%${violationType}%` }

    const { count, rows } = await Comment.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const comment = await Comment.findByPk(id)
    if (!comment) throw new AppError('评论不存在', 404)
    return comment
  },

  async create(data: {
    noteId: number
    userId: number
    nickname: string
    avatar?: string
    content: string
    parentId?: number
    replyTo?: string
    ip?: string
  }) {
    const note = await Note.findByPk(data.noteId)
    if (!note) throw new AppError('笔记不存在', 404)

    const complianceResult = await commentComplianceService.fullCheck(
      data.content,
      data.userId,
      data.noteId
    )

    if (complianceResult.intercepted) {
      const violationTypes = complianceResult.violations.map(v => v.typeName).join(',')
      const violationDetail = complianceResult.violations.map(v => v.message).join(';')

      const comment = await Comment.create({
        ...data,
        status: 2,
        violationType: violationTypes,
        riskLevel: complianceResult.riskLevel,
        ip: data.ip || ''
      } as any)

      await CommentAuditLog.create({
        commentId: comment.id,
        noteId: data.noteId,
        userId: data.userId,
        userName: data.nickname,
        content: data.content,
        action: 0,
        violationType: violationTypes,
        violationDetail,
        sensitiveWords: complianceResult.sensitiveMatches.join(','),
        ip: data.ip || ''
      } as any)

      return {
        id: comment.id,
        intercepted: true,
        complianceResult: {
          passed: false,
          violations: complianceResult.violations,
          sensitiveMatches: complianceResult.sensitiveMatches,
          riskLevel: complianceResult.riskLevel
        }
      }
    }

    const initialStatus = complianceResult.passed ? 1 : 0
    const riskLevel = complianceResult.riskLevel

    const comment = await Comment.create({
      ...data,
      status: initialStatus,
      violationType: complianceResult.passed ? '' : complianceResult.violations.map(v => v.typeName).join(','),
      riskLevel,
      ip: data.ip || ''
    } as any)

    if (initialStatus === 1) {
      await noteService.incrementComment(data.noteId)
    }

    if (!complianceResult.passed) {
      await CommentAuditLog.create({
        commentId: comment.id,
        noteId: data.noteId,
        userId: data.userId,
        userName: data.nickname,
        content: data.content,
        action: 0,
        violationType: complianceResult.violations.map(v => v.typeName).join(','),
        violationDetail: complianceResult.violations.map(v => v.message).join(';'),
        sensitiveWords: complianceResult.sensitiveMatches.join(','),
        ip: data.ip || ''
      } as any)
    }

    return {
      id: comment.id,
      intercepted: false,
      complianceResult: {
        passed: complianceResult.passed,
        violations: complianceResult.violations,
        sensitiveMatches: complianceResult.sensitiveMatches,
        riskLevel: complianceResult.riskLevel
      }
    }
  },

  async update(id: number, data: Partial<{ content: string }>) {
    const comment = await Comment.findByPk(id)
    if (!comment) throw new AppError('评论不存在', 404)
    await comment.update(data)
    return { id: comment.id }
  },

  async remove(id: number, operator?: { userId: number; username: string }) {
    const comment = await Comment.findByPk(id)
    if (!comment) throw new AppError('评论不存在', 404)

    const t = await sequelize.transaction()
    try {
      const previousStatus = comment.status

      await CommentAuditLog.create({
        commentId: comment.id,
        noteId: comment.noteId,
        userId: comment.userId,
        userName: comment.nickname,
        content: comment.content,
        action: 4,
        violationType: comment.violationType || '',
        handlerId: operator?.userId,
        handlerName: operator?.username || ''
      } as any, { transaction: t })

      await comment.destroy({ transaction: t })

      if (previousStatus === 1) {
        await Note.decrement('commentCount', {
          by: 1,
          where: { id: comment.noteId },
          transaction: t
        })
      }

      await t.commit()
      return true
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async batchRemove(ids: number[], operator?: { userId: number; username: string }) {
    const comments = await Comment.findAll({ where: { id: { [Op.in]: ids } } })
    if (comments.length === 0) return true

    const t = await sequelize.transaction()
    try {
      const auditLogs = comments.map(c => ({
        commentId: c.id,
        noteId: c.noteId,
        userId: c.userId,
        userName: c.nickname,
        content: c.content,
        action: 4,
        violationType: c.violationType || '',
        handlerId: operator?.userId,
        handlerName: operator?.username || ''
      }))

      await CommentAuditLog.bulkCreate(auditLogs as any, { transaction: t })

      await Comment.destroy({
        where: { id: { [Op.in]: ids } },
        transaction: t
      })

      const approvedComments = comments.filter(c => c.status === 1)
      const noteCountMap: Record<number, number> = {}
      for (const c of approvedComments) {
        noteCountMap[c.noteId] = (noteCountMap[c.noteId] || 0) + 1
      }

      for (const [noteId, count] of Object.entries(noteCountMap)) {
        await Note.decrement('commentCount', {
          by: count,
          where: { id: Number(noteId) },
          transaction: t
        })
      }

      await t.commit()
      return true
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async audit(id: number, data: { status: number; violationType?: string; reason?: string }, operator?: { userId: number; username: string }) {
    const comment = await Comment.findByPk(id)
    if (!comment) throw new AppError('评论不存在', 404)

    const previousStatus = comment.status

    const t = await sequelize.transaction()
    try {
      const updateData: any = { status: data.status }
      if (data.violationType) updateData.violationType = data.violationType
      if (data.status === 2) updateData.riskLevel = Math.max(comment.riskLevel || 0, 2)

      await comment.update(updateData, { transaction: t })

      let auditAction = data.status === 1 ? 1 : 2
      await CommentAuditLog.create({
        commentId: comment.id,
        noteId: comment.noteId,
        userId: comment.userId,
        userName: comment.nickname,
        content: comment.content,
        action: auditAction,
        violationType: data.violationType || comment.violationType || '',
        violationDetail: data.reason || '',
        handlerId: operator?.userId,
        handlerName: operator?.username || '',
        handleNote: data.reason || '',
        ip: comment.ip || ''
      } as any, { transaction: t })

      if (previousStatus === 0 && data.status === 1) {
        await noteService.incrementComment(comment.noteId)
      } else if (previousStatus === 1 && data.status === 2) {
        await Note.decrement('commentCount', {
          by: 1,
          where: { id: comment.noteId },
          transaction: t
        })
      } else if (data.status === 2 && previousStatus !== 2) {
        await comment.destroy({ transaction: t })
      }

      await t.commit()
      return { id: comment.id }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async batchAudit(ids: number[], data: { status: number; violationType?: string; reason?: string }, operator?: { userId: number; username: string }) {
    const comments = await Comment.findAll({ where: { id: { [Op.in]: ids } } })
    if (comments.length === 0) return true

    const t = await sequelize.transaction()
    try {
      await Comment.update(
        {
          status: data.status,
          ...(data.violationType ? { violationType: data.violationType } : {}),
          ...(data.status === 2 ? { riskLevel: literal('GREATEST(COALESCE(risk_level, 0), 2)') } : {})
        },
        {
          where: { id: { [Op.in]: ids } },
          transaction: t
        }
      )

      const auditAction = data.status === 1 ? 3 : 4
      const auditLogs = comments.map(c => ({
        commentId: c.id,
        noteId: c.noteId,
        userId: c.userId,
        userName: c.nickname,
        content: c.content,
        action: auditAction,
        violationType: data.violationType || c.violationType || '',
        violationDetail: data.reason || '',
        handlerId: operator?.userId,
        handlerName: operator?.username || '',
        handleNote: data.reason || ''
      }))

      await CommentAuditLog.bulkCreate(auditLogs as any, { transaction: t })

      if (data.status === 1) {
        const pendingComments = comments.filter(c => c.status === 0)
        const noteCountMap: Record<number, number> = {}
        for (const c of pendingComments) {
          noteCountMap[c.noteId] = (noteCountMap[c.noteId] || 0) + 1
        }
        for (const [noteId, count] of Object.entries(noteCountMap)) {
          await Note.increment('commentCount', {
            by: count,
            where: { id: Number(noteId) },
            transaction: t
          })
        }
      } else if (data.status === 2) {
        const approvedComments = comments.filter(c => c.status === 1)
        const noteCountMap: Record<number, number> = {}
        for (const c of approvedComments) {
          noteCountMap[c.noteId] = (noteCountMap[c.noteId] || 0) + 1
        }
        for (const [noteId, count] of Object.entries(noteCountMap)) {
          await Note.decrement('commentCount', {
            by: count,
            where: { id: Number(noteId) },
            transaction: t
          })
        }
      }

      await t.commit()
      return true
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async batchMarkReview(ids: number[], operator: { userId: number; username: string }) {
    const comments = await Comment.findAll({ where: { id: { [Op.in]: ids } } })
    if (comments.length === 0) return true

    const t = await sequelize.transaction()
    try {
      await Comment.update(
        { riskLevel: 1, violationType: '疑似违规待复核' },
        {
          where: { id: { [Op.in]: ids } },
          transaction: t
        }
      )

      const auditLogs = comments.map(c => ({
        commentId: c.id,
        noteId: c.noteId,
        userId: c.userId,
        userName: c.nickname,
        content: c.content,
        action: 5,
        violationType: '疑似违规',
        violationDetail: '标记为疑似违规待复核',
        handlerId: operator.userId,
        handlerName: operator.username
      }))

      await CommentAuditLog.bulkCreate(auditLogs as any, { transaction: t })

      await t.commit()
      return true
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async getListByNoteId(noteId: number, params: { page: number; pageSize: number }) {
    const { page, pageSize } = params

    const { count, rows } = await Comment.findAndCountAll({
      where: { noteId, status: 1, parentId: 0 },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async getStats() {
    const total = await Comment.count()
    const pending = await Comment.count({ where: { status: 0 } })
    const approved = await Comment.count({ where: { status: 1 } })
    const rejected = await Comment.count({ where: { status: 2 } })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayNew = await Comment.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    const riskHigh = await Comment.count({ where: { riskLevel: { [Op.gte]: 2 } } })

    return { total, pending, approved, rejected, todayNew, riskHigh }
  },

  async checkCompliance(content: string, userId: number, noteId: number) {
    return commentComplianceService.fullCheck(content, userId, noteId)
  },

  async getTrace(id: number) {
    const comment = await Comment.findByPk(id)
    if (!comment) throw new AppError('评论不存在', 404)

    const auditLogs = await CommentAuditLog.findAll({
      where: { commentId: id },
      order: [['createTime', 'DESC']]
    })

    const note = await Note.findByPk(comment.noteId)

    const sameUserRecentCount = await Comment.count({
      where: {
        userId: comment.userId,
        createTime: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })

    const sameContentCount = await Comment.count({
      where: {
        content: comment.content,
        id: { [Op.ne]: id }
      }
    })

    const sameIpCount = await Comment.count({
      where: {
        ip: comment.ip,
        id: { [Op.ne]: id },
        ip: { [Op.ne]: '' }
      }
    })

    const isAbnormal = comment.riskLevel >= 2 || sameUserRecentCount > 20 || sameContentCount > 3 || sameIpCount > 10

    return {
      comment: {
        id: comment.id,
        content: comment.content,
        status: comment.status,
        violationType: comment.violationType,
        riskLevel: comment.riskLevel,
        createTime: comment.createTime,
        ip: comment.ip
      },
      source: {
        userId: comment.userId,
        userName: comment.nickname,
        ip: comment.ip,
        publishTime: comment.createTime,
        content: comment.content
      },
      note: note ? {
        id: note.id,
        title: note.title,
        authorName: note.authorName
      } : null,
      riskAnalysis: {
        isAbnormal,
        sameUserRecentCount,
        sameContentCount,
        sameIpCount,
        riskLevel: comment.riskLevel,
        reasons: [
          ...(comment.riskLevel >= 2 ? ['评论已被标记为高风险'] : []),
          ...(sameUserRecentCount > 20 ? [`该用户24小时内发布${sameUserRecentCount}条评论，疑似刷评`] : []),
          ...(sameContentCount > 3 ? [`存在${sameContentCount}条相同内容评论，疑似机器刷评`] : []),
          ...(sameIpCount > 10 ? [`相同IP存在${sameIpCount}条其他评论，疑似恶意灌水`] : [])
        ]
      },
      auditLogs
    }
  },

  async getSensitiveWords() {
    return {
      sensitiveWords: commentComplianceService.getSensitiveWords(),
      violationPhrases: commentComplianceService.getViolationPhrases(),
      trafficKeywords: commentComplianceService.getTrafficKeywords()
    }
  },

  async highlightContent(content: string) {
    const { allMatches } = commentComplianceService.checkContent(content)
    return commentComplianceService.highlightContent(content, allMatches)
  }
}
