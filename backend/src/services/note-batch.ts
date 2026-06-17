import { NoteBatchRecord, Note } from '@models/index'
import { AppError } from '@utils/response'
import type { NotePublishData } from '@/types/index'
import { notePublishService } from './note-publish'
import { operationLogService } from './operation-log'

export const noteBatchService = {
  async list(params: {
    page: number
    pageSize: number
    status?: number
    userId?: number
  }) {
    const { page, pageSize, status, userId } = params
    const where: any = {}

    if (status !== undefined) where.status = status
    if (userId !== undefined) where.userId = userId

    const { count, rows } = await NoteBatchRecord.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createTime', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const batch = await NoteBatchRecord.findByPk(id)
    if (!batch) throw new AppError('批次记录不存在', 404)

    let failDetails: Array<{ index: number; title: string; error: string }> = []
    try {
      failDetails = batch.failDetails ? JSON.parse(batch.failDetails) : []
    } catch {
      failDetails = []
    }

    return {
      ...batch.toJSON(),
      failDetails
    }
  },

  async getStats(batchNo: string) {
    const batch = await NoteBatchRecord.findOne({ where: { batchNo } })
    if (!batch) throw new AppError('批量发布记录不存在', 404)

    const notes = await Note.findAll({ where: { batchNo } })
    const statusCounts: Record<number, number> = {}
    for (const note of notes) {
      statusCounts[note.status] = (statusCounts[note.status] || 0) + 1
    }

    return {
      batchNo: batch.batchNo,
      total: batch.totalCount,
      success: batch.successCount,
      fail: batch.failCount,
      status: batch.status,
      statusBreakdown: {
        draft: statusCounts[0] || 0,
        pendingReview: statusCounts[1] || 0,
        published: statusCounts[2] || 0,
        rejected: statusCounts[3] || 0,
        offShelf: statusCounts[4] || 0,
        scheduled: statusCounts[5] || 0
      }
    }
  },

  async retry(id: number) {
    const batch = await NoteBatchRecord.findByPk(id)
    if (!batch) throw new AppError('批次记录不存在', 404)

    let failDetails: Array<{ index: number; title: string; error: string }> = []
    try {
      failDetails = batch.failDetails ? JSON.parse(batch.failDetails) : []
    } catch {
      failDetails = []
    }

    if (failDetails.length === 0) {
      return { batchNo: batch.batchNo, retried: 0, success: 0, fail: 0 }
    }

    const userId = batch.userId
    const userName = batch.userName

    let notesData: NotePublishData[] = []
    try {
      notesData = (batch as any).notes ? JSON.parse((batch as any).notes) : []
    } catch {
      notesData = []
    }

    const retryResults: Array<{ index: number; success: boolean; id?: number; error?: string }> = []
    let successCount = 0
    let failCount = 0

    for (const fail of failDetails) {
      try {
        const noteData = notesData[fail.index]
        if (noteData) {
          const result = await notePublishService.submitForPublish(userId, userName, noteData)
          retryResults.push({ index: fail.index, success: true, id: result.id })
          successCount++
        } else {
          retryResults.push({ index: fail.index, success: false, error: '笔记数据不存在' })
          failCount++
        }
      } catch (error: any) {
        const errMsg = error instanceof AppError ? error.message : '发布失败'
        retryResults.push({ index: fail.index, success: false, error: errMsg })
        failCount++
      }
    }

    const remainingFailDetails = failDetails.filter(f =>
      !retryResults.find(r => r.index === f.index && r.success)
    )

    await batch.update({
      successCount: (batch.successCount || 0) + successCount,
      failCount: remainingFailDetails.length,
      failDetails: JSON.stringify(remainingFailDetails),
      status: remainingFailDetails.length === 0 ? 2 : 2
    } as any)

    await operationLogService.create({
      module: 'note',
      action: 'retryBatchPublish',
      userId,
      username: userName,
      params: JSON.stringify({ batchNo: batch.batchNo, retryCount: failDetails.length, newSuccess: successCount, newFail: failCount })
    })

    return {
      batchNo: batch.batchNo,
      retried: failDetails.length,
      success: successCount,
      fail: failCount,
      results: retryResults
    }
  }
}
