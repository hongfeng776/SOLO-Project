import request from '@/utils/request'

export const getCouponListApi = (params: any) => request.get('/coupon', params)
export const getCouponDetailApi = (id: number) => request.get(`/coupon/${id}`)
export const createCouponApi = (data: any) => request.post('/coupon', data)
export const updateCouponApi = (id: number, data: any) => request.put(`/coupon/${id}`, data)
export const deleteCouponApi = (id: number) => request.delete(`/coupon/${id}`)
export const toggleCouponStatusApi = (id: number) => request.put(`/coupon/${id}/toggle`)
export const distributeCouponApi = (data: any) => request.post('/coupon/distribute', data)
