import { Note, Tag, Creator, NoteBatchRecord } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import type { NoteDraftData, NotePublishData, NoteScheduleData } from '@/types/index'
import { userAccountService } from './user-account'
import { noteComplianceService } from './note-compliance'
import { operationLogService } from './operation-log'

export const notePublishService = {
  async saveDraft(userId: number, userName: string, data: NoteDraftData) {
    if (data.id) {
      const note = await Note.findByPk(data.id)
      if (!note) throw new AppError('笔记不存在', 404)
      if (note.authorId !== userId) throw new AppError('无权限修改此笔记', 403)

      const updateData: any = {
        title: data.title,
        content: data.content,
        coverImage: data.coverImage || '',
        videoUrl: data.videoUrl || '',
        noteType: data.noteType || 1,
        externalLinks: data.externalLinks ? data.externalLinks.join(',') : ''
      }
      await note.update(updateData)

      if (data.tagIds) {
        const tags = await Tag.findAll({ where: { id: data.tagIds } })
        await (note as any).setTags(tags)
      }

      return { id: note.id }
    } else {
      const note = await Note.create({
        title: data.title,
        content: data.content,
        coverImage: data.coverImage || '',
        videoUrl: data.videoUrl || '',
        noteType: data.noteType || 1,
        externalLinks: data.externalLinks ? data.externalLinks.join(',') : '',
        status: 0,
        authorId: userId,
        authorName: userName
      } as any)

      if (data.tagIds?.length) {
        const tags = await Tag.findAll({ where: { id: data.tagIds } })
        await (note as any).addTags(tags)
      }

      return { id: note.id }
    }
  },

  async submitForPublish(userId: number, userName: string, data: NotePublishData) {
    const eligibility = await userAccountService.checkPublishEligibility(userId)
    if (!eligibility.eligible) {
      await userAccountService.recordPublishAbnormal({
        userId,
        userName,
        abnormalType: eligibility.accountStatus.isBanned ? 'account_inactive'
          : eligibility.accountStatus.realNameVerified !== 2 ? 'not_verified'
          : eligibility.accountStatus.recentViolations >= 3 ? 'too_many_violations' : 'other',
        abnormalDetail: eligibility.reasons.join('; '),
        ip: data.ip,
        userAgent: data.userAgent
      })
      throw new AppError(eligibility.reasons.join('; '), 400)
    }

    const compliance = await noteComplianceService.checkContentCompliance({
      title: data.title,
      content: data.content,
      coverImage: data.coverImage,
      videoUrl: data.videoUrl,
      externalLinks: data.externalLinks,
      tagIds: data.tagIds,
      noteType: data.noteType
    })

    const fingerprint = noteComplianceService.generateFingerprint(data.title, data.content)
    const similarity = await noteComplianceService.checkSimilarity(
      data.id || null,
      userId,
      fingerprint,
      data.title,
      data.content
    )

    if (!compliance.passed) {
      await noteComplianceService.logComplianceCheck({
        authorId: userId,
        authorName: userName,
        checkType: 'content',
        passed: false,
        violations: compliance.violations,
        fingerprint,
        wordCount: compliance.wordCount,
        tagCount: compliance.tagCount,
        hasExternalLinks: compliance.hasExternalLinks
      })
      await userAccountService.recordPublishAbnormal({
        userId,
        userName,
        abnormalType: 'content_violation',
        abnormalDetail: compliance.violations.map(v => v.message).join('; '),
        ip: data.ip,
        userAgent: data.userAgent
      })
      throw new AppError(compliance.violations.map(v => v.message).join('; '), 400)
    }

    if (similarity.isDuplicate) {
      await noteComplianceService.logComplianceCheck({
        authorId: userId,
        authorName: userName,
        checkType: 'similarity',
        passed: false,
        fingerprint,
        checkDetail: JSON.stringify(similarity.similarNotes)
      })
      await userAccountService.recordPublishAbnormal({
        userId,
        userName,
        abnormalType: 'duplicate_content',
        abnormalDetail: similarity.similarNotes.map(n => `笔记ID:${n.id},相似度:${n.similarity}%`).join('; '),
        ip: data.ip,
        userAgent: data.userAgent
      })
      throw new AppError('内容与已发布笔记重复或高度相似', 400)
    }

    await noteComplianceService.logComplianceCheck({
      authorId: userId,
      authorName: userName,
      checkType: 'full',
      passed: true,
      fingerprint,
      wordCount: compliance.wordCount,
      tagCount: compliance.tagCount,
      hasExternalLinks: compliance.hasExternalLinks
    })

    let noteId: number
    if (data.id) {
      const note = await Note.findByPk(data.id)
      if (!note) throw new AppError('笔记不存在', 404)
      if (note.authorId !== userId) throw new AppError('无权限修改此笔记', 403)
      await note.update({
        title: data.title,
        content: data.content,
        coverImage: data.coverImage || '',
        videoUrl: data.videoUrl || '',
        noteType: data.noteType || 1,
        externalLinks: data.externalLinks ? data.externalLinks.join(',') : '',
        status: 1,
        fingerprint,
        contentFingerprint: fingerprint
      })
      if (data.tagIds) {
        const tags = await Tag.findAll({ where: { id: data.tagIds } })
        await (note as any).setTags(tags)
      }
      noteId = note.id
    } else {
      const note = await Note.create({
        title: data.title,
        content: data.content,
        coverImage: data.coverImage || '',
        videoUrl: data.videoUrl || '',
        noteType: data.noteType || 1,
        externalLinks: data.externalLinks ? data.externalLinks.join(',') : '',
        status: 1,
        authorId: userId,
        authorName: userName,
        fingerprint,
        contentFingerprint: fingerprint
      } as any)
      if (data.tagIds?.length) {
        const tags = await Tag.findAll({ where: { id: data.tagIds } })
        await (note as any).addTags(tags)
      }
      noteId = note.id
    }

    await operationLogService.create({
      module: 'note',
      action: 'submitForPublish',
      userId,
      username: userName,
      params: JSON.stringify({ noteId, title: data.title })
    })

    return { id: noteId }
  },

  async schedulePublish(userId: number, userName: string, data: NoteScheduleData) {
    const minScheduleTime = new Date(Date.now() + 5 * 60 * 1000)
    if (new Date(data.scheduleTime) < minScheduleTime) {
      throw new AppError('定时发布时间至少需要比当前时间晚5分钟', 400)
    }

    const scheduleConflict = await noteComplianceService.checkScheduleConflict(
      userId,
      new Date(data.scheduleTime),
      30
    )
    if (scheduleConflict.hasConflict) {
      await userAccountService.recordPublishAbnormal({
        userId,
        userName,
        abnormalType: 'schedule_conflict',
        abnormalDetail: scheduleConflict.conflictingNotes.map(n => `笔记ID:${n.id},时间:${n.scheduleTime}`).join('; ')
      })
      throw new AppError('该时间已有其他定时发布任务，请选择其他时间', 400)
    }

    const eligibility = await userAccountService.checkPublishEligibility(userId)
    if (!eligibility.eligible) {
      await userAccountService.recordPublishAbnormal({
        userId,
        userName,
        abnormalType: eligibility.accountStatus.isBanned ? 'account_inactive'
          : eligibility.accountStatus.realNameVerified !== 2 ? 'not_verified'
          : eligibility.accountStatus.recentViolations >= 3 ? 'too_many_violations' : 'other',
        abnormalDetail: eligibility.reasons.join('; ')
      })
      throw new AppError(eligibility.reasons.join('; '), 400)
    }

    const compliance = await noteComplianceService.checkContentCompliance({
      title: data.title,
      content: data.content,
      coverImage: data.coverImage,
      videoUrl: data.videoUrl,
      externalLinks: data.externalLinks,
      tagIds: data.tagIds,
      noteType: data.noteType
    })

    const fingerprint = noteComplianceService.generateFingerprint(data.title, data.content)
    const similarity = await noteComplianceService.checkSimilarity(
      data.id || null,
      userId,
      fingerprint,
      data.title,
      data.content
    )

    if (!compliance.passed) {
      await noteComplianceService.logComplianceCheck({
        authorId: userId,
        authorName: userName,
        checkType: 'content',
        passed: false,
        violations: compliance.violations,
        fingerprint,
        wordCount: compliance.wordCount,
        tagCount: compliance.tagCount,
        hasExternalLinks: compliance.hasExternalLinks
      })
      throw new AppError(compliance.violations.map(v => v.message).join('; '), 400)
    }

    if (similarity.isDuplicate) {
      throw new AppError('内容与已发布笔记重复或高度相似', 400)
    }

    let noteId: number
    if (data.id) {
      const note = await Note.findByPk(data.id)
      if (!note) throw new AppError('笔记不存在', 404)
      if (note.authorId !== userId) throw new AppError('无权限修改此笔记', 403)
      await note.update({
        title: data.title,
        content: data.content,
        coverImage: data.coverImage || '',
        videoUrl: data.videoUrl || '',
        noteType: data.noteType || 1,
        externalLinks: data.externalLinks ? data.externalLinks.join(',') : '',
        status: 5,
        scheduleTime: new Date(data.scheduleTime),
        fingerprint,
        contentFingerprint: fingerprint
      })
      if (data.tagIds) {
        const tags = await Tag.findAll({ where: { id: data.tagIds } })
        await (note as any).setTags(tags)
      }
      noteId = note.id
    } else {
      const note = await Note.create({
        title: data.title,
        content: data.content,
        coverImage: data.coverImage || '',
        videoUrl: data.videoUrl || '',
        noteType: data.noteType || 1,
        externalLinks: data.externalLinks ? data.externalLinks.join(',') : '',
        status: 5,
        scheduleTime: new Date(data.scheduleTime),
        authorId: userId,
        authorName: userName,
        fingerprint,
        contentFingerprint: fingerprint
      } as any)
      if (data.tagIds?.length) {
        const tags = await Tag.findAll({ where: { id: data.tagIds } })
        await (note as any).addTags(tags)
      }
      noteId = note.id
    }

    await operationLogService.create({
      module: 'note',
      action: 'schedulePublish',
      userId,
      username: userName,
      params: JSON.stringify({ noteId, title: data.title, scheduleTime: data.scheduleTime })
    })

    return { id: noteId }
  },

  async batchPublish(userId: number, userName: string, notes: NotePublishData[]) {
    const creator = await Creator.findOne({ where: { id: userId } })
    const level = creator?.level || 1
    const limit = this.getBatchPublishLimit(level)

    if (notes.length > limit) {
      throw new AppError(`当前创作者等级最多支持批量发布${limit}条笔记`, 400)
    }

    const batchNo = `BATCH${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const batchRecord = await NoteBatchRecord.create({
      batchNo,
      userId,
      userName,
      totalCount: notes.length,
      successCount: 0,
      failCount: 0,
      pendingCount: 0,
      status: 1,
      notes: JSON.stringify(notes)
    } as any)

    const results: Array<{ index: number; success: boolean; id?: number; error?: string }> = []
    let successCount = 0
    let failCount = 0
    const failDetails: Array<{ index: number; title: string; error: string }> = []

    for (let i = 0; i < notes.length; i++) {
      try {
        const noteData = { ...notes[i], batchNo }
        const result = await this.submitForPublish(userId, userName, noteData)
        results.push({ index: i, success: true, id: result.id })
        successCount++
      } catch (error: any) {
        const errMsg = error instanceof AppError ? error.message : '发布失败'
        results.push({ index: i, success: false, error: errMsg })
        failCount++
        failDetails.push({ index: i, title: notes[i].title, error: errMsg })
      }

      if (i % 5 === 0 || i === notes.length - 1) {
        await batchRecord.update({
          successCount,
          failCount
        } as any)
      }
    }

    const finalStatus = failCount === 0 ? 2 : 2
    await batchRecord.update({
      successCount,
      failCount,
      status: finalStatus,
      failDetails: JSON.stringify(failDetails),
      notes: JSON.stringify(notes)
    } as any)

    await operationLogService.create({
      module: 'note',
      action: 'batchPublish',
      userId,
      username: userName,
      params: JSON.stringify({ batchNo, total: notes.length, success: successCount, fail: failCount })
    })

    return {
      batchNo,
      total: notes.length,
      success: successCount,
      fail: failCount,
      results
    }
  },

  async executeScheduledPublish() {
    const now = new Date()
    const scheduledNotes = await Note.findAll({
      where: {
        status: 5,
        scheduleTime: { [Op.lte]: now }
      }
    })

    const publishedIds: number[] = []
    for (const note of scheduledNotes) {
      try {
        await note.update({
          status: 2,
          publishTime: now,
          scheduleTime: null
        })
        publishedIds.push(note.id)
      } catch (error) {
        console.error('[ScheduledPublish] Failed to publish note:', note.id, error)
      }
    }

    return {
      processed: scheduledNotes.length,
      published: publishedIds.length,
      ids: publishedIds
    }
  },

  getBatchPublishLimit(level: number): number {
    if (level >= 5) return 50
    if (level >= 3) return 20
    return 5
  }
}
