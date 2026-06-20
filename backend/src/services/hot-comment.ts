import { Comment, Note, HotComment, HotCommentLog, User, BehaviorLog } from '@models/index'
import { AppError } from '@utils/response'
import { Op, literal, fn, col, where } from 'sequelize'
import sequelize from '@config/database'

const HOT_CONFIG = {
  DEFAULT_LIMIT: 50,
  TOP_AUTO_MAX: 3,
  TOP_MANUAL_MAX: 5,
  EXPIRE_HOURS: 48,
  HOT_MIN_LIKE: 5,
  HOT_MIN_LENGTH: 20,
  MIN_QUALITY: 40
}

const WEIGHTS = {
  LIKE: 4.0,
  REPLY: 5.0,
  TIME: 3.0,
  QUALITY: 3.0
}

function calcWeights(c: {
  likeCount: number; replyCount: number; createTime: Date; contentLength: number;
  keywordDensity?: number
}) {
  const ageHours = (Date.now() - new Date(c.createTime).getTime()) / (1000 * 60 * 60)
  const timeDecay = Math.exp(-ageHours / 72)
  const likeScore = Math.log10(Math.max(c.likeCount, 1) + 1) * WEIGHTS.LIKE
  const replyScore = Math.log10(Math.max(c.replyCount, 1) + 1) * WEIGHTS.REPLY
  const timeScore = timeDecay * WEIGHTS.TIME * 10
  const lenRatio = Math.min(c.contentLength / 120, 1)
  const density = c.keywordDensity || 0
  const densityPenalty = density > 0.2 ? Math.exp(-(density - 0.2) * 8) : 1
  const qualityScore = (lenRatio * 70 + densityPenalty * 30) * (WEIGHTS.QUALITY / 100) * 10
  return {
    weightLike: Number(likeScore.toFixed(2)),
    weightReply: Number(replyScore.toFixed(2)),
    weightTime: Number(timeScore.toFixed(2)),
    weightQuality: Number(qualityScore.toFixed(2)),
    hotScore: Number((likeScore + replyScore + timeScore + qualityScore).toFixed(2)),
    qualityScore: Number((lenRatio * 70 + densityPenalty * 30).toFixed(1)),
    timeDecay: Number(timeDecay.toFixed(3))
  }
}

async function calcReplyCount(parentIds: number[]) {
  if (parentIds.length === 0) return {} as Record<number, number>
  const rows = await Comment.findAll({
    attributes: ['parentId', [fn('COUNT', col('id')), 'cnt']],
    where: { parentId: { [Op.in]: parentIds }, status: 1, deleteTime: null },
    group: ['parent_id'],
    raw: true
  }) as any[]
  const map: Record<number, number> = {}
  rows.forEach(r => { map[r.parentId as number] = Number(r.cnt) })
  return map
}

export const hotCommentService = {
  async computeAndRank(params: { noteId?: number; limit?: number; force?: boolean } = {}) {
    const { noteId, limit = HOT_CONFIG.DEFAULT_LIMIT, force = false } = params
    const cutoffTime = new Date(Date.now() - HOT_CONFIG.EXPIRE_HOURS * 60 * 60 * 1000)

    const commentWhere: any = {
      status: 1,
      deleteTime: null,
      parentId: 0,
      riskLevel: { [Op.lte]: 1 },
      likeCount: { [Op.gte]: HOT_CONFIG.HOT_MIN_LIKE }
    }
    if (noteId) commentWhere.noteId = noteId

    const candidates = await Comment.findAll({
      where: { ...commentWhere, createTime: { [Op.gte]: cutoffTime } },
      attributes: ['id', 'noteId', 'userId', 'nickname', 'avatar', 'content', 'likeCount', 'createTime', 'riskLevel', 'violationType'],
      order: [['like_count', 'DESC']],
      limit: limit * 3
    })

    if (candidates.length === 0) return { total: 0, list: [] }

    const cids = candidates.map(c => c.id)
    const replyMap = await calcReplyCount(cids)

    const manualTops = await HotComment.findAll({
      where: { status: 1, isTop: 2 },
      order: [['top_order', 'ASC']]
    })
    const manualTopIds = new Set(manualTops.map(t => t.commentId))

    const scored: Array<{
      comment: Comment; replyCount: number; weights: ReturnType<typeof calcWeights>;
      hotScore: number; qualityScore: number
    }> = []

    for (const c of candidates) {
      const replyCount = replyMap[c.id] || 0
      const content = c.content || ''
      const density = content.length > 0
        ? Array.from(new Set(content.slice(0, 80).split(''))).length / Math.max(content.length, 1)
        : 0
      const weights = calcWeights({
        likeCount: c.likeCount,
        replyCount,
        createTime: c.createTime as Date,
        contentLength: content.length,
        keywordDensity: density
      })

      if (weights.qualityScore < HOT_CONFIG.MIN_QUALITY && !manualTopIds.has(c.id)) continue
      scored.push({ comment: c, replyCount, weights, hotScore: weights.hotScore, qualityScore: weights.qualityScore })
    }

    scored.sort((a, b) => {
      if (manualTopIds.has(a.comment.id) && !manualTopIds.has(b.comment.id)) return -1
      if (!manualTopIds.has(a.comment.id) && manualTopIds.has(b.comment.id)) return 1
      return b.hotScore - a.hotScore
    })

    const finalList = scored.slice(0, limit)
    const t = await sequelize.transaction()

    try {
      if (force) {
        await HotComment.update(
          { status: 0, updateTime: new Date() },
          { where: { status: 1, isTop: { [Op.ne]: 2 } }, transaction: t }
        )
      }

      let rank = 0
      const createdIds: number[] = []
      for (const item of finalList) {
        rank++
        const { comment, replyCount, weights, hotScore, qualityScore } = item
        const existing = await HotComment.findOne({ where: { commentId: comment.id }, transaction: t })
        const isManualTop = manualTopIds.has(comment.id)
        const manualTop = manualTops.find(tt => tt.commentId === comment.id)

        if (existing) {
          const prevStatus = existing.status
          const prevRank = existing.rank
          const prevScore = Number(existing.hotScore)
          const prevTop = existing.isTop
          const prevOrder = existing.topOrder

          await existing.update({
            likeCount: comment.likeCount,
            replyCount,
            contentLength: comment.content?.length || 0,
            keywordDensity: Number(weights.timeDecay.toFixed(2)),
            qualityScore,
            hotScore,
            weightLike: weights.weightLike,
            weightReply: weights.weightReply,
            weightTime: weights.weightTime,
            weightQuality: weights.weightQuality,
            isTop: isManualTop ? 2 : existing.isTop > 0 ? existing.isTop : 0,
            topOrder: isManualTop ? (manualTop?.topOrder || existing.topOrder) : 0,
            status: 1,
            rank,
            lastRefreshTime: new Date(),
            expireTime: new Date(Date.now() + HOT_CONFIG.EXPIRE_HOURS * 60 * 60 * 1000)
          }, { transaction: t })

          if (prevStatus !== 1 || Math.abs(prevScore - hotScore) > 5 || prevRank !== rank || prevTop !== existing.isTop) {
            await HotCommentLog.create({
              hotCommentId: existing.id,
              commentId: comment.id,
              noteId: comment.noteId,
              action: 7,
              actionName: '刷新排序',
              beforeStatus: prevStatus,
              afterStatus: 1,
              beforeIsTop: prevTop,
              afterIsTop: existing.isTop,
              beforeTopOrder: prevOrder,
              afterTopOrder: existing.topOrder,
              beforeHotScore: prevScore,
              afterHotScore: hotScore,
              beforeRank: prevRank,
              afterRank: rank,
              qualityScore,
              riskLevel: comment.riskLevel,
              violationType: comment.violationType,
              sourceType: 'auto'
            }, { transaction: t })
          }
          createdIds.push(existing.id)
        } else {
          const topFields = isManualTop
            ? { isTop: 2, topSource: 'manual', topOrder: manualTop?.topOrder || 0, topTime: manualTop?.topTime || new Date() }
            : { isTop: 0, topSource: '', topOrder: 0, topTime: null }

          const nc = await HotComment.create({
            commentId: comment.id,
            noteId: comment.noteId,
            userId: comment.userId,
            nickname: comment.nickname,
            avatar: comment.avatar,
            content: comment.content,
            likeCount: comment.likeCount,
            replyCount,
            contentLength: comment.content?.length || 0,
            keywordDensity: Number(weights.timeDecay.toFixed(2)),
            qualityScore,
            hotScore,
            weightLike: weights.weightLike,
            weightReply: weights.weightReply,
            weightTime: weights.weightTime,
            weightQuality: weights.weightQuality,
            ...topFields,
            topHandlerId: manualTop?.topHandlerId,
            topHandlerName: manualTop?.topHandlerName,
            status: 1,
            sourceType: 'auto',
            rank,
            lastRefreshTime: new Date(),
            expireTime: new Date(Date.now() + HOT_CONFIG.EXPIRE_HOURS * 60 * 60 * 1000)
          }, { transaction: t })

          await HotCommentLog.create({
            hotCommentId: nc.id,
            commentId: comment.id,
            noteId: comment.noteId,
            action: 0,
            actionName: '上榜',
            beforeStatus: 0,
            afterStatus: 1,
            beforeIsTop: 0,
            afterIsTop: nc.isTop,
            beforeTopOrder: 0,
            afterTopOrder: nc.topOrder,
            beforeHotScore: 0,
            afterHotScore: hotScore,
            beforeRank: 0,
            afterRank: rank,
            qualityScore,
            riskLevel: comment.riskLevel,
            violationType: comment.violationType,
            sourceType: 'auto'
          }, { transaction: t })

          createdIds.push(nc.id)
        }
      }

      await t.commit()
      return { total: finalList.length, list: finalList, createdIds }
    } catch (err) {
      await t.rollback()
      throw err
    }
  },

  async list(params: {
    page: number; pageSize: number; noteId?: number; keyword?: string;
    isTop?: number; status?: number; sourceType?: string; rankFrom?: number; rankTo?: number
  }) {
    const { page, pageSize, noteId, keyword, isTop, status, sourceType, rankFrom, rankTo } = params
    const where: any = {}
    if (noteId) where.noteId = noteId
    if (keyword) {
      where[Op.or] = [
        { content: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } }
      ]
    }
    if (isTop !== undefined) where.isTop = isTop
    if (status !== undefined) where.status = status
    if (sourceType) where.sourceType = sourceType
    if (rankFrom !== undefined && rankTo !== undefined) where.rank = { [Op.between]: [rankFrom, rankTo] }

    const { count, rows } = await HotComment.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [
        ['is_top', 'DESC'],
        ['top_order', 'ASC'],
        ['hot_score', 'DESC'],
        ['rank', 'ASC']
      ]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async getStats() {
    const total = await HotComment.count()
    const active = await HotComment.count({ where: { status: 1 } })
    const top = await HotComment.count({ where: { isTop: { [Op.gt]: 0 } } })
    const manualTop = await HotComment.count({ where: { isTop: 2 } })
    const autoTop = await HotComment.count({ where: { isTop: 1 } })
    const conflicted = await HotComment.count({ where: { status: 3 } })
    const offShelf = await HotComment.count({ where: { status: 0 } })
    const todayLogs = await HotCommentLog.count({
      where: where(col('create_time'), '>=', literal("DATE_SUB(CURDATE(), INTERVAL 1 DAY)"))
    })
    const avgHot = await HotComment.findOne({
      attributes: [[fn('AVG', col('hot_score')), 'avg']],
      where: { status: 1 },
      raw: true
    }) as any
    const notesCount = await HotComment.count({
      where: { status: 1 },
      distinct: true,
      col: 'note_id'
    })

    return {
      total, active, top, manualTop, autoTop, conflicted, offShelf, todayLogs,
      avgHot: Number(avgHot?.avg || 0).toFixed(1), notesCount
    }
  },

  async manualTop(
    ids: number[],
    handlerId: number,
    handlerName: string,
    startOrder = 1
  ) {
    const t = await sequelize.transaction()
    try {
      let success = 0
      let order = startOrder
      for (const id of ids) {
        const hot = await HotComment.findByPk(id, { transaction: t })
        if (!hot) continue

        const userComment = await Comment.findByPk(hot.commentId, { transaction: t })
        if (userComment?.status !== 1 || userComment?.riskLevel !== 0) {
          if (!hot.conflictReason) {
            await hot.update({
              status: 3,
              conflictReason: `该评论状态(${userComment?.status})异常或风险等级(${userComment?.riskLevel})过高，禁止人工置顶`
            }, { transaction: t })
            await HotCommentLog.create({
              hotCommentId: id, commentId: hot.commentId, noteId: hot.noteId,
              action: 8, actionName: '冲突拦截',
              beforeStatus: hot.status, afterStatus: 3,
              beforeIsTop: hot.isTop, afterIsTop: 0,
              conflictReason: userComment ? `status=${userComment.status},risk=${userComment.riskLevel}` : '评论不存在',
              handlerId, handlerName, sourceType: 'manual'
            }, { transaction: t })
          }
          continue
        }

        const beforeTop = hot.isTop
        const beforeOrder = hot.topOrder
        const beforeStatus = hot.status

        await hot.update({
          isTop: 2, topSource: 'manual', topOrder: order,
          topTime: new Date(), topHandlerId: handlerId, topHandlerName: handlerName, status: 1
        }, { transaction: t })

        await HotCommentLog.create({
          hotCommentId: id, commentId: hot.commentId, noteId: hot.noteId,
          action: 2, actionName: '人工置顶',
          beforeStatus, afterStatus: 1,
          beforeIsTop: beforeTop, afterIsTop: 2,
          beforeTopOrder: beforeOrder, afterTopOrder: order,
          beforeHotScore: Number(hot.hotScore), afterHotScore: Number(hot.hotScore),
          beforeRank: hot.rank, afterRank: hot.rank,
          qualityScore: Number(hot.qualityScore),
          riskLevel: userComment?.riskLevel, violationType: userComment?.violationType,
          handlerId, handlerName, handleNote: `手动置顶第${order}位`, sourceType: 'manual'
        }, { transaction: t })

        order++
        success++
      }
      await t.commit()
      return { total: ids.length, success }
    } catch (err) {
      await t.rollback()
      throw err
    }
  },

  async cancelTop(ids: number[], handlerId: number, handlerName: string) {
    const t = await sequelize.transaction()
    try {
      let success = 0
      for (const id of ids) {
        const hot = await HotComment.findByPk(id, { transaction: t })
        if (!hot || hot.isTop !== 2) continue

        const beforeTop = hot.isTop
        const beforeOrder = hot.topOrder
        await hot.update({ isTop: 0, topSource: '', topOrder: 0 }, { transaction: t })

        await HotCommentLog.create({
          hotCommentId: id, commentId: hot.commentId, noteId: hot.noteId,
          action: 3, actionName: '取消置顶',
          beforeStatus: hot.status, afterStatus: hot.status,
          beforeIsTop: beforeTop, afterIsTop: 0,
          beforeTopOrder: beforeOrder, afterTopOrder: 0,
          beforeHotScore: Number(hot.hotScore), afterHotScore: Number(hot.hotScore),
          beforeRank: hot.rank, afterRank: hot.rank,
          qualityScore: Number(hot.qualityScore),
          handlerId, handlerName, handleNote: '取消人工置顶，回归常规排序', sourceType: 'manual'
        }, { transaction: t })
        success++
      }
      await t.commit()
      return { total: ids.length, success }
    } catch (err) {
      await t.rollback()
      throw err
    }
  },

  async batchRemove(ids: number[], handlerId: number, handlerName: string) {
    const t = await sequelize.transaction()
    try {
      let success = 0
      for (const id of ids) {
        const hot = await HotComment.findByPk(id, { transaction: t })
        if (!hot) continue
        const beforeStatus = hot.status
        const beforeTop = hot.isTop
        const beforeOrder = hot.topOrder
        const beforeRank = hot.rank
        await hot.update({ status: 0, isTop: 0, topOrder: 0, rank: 0 }, { transaction: t })

        await HotCommentLog.create({
          hotCommentId: id, commentId: hot.commentId, noteId: hot.noteId,
          action: 4, actionName: '下架',
          beforeStatus, afterStatus: 0,
          beforeIsTop: beforeTop, afterIsTop: 0,
          beforeTopOrder: beforeOrder, afterTopOrder: 0,
          beforeHotScore: Number(hot.hotScore), afterHotScore: 0,
          beforeRank, afterRank: 0,
          qualityScore: Number(hot.qualityScore),
          handlerId, handlerName, handleNote: '从热门榜单下架', sourceType: 'manual'
        }, { transaction: t })
        success++
      }

      await this.computeAndRank({ force: false })
      await t.commit()
      return { total: ids.length, success, autoRefill: true }
    } catch (err) {
      await t.rollback()
      throw err
    }
  },

  async batchTop(
    ids: number[],
    handlerId: number,
    handlerName: string
  ) {
    if (ids.length > HOT_CONFIG.TOP_MANUAL_MAX + 5) {
      throw new AppError(`批量置顶最多${HOT_CONFIG.TOP_MANUAL_MAX + 5}条`, 400)
    }
    const result = await this.manualTop(ids, handlerId, handlerName, 1)
    const t = await sequelize.transaction()
    try {
      for (const id of ids) {
        const log = await HotCommentLog.findOne({
          where: { hotCommentId: id, action: 2 },
          order: [['create_time', 'DESC']],
          transaction: t
        })
        if (log) {
          await log.update({ action: 5, actionName: '批量置顶', sourceType: 'batch' }, { transaction: t })
        }
      }
      await t.commit()
    } catch { /* ignore */ }
    return result
  },

  async batchOff(ids: number[], handlerId: number, handlerName: string) {
    const r = await this.batchRemove(ids, handlerId, handlerName)
    const t = await sequelize.transaction()
    try {
      for (const id of ids) {
        const log = await HotCommentLog.findOne({
          where: { hotCommentId: id, action: 4 },
          order: [['create_time', 'DESC']],
          transaction: t
        })
        if (log) await log.update({ action: 6, actionName: '批量下架', sourceType: 'batch' }, { transaction: t })
      }
      await t.commit()
    } catch { /* ignore */ }
    return r
  },

  async refreshRanking() {
    return this.computeAndRank({ force: true })
  },

  async getTrace(commentId: number) {
    const comment = await Comment.findByPk(commentId)
    if (!comment) throw new AppError('评论不存在', 404)

    const hot = await HotComment.findOne({ where: { commentId } })
    const logs = await HotCommentLog.findAll({
      where: { commentId },
      order: [['create_time', 'DESC']],
      limit: 100
    })

    const note = await Note.findByPk(comment.noteId)
    const user = await User.findByPk(comment.userId, { attributes: ['id', 'username', 'nickname', 'status', 'riskLevel', 'violationCount'] })

    const last10Logs = await HotCommentLog.findAll({
      where: { handlerId: { [Op.ne]: null } },
      order: [['create_time', 'DESC']],
      limit: 10,
      raw: true
    }) as any[]

    const sameUserTops = await HotCommentLog.count({
      where: { action: { [Op.in]: [2, 5] }, handlerId: user?.id }
    })

    const qualityRatio = comment.content?.length || 0
    const riskFlag = (comment.riskLevel || 0) > 0
      ? [`风险等级：${comment.riskLevel}，违规：${comment.violationType || '无'}`]
      : []

    const topActions = logs.filter(l => l.action === 2 || l.action === 5)
    const isSuspicious = topActions.length > 3
    if (isSuspicious) riskFlag.push(`30日内被人工置顶${topActions.length}次，存在刷榜嫌疑`)
    if (sameUserTops > 10) riskFlag.push(`同管理员24h内置顶操作${sameUserTops}次，可能异常`)
    if (qualityRatio < 15 && hot?.isTop === 2) riskFlag.push(`短内容(${qualityRatio}字)被人工置顶`)

    return {
      comment: {
        id: comment.id, noteId: comment.noteId, userId: comment.userId,
        nickname: comment.nickname, content: comment.content,
        likeCount: comment.likeCount, status: comment.status,
        riskLevel: comment.riskLevel, violationType: comment.violationType,
        ip: comment.ip, createTime: comment.createTime
      },
      note: note ? { id: note.id, title: note.title, author: note.authorName } : null,
      user: user ? {
        id: user.id, username: user.getDataValue('username'), nickname: user.getDataValue('nickname'),
        status: user.getDataValue('status'), riskLevel: user.getDataValue('riskLevel'),
        violationCount: user.getDataValue('violationCount')
      } : null,
      hot: hot ? {
        id: hot.id, hotScore: Number(hot.hotScore), qualityScore: Number(hot.qualityScore),
        weightLike: Number(hot.weightLike), weightReply: Number(hot.weightReply),
        weightTime: Number(hot.weightTime), weightQuality: Number(hot.weightQuality),
        isTop: hot.isTop, topOrder: hot.topOrder, topHandler: hot.topHandlerName,
        topTime: hot.topTime, rank: hot.rank, status: hot.status,
        conflictReason: hot.conflictReason, lastRefresh: hot.lastRefreshTime
      } : null,
      operations: {
        totalOps: logs.length,
        topOps: topActions.length,
        cancelOps: logs.filter(l => l.action === 3).length,
        offOps: logs.filter(l => l.action === 4 || l.action === 6).length,
        refreshOps: logs.filter(l => l.action === 7).length,
        conflictOps: logs.filter(l => l.action === 8).length
      },
      logs: logs.map(l => ({
        id: l.id, action: l.action, actionName: l.actionName,
        beforeStatus: l.beforeStatus, afterStatus: l.afterStatus,
        beforeIsTop: l.beforeIsTop, afterIsTop: l.afterIsTop,
        beforeTopOrder: l.beforeTopOrder, afterTopOrder: l.afterTopOrder,
        beforeHotScore: Number(l.beforeHotScore), afterHotScore: Number(l.afterHotScore),
        beforeRank: l.beforeRank, afterRank: l.afterRank,
        conflictReason: l.conflictReason, anomalyReason: l.anomalyReason,
        qualityScore: Number(l.qualityScore), riskLevel: l.riskLevel,
        violationType: l.violationType, handler: l.handlerName, note: l.handleNote,
        createTime: l.createTime
      })),
      risks: riskFlag
    }
  },

  async getLogs(params: { page: number; pageSize: number; commentId?: number; action?: number; handlerId?: number }) {
    const { page, pageSize, commentId, action, handlerId } = params
    const where: any = {}
    if (commentId) where.commentId = commentId
    if (action !== undefined) where.action = action
    if (handlerId) where.handlerId = handlerId
    const { count, rows } = await HotCommentLog.findAndCountAll({
      where, offset: (page - 1) * pageSize, limit: pageSize,
      order: [['create_time', 'DESC']]
    })
    return { list: rows, total: count, page, pageSize }
  },

  async anomalyDetect() {
    const logs24h = await HotCommentLog.findAll({
      where: {
        action: { [Op.in]: [2, 5] },
        createTime: { [Op.gte]: new Date(Date.now() - 24 * 3600 * 1000) }
      },
      attributes: ['handlerId', 'handlerName', [fn('COUNT', col('id')), 'cnt']],
      group: ['handler_id', 'handler_name'],
      raw: true
    }) as any[]
    const suspicious = logs24h.filter(l => Number(l.cnt) >= 5).map(l => ({
      handlerId: l.handlerId, handlerName: l.handlerName, count: Number(l.cnt)
    }))

    const hotByNotes = await HotComment.findAll({
      where: { isTop: 2, status: 1 },
      attributes: ['noteId', [fn('COUNT', col('id')), 'cnt']],
      group: ['note_id'],
      having: literal('cnt > 3'),
      raw: true
    }) as any[]
    const noteSuspicious = hotByNotes.map(l => ({
      noteId: l.noteId, manualTopCount: Number(l.cnt)
    }))

    const rankHops = await HotCommentLog.findAll({
      where: { action: 7, createTime: { [Op.gte]: new Date(Date.now() - 12 * 3600 * 1000) } },
      limit: 200,
      raw: true
    }) as any[]
    const hopFlags: any[] = []
    for (let i = 1; i < rankHops.length; i++) {
      const prev = rankHops[i - 1]
      const cur = rankHops[i]
      if (prev.beforeRank && cur.afterRank) {
        const hop = Math.abs(cur.afterRank - prev.beforeRank)
        if (hop >= 20) hopFlags.push({
          commentId: cur.commentId,
          hop: `#${prev.beforeRank}→#${cur.afterRank}`,
          diff: hop
        })
      }
    }

    return { suspicious, noteSuspicious, rankHops: hopFlags.slice(0, 30) }
  }
}
