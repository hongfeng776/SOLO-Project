import request from '@/utils/request'

export function getMerchantList(params) {
  return request({
    url: '/merchants',
    method: 'get',
    params
  })
}

export function getMerchant(id) {
  return request({
    url: `/merchants/${id}`,
    method: 'get'
  })
}

export function createMerchant(data) {
  return request({
    url: '/merchants',
    method: 'post',
    data
  })
}

export function updateMerchant(id, data) {
  return request({
    url: `/merchants/${id}`,
    method: 'put',
    data
  })
}

export function deleteMerchant(id) {
  return request({
    url: `/merchants/${id}`,
    method: 'delete'
  })
}

export function batchDeleteMerchant(ids) {
  return request({
    url: '/merchants/batch',
    method: 'delete',
    data: { ids }
  })
}

export function auditMerchant(id, auditStatus, approveRemark) {
  return request({
    url: `/merchants/${id}/audit`,
    method: 'post',
    data: { auditStatus, approveRemark }
  })
}

export function getAuditStats() {
  return request({
    url: '/merchants/audit/stats',
    method: 'get'
  })
}

export function getPendingAuditList(params) {
  return request({
    url: '/merchants/audit/pending',
    method: 'get',
    params
  })
}

export function getAuditDetail(id) {
  return request({
    url: `/merchants/${id}/audit/detail`,
    method: 'get'
  })
}

export function preAuditCheck(id) {
  return request({
    url: `/merchants/${id}/audit/precheck`,
    method: 'get'
  })
}

export function submitAuditPass(id, data) {
  return request({
    url: `/merchants/${id}/audit/pass`,
    method: 'post',
    data
  })
}

export function submitAuditReject(id, data) {
  return request({
    url: `/merchants/${id}/audit/reject`,
    method: 'post',
    data
  })
}

export function submitAuditTemporary(id, data) {
  return request({
    url: `/merchants/${id}/audit/temporary`,
    method: 'post',
    data
  })
}

export function batchAuditPass(data) {
  return request({
    url: '/merchants/batch/audit-pass',
    method: 'post',
    data
  })
}

export function batchAuditReject(data) {
  return request({
    url: '/merchants/batch/audit-reject',
    method: 'post',
    data
  })
}

export function batchAuditTemporary(data) {
  return request({
    url: '/merchants/batch/audit-temporary',
    method: 'post',
    data
  })
}

export function checkExpiredAudits() {
  return request({
    url: '/merchants/audit/check-expired',
    method: 'post'
  })
}

export function getAuditTrace(id, params) {
  return request({
    url: `/merchants/${id}/audit/trace`,
    method: 'get',
    params
  })
}

export function getQualifications(id) {
  return request({
    url: `/merchants/${id}/qualifications`,
    method: 'get'
  })
}

export function saveQualifications(id, qualifications) {
  return request({
    url: `/merchants/${id}/qualifications`,
    method: 'put',
    data: { qualifications }
  })
}
