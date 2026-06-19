import { InteractionData, InteractionAnomalyLog, Note, User, BehaviorLog } from '@models/index'
import { AppError } from '@utils/response'
import { Op, literal, fn, col } from 'sequelize'
import sequelize from '@config/database'

const DATA_TYPES = ['like', 'favorite', 'share', 'comment'] as const
type DataType = typeof DATA_TYPES[number]

const SURGE_THRESHOLDS: Record<DataType, { window: number; multiplier: number; minAbsolute: number }> = {
  like: { window: 3600, multiplier: 5, minAbsolute: 50 },
  favorite: { window: 3600, multiplier: 5, minAbsolute: 30 },
  share: { window: 3600, multiplier: 5, minAbsolute: 20 },
  comment: { window: 3600, multiplier: 5, minAbsolute: 20 }
}

const HOT_SCORE_WEIGHTS = { like: 1.0, favorite: 1.5, share: 2.0, comment: 1.2 }
const FLOW_LEVEL_THRESHOLDS = [0, 50, 150, 500]
const WEIGHT_DECAY_ON_ANOMALY = 0.5
const QUALITY_BOOST = 1.2

function calculateHotScore(data: { dataType: DataType; realCount: number }[]): number {
  return data.reduce((score, d) => score + d.realCount * HOT_SCORE_WEIGHTS[d.dataType], 0)
}

function determineFlowLevel(hotScore: number): number {
  if (hotScore >= FLOW_LEVEL_THRESHOLDS[3]) return 3
  if (hotScore >= FLOW_LEVEL_THRESHOLDS[2]) return 2
  if (hotScore >= FLOW_LEVEL_THRESHOLDS[1]) return 1
  return 1
}

async function detectAnomaliesForNote(noteId: number): Promise<{
  dataType: DataType
  isAnomaly: number
  anomalyTypes: string[]
  anomalyDetail: Record<string, any>
}[]> {
  const results: any[] = []

  for (const dt of DATA_TYPES) {
    const anomalyTypes: string[] = []
    const anomalyDetail: Record<string, any> = {}
    let isAnomaly = 0

    const interaction = await InteractionData.findOne({
      where: { noteId, dataType: dt }
    })

    const threshold = SURGE_THRESHOLDS[dt]
    const since = new Date(Date.now() - threshold.window * 1000)

    const recentBehaviors = await BehaviorLog.count({
      where: {
        targetId: noteId,
        targetType: 'note',
        behaviorType: dt === 'favorite' ? 'like' : dt,
        createTime: { [Op.gte]: since }
      }
    })

    const totalBefore = interaction?.totalCount || 0
    const prevWindowCount = Math.max(totalBefore - recentBehaviors, 0)

    if (recentBehaviors >= threshold.minAbsolute && prevWindowCount > 0 &&
      recentBehaviors >= prevWindowCount * threshold.multiplier) {
      anomalyTypes.push('sudden_surge')
      anomalyDetail.sudden_surge = {
        recentCount: recentBehaviors,
        prevCount: prevWindowCount,
        multiplier: (recentBehaviors / prevWindowCount).toFixed(1),
        window: `${threshold.window}s`
      }
    }

    const uniqueUsers = await BehaviorLog.aggregate('userId', 'COUNT', {
      distinct: true,
      where: {
        targetId: noteId,
        targetType: 'note',
        behaviorType: dt === 'favorite' ? 'like' : dt,
        createTime: { [Op.gte]: since }
      }
    })

    if (recentBehaviors > 0 && Number(uniqueUsers) > 0) {
      const ratio = recentBehaviors / Number(uniqueUsers)
      if (ratio > 5) {
        anomalyTypes.push('no_real_trace')
        anomalyDetail.no_real_trace = {
          totalActions: recentBehaviors,
          uniqueUsers: Number(uniqueUsers),
          avgPerUser: ratio.toFixed(1)
        }
      }
    }

    const sameIpCount = await BehaviorLog.findAll({
      attributes: ['ip', [fn('COUNT', col('id')), 'cnt']],
      where: {
        targetId: noteId,
        targetType: 'note',
        behaviorType: dt === 'favorite' ? 'like' : dt,
        ip: { [Op.ne]: null },
        createTime: { [Op.gte]: since }
      },
      group: ['ip'],
      having: literal('cnt > 5'),
      raw: true
    }) as any[]

    if (sameIpCount.length > 0) {
      anomalyTypes.push('machine_brush')
      anomalyDetail.machine_brush = {
        suspiciousIpCount: sameIpCount.length,
        topIps: sameIpCount.slice(0, 5).map((r: any) => ({ ip: r.ip, count: Number(r.cnt) }))
      }
    }

    const duplicateActions = await BehaviorLog.count({
      where: {
        targetId: noteId,
        targetType: 'note',
        behaviorType: dt === 'favorite' ? 'like' : dt,
        isAbnormal: 1,
        createTime: { [Op.gte]: since }
      }
    })

    if (duplicateActions > 3) {
      anomalyTypes.push('duplicate')
      anomalyDetail.duplicate = { duplicateCount: duplicateActions }
    }

    if (anomalyTypes.length >= 2) isAnomaly = 3
    else if (anomalyTypes.length === 1) isAnomaly = 2
    else if (anomalyTypes.length > 0) isAnomaly = 1

    results.push({ dataType: dt, isAnomaly, anomalyTypes, anomalyDetail })
  }

  return results
}

export const interactionOpsService = {
  async refreshInteractionData(noteId: number) {
    const note = await Note.findByPk(noteId)
    if (!note) throw new AppError('笔记不存在', 404)

    const anomalyResults = await detectAnomaliesForNote(noteId)

    const t = await sequelize.transaction()
    try {
      const allData: { dataType: DataType; realCount: number }[] = []

      for (const result of anomalyResults) {
        const { dataType, isAnomaly, anomalyTypes, anomalyDetail } = result
        let totalCount = 0
        if (dataType === 'like') totalCount = note.likeCount
        else if (dataType === 'comment') totalCount = note.commentCount
        else if (dataType === 'share') totalCount = note.shareCount
        else totalCount = 0

        const fakeCount = isAnomaly >= 2 ? Math.floor(totalCount * (isAnomaly === 3 ? 0.6 : 0.3)) : 0
        const realCount = Math.max(totalCount - fakeCount, 0)
        const anomalyCount = totalCount - realCount

        allData.push({ dataType, realCount })

        const existing = await InteractionData.findOne({
          where: { noteId, dataType }, transaction: t
        })

        const originalHotScore = totalCount * HOT_SCORE_WEIGHTS[dataType]
        const hotScore = realCount * HOT_SCORE_WEIGHTS[dataType]

        if (existing) {
          await existing.update({
            totalCount, realCount, fakeCount, anomalyCount,
            isAnomaly, anomalyType: anomalyTypes.join(','),
            anomalyDetail: Object.keys(anomalyDetail).length > 0 ? JSON.stringify(anomalyDetail) : null,
            originalHotScore, hotScore
          }, { transaction: t })
        } else {
          await InteractionData.create({
            noteId, dataType, totalCount, realCount, fakeCount, anomalyCount,
            isAnomaly, anomalyType: anomalyTypes.join(','),
            anomalyDetail: Object.keys(anomalyDetail).length > 0 ? JSON.stringify(anomalyDetail) : null,
            originalHotScore, hotScore, weightScore: hotScore, flowLevel: 1, originalFlowLevel: 1
          }, { transaction: t })
        }
      }

      const totalHotScore = calculateHotScore(allData)
      const flowLevel = determineFlowLevel(totalHotScore)

      for (const d of allData) {
        await InteractionData.update({
          hotScore: totalHotScore * (HOT_SCORE_WEIGHTS[d.dataType] / Object.values(HOT_SCORE_WEIGHTS).reduce((a, b) => a + b, 0)),
          flowLevel
        }, {
          where: { noteId, dataType: d.dataType },
          transaction: t
        })
      }

      await Note.update(
        { flowLevel, isHot: flowLevel >= 3 ? 1 : 0 },
        { where: { id: noteId }, transaction: t }
      )

      await t.commit()
      return { noteId, anomalyResults, totalHotScore, flowLevel }
    } catch (err) {
      await t.rollback()
      throw err
    }
  },

  async list(params: {
    page: number; pageSize: number; noteId?: number; dataType?: string;
    isAnomaly?: number; status?: number; isQuality?: number; flowLevel?: number
  }) {
    const { page, pageSize, noteId, dataType, isAnomaly, status, isQuality, flowLevel } = params
    const where: any = {}
    if (noteId) where.noteId = noteId
    if (dataType) where.dataType = dataType
    if (isAnomaly !== undefined) where.isAnomaly = isAnomaly
    if (status !== undefined) where.status = status
    if (isQuality !== undefined) where.isQuality = isQuality
    if (flowLevel !== undefined) where.flowLevel = flowLevel

    const { count, rows } = await InteractionData.findAndCountAll({
      where, offset: (page - 1) * pageSize, limit: pageSize,
      order: [['create_time', 'DESC']]
    })
    return { list: rows, total: count, page, pageSize }
  },

  async getStats() {
    const total = await InteractionData.count()
    const anomalyCount = await InteractionData.count({ where: { isAnomaly: { [Op.gt]: 0 } } })
    const highAnomalyCount = await InteractionData.count({ where: { isAnomaly: 3 } })
    const qualityCount = await InteractionData.count({ where: { isQuality: 1 } })
    const calibratedCount = await InteractionData.count({ where: { status: 2 } })
    const zeroedCount = await InteractionData.count({ where: { status: 0 } })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayAnomalyLogs = await InteractionAnomalyLog.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    const avgHotScore = await InteractionData.findOne({
      attributes: [[fn('AVG', col('hot_score')), 'avg']],
      raw: true
    })

    const flowDist = await InteractionData.findAll({
      attributes: ['flowLevel', [fn('COUNT', col('id')), 'count']],
      group: ['flow_level'],
      raw: true
    })

    return {
      total, anomalyCount, highAnomalyCount, qualityCount, calibratedCount, zeroedCount,
      todayAnomalyLogs,
      anomalyRate: total > 0 ? Number((anomalyCount / total * 100).toFixed(1)) : 0,
      avgHotScore: Number(avgHotScore?.getDataValue?.('avg') || 0).toFixed(2),
      flowDistribution: (flowDist as any[]).map(r => ({
        flowLevel: r.flowLevel,
        count: Number((r as any).count)
      }))
    }
  },

  async batchCalibrate(ids: number[], handlerId: number, handlerName: string) {
    const t = await sequelize.transaction()
    try {
      let success = 0
      for (const id of ids) {
        const data = await InteractionData.findByPk(id, { transaction: t })
        if (!data) continue

        const beforeTotal = data.totalCount
        const beforeReal = data.realCount
        const beforeHot = Number(data.hotScore)
        const beforeFlow = data.flowLevel
        const beforeWeight = Number(data.weightScore)

        const newRealCount = data.realCount
        const newFakeCount = 0
        const newTotal = newRealCount + newFakeCount
        const newAnomalyCount = 0
        const newHotScore = newRealCount * HOT_SCORE_WEIGHTS[data.dataType as DataType]
        const newFlowLevel = determineFlowLevel(newHotScore)
        const newWeightScore = data.isQuality ? newHotScore * QUALITY_BOOST : newHotScore

        await data.update({
          totalCount: newTotal, realCount: newRealCount, fakeCount: newFakeCount,
          anomalyCount: newAnomalyCount, isAnomaly: 0, anomalyType: '', anomalyDetail: null,
          hotScore: newHotScore, weightScore: newWeightScore, flowLevel: newFlowLevel,
          status: 2, lastCalibrationTime: new Date(),
          lastCalibrationUserId: handlerId, lastCalibrationUserName: handlerName
        }, { transaction: t })

        await InteractionAnomalyLog.create({
          interactionDataId: id, noteId: data.noteId, dataType: data.dataType,
          action: 2, beforeTotalCount: beforeTotal, afterTotalCount: newTotal,
          beforeRealCount: beforeReal, afterRealCount: newRealCount,
          beforeHotScore: beforeHot, afterHotScore: newHotScore,
          beforeFlowLevel: beforeFlow, afterFlowLevel: newFlowLevel,
          beforeWeightScore: beforeWeight, afterWeightScore: newWeightScore,
          handlerId, handlerName, handleNote: '批量校准互动数据'
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

  async batchCleanFake(ids: number[], handlerId: number, handlerName: string) {
    const t = await sequelize.transaction()
    try {
      let success = 0
      for (const id of ids) {
        const data = await InteractionData.findByPk(id, { transaction: t })
        if (!data || data.fakeCount === 0) continue

        const beforeTotal = data.totalCount
        const beforeReal = data.realCount
        const beforeHot = Number(data.hotScore)
        const beforeFlow = data.flowLevel
        const beforeWeight = Number(data.weightScore)

        const newTotal = data.realCount
        const newHotScore = data.realCount * HOT_SCORE_WEIGHTS[data.dataType as DataType]
        const newFlowLevel = determineFlowLevel(newHotScore)
        const newWeightScore = data.isQuality ? newHotScore * QUALITY_BOOST : newHotScore * WEIGHT_DECAY_ON_ANOMALY

        await data.update({
          totalCount: newTotal, fakeCount: 0, anomalyCount: 0,
          isAnomaly: 0, anomalyType: '', anomalyDetail: null,
          hotScore: newHotScore, weightScore: newWeightScore, flowLevel: newFlowLevel,
          status: 0
        }, { transaction: t })

        await InteractionAnomalyLog.create({
          interactionDataId: id, noteId: data.noteId, dataType: data.dataType,
          action: 3, beforeTotalCount: beforeTotal, afterTotalCount: newTotal,
          beforeRealCount: beforeReal, afterRealCount: data.realCount,
          beforeHotScore: beforeHot, afterHotScore: newHotScore,
          beforeFlowLevel: beforeFlow, afterFlowLevel: newFlowLevel,
          beforeWeightScore: beforeWeight, afterWeightScore: newWeightScore,
          handlerId, handlerName, handleNote: '批量清零虚假互动数据'
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

  async batchMarkQuality(ids: number[], handlerId: number, handlerName: string) {
    const t = await sequelize.transaction()
    try {
      let success = 0
      for (const id of ids) {
        const data = await InteractionData.findByPk(id, { transaction: t })
        if (!data) continue

        const qualityScore = Math.min(
          (data.realCount / Math.max(data.totalCount, 1)) * 100,
          100
        )
        const boostWeight = Number(data.weightScore) * QUALITY_BOOST

        await data.update({
          isQuality: 1, qualityScore,
          weightScore: boostWeight, status: 3
        }, { transaction: t })

        await InteractionAnomalyLog.create({
          interactionDataId: id, noteId: data.noteId, dataType: data.dataType,
          action: 4, beforeWeightScore: Number(data.weightScore), afterWeightScore: boostWeight,
          handlerId, handlerName, handleNote: '批量标记优质互动笔记'
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

  async linkWeight(noteId: number, handlerId: number, handlerName: string) {
    const interactions = await InteractionData.findAll({ where: { noteId } })
    if (interactions.length === 0) throw new AppError('该笔记无互动数据', 404)

    const t = await sequelize.transaction()
    try {
      const allData: { dataType: DataType; realCount: number }[] = interactions.map(i => ({
        dataType: i.dataType as DataType,
        realCount: i.realCount
      }))

      const totalHotScore = calculateHotScore(allData)
      const flowLevel = determineFlowLevel(totalHotScore)

      for (const data of interactions) {
        const beforeWeight = Number(data.weightScore)
        const beforeFlow = data.flowLevel
        let newWeight = data.realCount * HOT_SCORE_WEIGHTS[data.dataType as DataType]
        if (data.isAnomaly === 0 && data.isQuality === 1) newWeight *= QUALITY_BOOST
        if (data.isAnomaly >= 2) newWeight *= WEIGHT_DECAY_ON_ANOMALY

        await data.update({
          hotScore: totalHotScore * (HOT_SCORE_WEIGHTS[data.dataType as DataType] / Object.values(HOT_SCORE_WEIGHTS).reduce((a, b) => a + b, 0)),
          weightScore: newWeight, flowLevel
        }, { transaction: t })

        await InteractionAnomalyLog.create({
          interactionDataId: data.id, noteId, dataType: data.dataType,
          action: 5, beforeWeightScore: beforeWeight, afterWeightScore: newWeight,
          beforeFlowLevel: beforeFlow, afterFlowLevel: flowLevel,
          handlerId, handlerName, handleNote: '权重联动更新'
        }, { transaction: t })
      }

      await Note.update(
        { flowLevel, isHot: flowLevel >= 3 ? 1 : 0 },
        { where: { id: noteId }, transaction: t }
      )

      await t.commit()
      return { noteId, totalHotScore, flowLevel, updated: interactions.length }
    } catch (err) {
      await t.rollback()
      throw err
    }
  },

  async getTrace(noteId: number) {
    const note = await Note.findByPk(noteId)
    if (!note) throw new AppError('笔记不存在', 404)

    const interactions = await InteractionData.findAll({ where: { noteId } })
    const logs = await InteractionAnomalyLog.findAll({
      where: { noteId },
      order: [['create_time', 'DESC']],
      limit: 100
    })

    const behaviors = await BehaviorLog.findAll({
      where: { targetId: noteId, targetType: 'note' },
      order: [['create_time', 'DESC']],
      limit: 200
    })

    const totalReal = interactions.reduce((s, i) => s + i.realCount, 0)
    const totalFake = interactions.reduce((s, i) => s + i.fakeCount, 0)
    const totalAnomaly = interactions.reduce((s, i) => s + i.anomalyCount, 0)
    const avgQuality = interactions.length > 0
      ? interactions.reduce((s, i) => s + Number(i.qualityScore), 0) / interactions.length
      : 0

    const uniqueIps = new Set(behaviors.filter(b => b.ip).map(b => b.ip)).size
    const uniqueUsers = new Set(behaviors.map(b => b.userId)).size
    const hourlyMap: Record<number, number> = {}
    behaviors.forEach(b => {
      const h = new Date(b.createTime).getHours()
      hourlyMap[h] = (hourlyMap[h] || 0) + 1
    })
    const maxHourly = Math.max(...Object.values(hourlyMap), 0)

    const authenticityRatio = totalReal + totalFake > 0
      ? (totalReal / (totalReal + totalFake) * 100).toFixed(1)
      : '100.0'

    const reportItems = interactions.map(i => ({
      dataType: i.dataType,
      totalCount: i.totalCount,
      realCount: i.realCount,
      fakeCount: i.fakeCount,
      anomalyCount: i.anomalyCount,
      isAnomaly: i.isAnomaly,
      anomalyType: i.anomalyType,
      hotScore: Number(i.hotScore),
      weightScore: Number(i.weightScore),
      flowLevel: i.flowLevel,
      isQuality: i.isQuality,
      qualityScore: Number(i.qualityScore),
      status: i.status
    }))

    return {
      note: {
        id: note.id, title: note.title, authorId: note.authorId,
        authorName: note.authorName, flowLevel: note.flowLevel,
        isHot: note.isHot, viewCount: note.viewCount,
        likeCount: note.likeCount, commentCount: note.commentCount,
        shareCount: note.shareCount, createTime: note.createTime
      },
      summary: {
        totalReal, totalFake, totalAnomaly, avgQuality: avgQuality.toFixed(1),
        uniqueIps, uniqueUsers, maxHourly, authenticityRatio
      },
      interactions: reportItems,
      logs: logs.map(l => ({
        id: l.id, action: l.action, anomalyType: l.anomalyType,
        beforeTotalCount: l.beforeTotalCount, afterTotalCount: l.afterTotalCount,
        beforeRealCount: l.beforeRealCount, afterRealCount: l.afterRealCount,
        beforeHotScore: Number(l.beforeHotScore), afterHotScore: Number(l.afterHotScore),
        beforeFlowLevel: l.beforeFlowLevel, afterFlowLevel: l.afterFlowLevel,
        beforeWeightScore: Number(l.beforeWeightScore), afterWeightScore: Number(l.afterWeightScore),
        handlerName: l.handlerName, handleNote: l.handleNote,
        createTime: l.createTime
      })),
      behaviors: behaviors.map(b => ({
        id: b.id, userId: b.userId, userName: b.userName,
        behaviorType: b.behaviorType, ip: b.ip,
        isAbnormal: b.isAbnormal, abnormalType: b.abnormalType,
        riskLevel: b.riskLevel, createTime: b.createTime
      }))
    }
  },

  async getAnomalyLogs(params: {
    page: number; pageSize: number; noteId?: number; action?: number
  }) {
    const { page, pageSize, noteId, action } = params
    const where: any = {}
    if (noteId) where.noteId = noteId
    if (action !== undefined) where.action = action

    const { count, rows } = await InteractionAnomalyLog.findAndCountAll({
      where, offset: (page - 1) * pageSize, limit: pageSize,
      order: [['create_time', 'DESC']]
    })
    return { list: rows, total: count, page, pageSize }
  }
}
