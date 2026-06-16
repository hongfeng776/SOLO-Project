import { get, post, put, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { Note, Tag } from '@/types/business'

export const getNoteList = (params: Record<string, unknown>): Promise<PageResult<Note>> => {
  return get<PageResult<Note>>('/content/notes', params)
}

export const getNoteDetail = (id: number): Promise<Note> => {
  return get<Note>(`/content/notes/${id}`)
}

export const createNote = (data: Partial<Note>): Promise<{ id: number }> => {
  return post<{ id: number }>('/content/notes', data)
}

export const updateNote = (id: number, data: Partial<Note>): Promise<{ id: number }> => {
  return put<{ id: number }>(`/content/notes/${id}`, data)
}

export const submitNoteForReview = (id: number): Promise<{ id: number }> => {
  return post<{ id: number }>(`/content/notes/${id}/submit`)
}

export const auditNote = (id: number, data: { status: number; rejectReason?: string }): Promise<{ id: number }> => {
  return post<{ id: number }>(`/content/notes/${id}/audit`, data)
}

export const batchAuditNotes = (ids: number[], data: { status: number; rejectReason?: string }): Promise<null> => {
  return post<null>('/content/notes/batch-audit', { ids, ...data })
}

export const deleteNote = (id: number): Promise<null> => {
  return del<null>(`/content/notes/${id}`)
}

export const getTagList = (params: Record<string, unknown>): Promise<PageResult<Tag>> => {
  return get<PageResult<Tag>>('/content/tags', params)
}

export const getAllTags = (params?: Record<string, unknown>): Promise<Tag[]> => {
  return get<Tag[]>('/content/tags/all', params)
}

export const createTag = (data: Partial<Tag>): Promise<{ id: number }> => {
  return post<{ id: number }>('/content/tags', data)
}

export const updateTag = (id: number, data: Partial<Tag>): Promise<{ id: number }> => {
  return put<{ id: number }>(`/content/tags/${id}`, data)
}

export const deleteTag = (id: number): Promise<null> => {
  return del<null>(`/content/tags/${id}`)
}

export const batchChangeNoteStatus = (
  ids: number[],
  status: number
): Promise<null> => {
  return post<null>('/content/notes/batch-status', { ids, status })
}

export const getHotNoteList = (params: Record<string, unknown>): Promise<PageResult<Note>> => {
  return get<PageResult<Note>>('/content/notes/hot', params)
}

export const getNoteStats = (): Promise<Record<string, number>> => {
  return get<Record<string, number>>('/content/notes/stats')
}

export const getNoteTrend = (params: {
  startDate: string
  endDate: string
}): Promise<{ date: string; count: number }[]> => {
  return get<{ date: string; count: number }[]>('/content/notes/trend', params)
}

export const incrementNoteView = (id: number): Promise<null> => {
  return post<null>(`/content/notes/${id}/view`)
}

export const incrementNoteLike = (id: number): Promise<null> => {
  return post<null>(`/content/notes/${id}/like`)
}

export const incrementNoteShare = (id: number): Promise<null> => {
  return post<null>(`/content/notes/${id}/share`)
}
