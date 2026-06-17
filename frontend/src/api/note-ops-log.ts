import { get } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { NoteOpsLog } from '@/types/business'

export const getNoteOpsLogList = (params: {
  page: number
  pageSize: number
  noteId?: number
  operatorId?: number
  operatorRole?: string
  startTime?: string
  endTime?: string
}): Promise<PageResult<NoteOpsLog>> => {
  return get<PageResult<NoteOpsLog>>('/note-ops-log/list', params)
}

export const getNoteOpsLogDetail = (id: number): Promise<NoteOpsLog> => {
  return get<NoteOpsLog>(`/note-ops-log/${id}`)
}

export const getNoteOpsStats = (): Promise<{
  totalToday: number
  abnormalCount: number
  byOperator: Array<{ name: string; count: number }>
}> => {
  return get<{
    totalToday: number
    abnormalCount: number
    byOperator: Array<{ name: string; count: number }>
  }>('/note-ops-log/stats')
}
