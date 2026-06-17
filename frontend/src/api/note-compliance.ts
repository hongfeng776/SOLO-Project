import { post } from '@utils/request'
import type {
  ComplianceCheckResult,
  SimilarityCheckResult,
  ScheduleConflictResult,
  NotePublishData
} from '@/types/business'

export const checkContentCompliance = (data: NotePublishData): Promise<ComplianceCheckResult> => {
  return post<ComplianceCheckResult>('/note-compliance/check', data)
}

export const checkSimilarity = (data: {
  noteId?: number
  title: string
  content: string
}): Promise<SimilarityCheckResult> => {
  return post<SimilarityCheckResult>('/note-compliance/similarity', data)
}

export const checkScheduleConflict = (data: {
  scheduleTime: string
  windowMinutes?: number
}): Promise<ScheduleConflictResult> => {
  return post<ScheduleConflictResult>('/note-compliance/schedule', data)
}
