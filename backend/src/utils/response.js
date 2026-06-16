const dayjs = require('dayjs');

const success = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    code: 0,
    message,
    data,
    timestamp: dayjs().valueOf(),
  });
};

const created = (res, data = null, message = '创建成功') => {
  return success(res, data, message, 201);
};

const paginated = (res, { list = [], total = 0, page = 1, pageSize = 10 }, message = '获取成功') => {
  return success(res, {
    list,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }, message);
};

module.exports = {
  success,
  created,
  paginated,
};
