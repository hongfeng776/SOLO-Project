const success = (data = null, message = 'success', code = 200) => {
  return {
    code,
    message,
    data
  };
};

const fail = (message = 'error', code = 500, data = null) => {
  return {
    code,
    message,
    data
  };
};

const pagination = (list, total, pageNum, pageSize, message = 'success', code = 200) => {
  return {
    code,
    message,
    data: {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

module.exports = { success, fail, pagination };
