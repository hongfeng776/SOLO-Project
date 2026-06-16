import request from '@/utils/request'

export const getMarketingListApi = (params: any) => request.get('/marketing', params)
export const getMarketingDetailApi = (id: number) => request.get(`/marketing/${id}`)
export const createMarketingApi = (data: any) => request.post('/marketing', data)
export const updateMarketingApi = (id: number, data: any) => request.put(`/marketing/${id}`, data)
export const deleteMarketingApi = (id: number) => request.delete(`/marketing/${id}`)
export const updateMarketingStatusApi = (id: number, status: number) => request.put(`/marketing/${id}/status`, { status })
export const getMarketingStatisticsApi = (id: number) => request.get(`/marketing/statistics/${id}`)
