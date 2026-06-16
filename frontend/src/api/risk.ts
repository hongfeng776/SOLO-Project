import request from '@/utils/request'

export const getRiskRulesApi = (params: any) => request.get('/risk/rules', params)
export const getRiskRuleDetailApi = (id: number) => request.get(`/risk/rules/${id}`)
export const createRiskRuleApi = (data: any) => request.post('/risk/rules', data)
export const updateRiskRuleApi = (id: number, data: any) => request.put(`/risk/rules/${id}`, data)
export const deleteRiskRuleApi = (id: number) => request.delete(`/risk/rules/${id}`)
export const toggleRiskRuleApi = (id: number) => request.put(`/risk/rules/${id}/toggle`)
export const getRiskRecordsApi = (params: any) => request.get('/risk/records', params)
export const handleRiskRecordApi = (id: number, data: any) => request.put(`/risk/records/${id}`, data)
export const getRiskDashboardApi = () => request.get('/risk/dashboard')
export const checkOrderRiskApi = (data: any) => request.post('/risk/check-order', data)
