import { get, post } from '@utils/request'
import type {
  NoteDraftData,
  NotePublishData,
  NoteScheduleData,
  BatchPublishResult
} from '@/types/business'

export const saveDraft = (data: NoteDraftData): Promise<{ id: number }> => {
  return post<{ id: number }>('/note-publish/draft', data)
}

export const submitForPublish = (data: NotePublishData): Promise<{ id: number; status: number }> => {
  return post<{ id: number; status: number }>('/note-publish/publish', data)
}

export const schedulePublish = (
  data: NoteScheduleData
): Promise<{ id: number; status: number; scheduleTime: string }> => {
  return post<{ id: number; status: number; scheduleTime: string }>('/note-publish/schedule', data)
}

export const batchPublish = (data: { notes: NotePublishData[] }): Promise<BatchPublishResult> => {
  return post<BatchPublishResult>('/note-publish/batch', data)
}

export const getBatchPublishLimit = (level: number): Promise<{ limit: number; level: number }> => {
  return get<{ limit: number; level: number }>('/note-publish/batch-limit', { level })
}

export const executeScheduledPublish = (): Promise<{ processed: number }> => {
  return post<{ processed: number }>('/note-publish/execute-scheduled')
}
