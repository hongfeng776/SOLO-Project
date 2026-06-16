import request from '@/utils/request'

export const getNotificationListApi = (params: any) => request.get('/notification', params)
export const getUnreadCountApi = () => request.get('/notification/unread-count')
export const markReadApi = (id: number) => request.put(`/notification/read/${id}`)
export const markAllReadApi = () => request.put('/notification/read-all')
export const sendNotificationApi = (data: any) => request.post('/notification', data)
export const deleteNotificationApi = (id: number) => request.delete(`/notification/${id}`)
