import type { Request, Response, NextFunction } from 'express'
import { noteComplianceService } from '@services/note-compliance'
import { success } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const checkContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, content, coverImage, videoUrl, externalLinks, tagIds, noteType } = req.body
    const data = await noteComplianceService.checkContentCompliance({
      title,
      content,
      coverImage,
      videoUrl,
      externalLinks,
      tagIds,
      noteType
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const checkSimilarity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { noteId, title, content, authorId } = req.body
    const fingerprint = noteComplianceService.generateFingerprint(title, content)
    const similarityResult = await noteComplianceService.checkSimilarity(
      noteId ?? null,
      authorId ?? req.user!.userId,
      fingerprint,
      title,
      content
    )
    success(res, {
      fingerprint,
      isDuplicate: similarityResult.isDuplicate,
      similarNotes: similarityResult.similarNotes
    })
  } catch (error) {
    next(error)
  }
}

export const checkSchedule = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { authorId, scheduleTime, windowMinutes } = req.body
    const data = await noteComplianceService.checkScheduleConflict(
      authorId ?? req.user!.userId,
      new Date(scheduleTime),
      windowMinutes ?? 30
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}
