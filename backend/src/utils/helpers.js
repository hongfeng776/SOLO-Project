const dayjs = require('dayjs');
const { AppError } = require('./errors');

const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format);
};

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || 10, 1), 100);
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, limit: pageSize };
};

const parseSort = (query, defaultSort = [['created_at', 'DESC']]) => {
  if (!query.sortBy) return defaultSort;
  const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
  return [[query.sortBy, sortOrder]];
};

const parseSearch = (query, fields = []) => {
  if (!query.keyword || fields.length === 0) return {};
  const keyword = query.keyword.trim();
  return {
    [require('../config/database').Op.or]: fields.map((field) => ({
      [field]: {
        [require('../config/database').Op.like]: `%${keyword}%`,
      },
    })),
  };
};

const generateRandomString = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const maskPhone = (phone) => {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

module.exports = {
  formatDate,
  parsePagination,
  parseSort,
  parseSearch,
  generateRandomString,
  maskPhone,
  chunkArray,
};
