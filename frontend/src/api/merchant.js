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

export function getOpsStats(params) {
  return request({
    url: '/merchants/ops/stats',
    method: 'get',
    params
  })
}

export function getOpsMerchantList(params) {
  return request({
    url: '/merchants/ops/list',
    method: 'get',
    params
  })
}

export function verifyFieldUnique(params) {
  return request({
    url: '/merchants/ops/verify-unique',
    method: 'get',
    params
  })
}

export function getOpsDetail(id) {
  return request({
    url: `/merchants/${id}/ops/detail`,
    method: 'get'
  })
}

export function preOpsCheck(id) {
  return request({
    url: `/merchants/${id}/ops/precheck`,
    method: 'get'
  })
}

export function updateBasicInfo(id, data) {
  return request({
    url: `/merchants/${id}/ops/basic-info`,
    method: 'put',
    data
  })
}

export function updateBusinessInfo(id, data) {
  return request({
    url: `/merchants/${id}/ops/business-info`,
    method: 'put',
    data
  })
}

export function updateContactInfo(id, data) {
  return request({
    url: `/merchants/${id}/ops/contact-info`,
    method: 'put',
    data
  })
}

export function updateSettlementInfo(id, data) {
  return request({
    url: `/merchants/${id}/ops/settlement-info`,
    method: 'put',
    data
  })
}

export function updateBusinessStatus(id, data) {
  return request({
    url: `/merchants/${id}/ops/business-status`,
    method: 'put',
    data
  })
}

export function updateOperationStatus(id, data) {
  return request({
    url: `/merchants/${id}/ops/operation-status`,
    method: 'put',
    data
  })
}

export function batchUpdateTags(data) {
  return request({
    url: '/merchants/batch/ops/update-tags',
    method: 'post',
    data
  })
}

export function batchUpdateNotice(data) {
  return request({
    url: '/merchants/batch/ops/update-notice',
    method: 'post',
    data
  })
}

export function batchLockAccounts(data) {
  return request({
    url: '/merchants/batch/ops/lock-accounts',
    method: 'post',
    data
  })
}

export function getChangeLogs(id, params) {
  return request({
    url: `/merchants/${id}/ops/change-logs`,
    method: 'get',
    params
  })
}

export function getCompleteTrace(id) {
  return request({
    url: `/merchants/${id}/ops/complete-trace`,
    method: 'get'
  })
}
