import request from '@/utils/request'

export const getOrderAnalyticsApi = (params?: any) => request.get('/analytics/order', params)
export const getCapacityAnalyticsApi = (params?: any) => request.get('/analytics/capacity', params)
export const getUserAnalyticsApi = (params?: any) => request.get('/analytics/user', params)
export const getFinanceAnalyticsApi = (params?: any) => request.get('/analytics/finance', params)
export const getMarketingAnalyticsApi = (params?: any) => request.get('/analytics/marketing', params)
export const getRiskAnalyticsApi = (params?: any) => request.get('/analytics/risk', params)
