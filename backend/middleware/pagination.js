const pagination = (req, res, next) => {
  try {
    const pageNum = parseInt(req.query.pageNum) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    const pagination = {
      pageNum: pageNum > 0 ? pageNum : 1,
      pageSize: pageSize > 0 ? pageSize : 10,
      offset: (pageNum - 1) * pageSize,
      limit: pageSize
    };
    
    req.pagination = pagination;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = pagination;
