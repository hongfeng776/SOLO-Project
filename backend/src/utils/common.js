const dayjs = require('dayjs')

const formatDate = (date, format = 'YYYY-MM-DD') => {
  return dayjs(date).format(format)
}

const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format)
}

const getPagination = (page = 1, pageSize = 20, maxPageSize = 100) => {
  const p = Math.max(1, parseInt(page, 10) || 1)
  const ps = Math.min(maxPageSize, Math.max(1, parseInt(pageSize, 10) || 20))
  const offset = (p - 1) * ps
  return { page: p, pageSize: ps, offset, limit: ps }
}

const buildWhere = (conditions = {}) => {
  const where = {}
  Object.keys(conditions).forEach((key) => {
    if (conditions[key] !== undefined && conditions[key] !== null && conditions[key] !== '') {
      where[key] = conditions[key]
    }
  })
  return where
}

const buildFuzzyWhere = (keyword, fields = []) => {
  if (!keyword || fields.length === 0) return {}

  const { Op } = require('sequelize')
  return {
    [Op.or]: fields.map((field) => ({
      [field]: {
        [Op.like]: `%${keyword}%`
      }
    }))
  }
}

const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const generateMaterialCode = (prefix = 'MT') => {
  const datePart = dayjs().format('YYYYMMDD')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}${datePart}${randomPart}`
}

module.exports = {
  formatDate,
  formatDateTime,
  getPagination,
  buildWhere,
  buildFuzzyWhere,
  generateRandomString,
  generateMaterialCode
}
