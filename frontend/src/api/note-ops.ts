import { get, post } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  NoteOpsData,
  BatchNoteOpsData,
  NoteOpsResult,
  BatchNoteOpsResult,
  NoteOpsComplianceResult,
  NoteOpsLog
} from '@/types/business'

export const executeNoteOps = (data: NoteOpsData): Promise<NoteOpsResult> => {
  return post<NoteOpsResult>('/note-ops/execute', data)
}

export const batchNoteOps = (data: BatchNoteOpsData): Promise<BatchNoteOpsResult> => {
  return post<BatchNoteOpsResult>('/note-ops/batch', data)
}

export const validateBeforeOps = (data: {
  noteId: number
  newStatus: number
}): Promise<NoteOpsComplianceResult> => {
  return post<NoteOpsComplianceResult>('/note-ops/validate', data)
}

export const getNoteOpsHistory = (
  noteId: number,
  params: { page: number; pageSize: number }
): Promise<PageResult<NoteOpsLog>> => {
  return get<PageResult<NoteOpsLog>>(`/note-ops/history/${noteId}`, params)
}

export const getAbnormalOpsList = (params: {
  page: number
  pageSize: number
}): Promise<PageResult<NoteOpsLog>> => {
  return get<PageResult<NoteOpsLog>>('/note-ops/abnormal', params)
}
