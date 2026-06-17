import { Note, User, ViolationRecord } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import { REVIEW_WEIGHT_CONFIG, ReviewNoteType } from '@/enums/review'
import type { ReviewWeightParams } from '@/types/index'
import { noteComplianceService } from './note-compliance'

export const reviewWeightService = {
  calculateWeight(params: ReviewWeightParams): number {
    const { noteType, noteLevel, hasSensitiveWords, violationCount7d, authorLevel } = params

    const base = noteType === ReviewNoteType.VIDEO
      ? REVIEW_WEIGHT_CONFIG.BASE_VIDEO
      : REVIEW_WEIGHT_CONFIG.BASE_IMAGE_TEXT

    const levelBonus = noteLevel * REVIEW_WEIGHT_CONFIG.LEVEL_MULTIPLIER

    const riskBonus = (hasSensitiveWords ? REVIEW_WEIGHT_CONFIG.SENSITIVE_WORD_BONUS : 0)
      + violationCount7d * REVIEW_WEIGHT_CONFIG.VIOLATION_7D_MULTIPLIER

    const authorLevelPenalty = (REVIEW_WEIGHT_CONFIG.AUTHOR_LEVEL_PENALTY_BASE - authorLevel) * 5

    const total = base + levelBonus + riskBonus + authorLevelPenalty

    return Math.round(Math.max(0, total))
  },

  async calculateAndSaveWeight(noteId: number): Promise<number> {
    const note = await Note.findByPk(noteId)
    if (!note) throw new AppError('笔记不存在', 404)

    const author = await User.findByPk(note.authorId)
    if (!author) throw new AppError('作者不存在', 404)

    const authorLevel = (author as any).level || 1

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const violationCount7d = await ViolationRecord.count({
      where: {
        targetType: 'note',
        targetId: noteId,
        status: 1,
        createTime: { [Op.gte]: sevenDaysAgo }
      }
    })

    const complianceResult = await noteComplianceService.checkContentCompliance({
      title: note.title,
      content: note.content,
      coverImage: note.coverImage,
      videoUrl: note.videoUrl,
      noteType: note.noteType
    })

    const hasSensitiveWords = complianceResult.violations.some(v => v.type === 'sensitive_word')

    const weight = this.calculateWeight({
      noteType: note.noteType,
      noteLevel: note.reviewLevel,
      hasSensitiveWords,
      violationCount7d,
      authorLevel
    })

    await note.update({ reviewWeight: weight })

    return weight
  },

  async batchCalculateWeights(noteIds: number[]): Promise<number[]> {
    const weights: number[] = []
    for (const noteId of noteIds) {
      try {
        const weight = await this.calculateAndSaveWeight(noteId)
        weights.push(weight)
      } catch (error) {
        weights.push(0)
      }
    }
    return weights
  }
}
