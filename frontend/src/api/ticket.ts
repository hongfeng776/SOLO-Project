import request from '@/utils/request'

export const getTicketListApi = (params: any) => request.get('/ticket', params)
export const getTicketDetailApi = (id: number) => request.get(`/ticket/${id}`)
export const createTicketApi = (data: any) => request.post('/ticket', data)
export const updateTicketApi = (id: number, data: any) => request.put(`/ticket/${id}`, data)
export const handleTicketApi = (id: number, data: any) => request.put(`/ticket/${id}/handle`, data)
export const closeTicketApi = (id: number) => request.put(`/ticket/${id}/close`)
export const batchCloseTicketApi = (ids: number[]) => request.put('/ticket/batch-close', { ids })
export const getTicketStatisticsApi = () => request.get('/ticket/statistics')
