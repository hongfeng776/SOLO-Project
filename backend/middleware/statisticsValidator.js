const { ValidationError, ForbiddenError } = require('../utils/error');

const VALID_PERIODS = ['day', 'week', 'month', 'custom'];
const VALID_CATEGORIES = ['flight', 'hotel', 'car', 'ticket', 'business_travel'];
const MAX_DATE_RANGE_DAYS = 365;

const validateStatisticsParams = (req, res, next) => {
  try {
    const { period, startTime, endTime, category } = req.method === 'GET' ? req.query : req.body;
    const operator = req.user;

    if (period && !VALID_PERIODS.includes(period)) {
      throw new ValidationError(`period参数无效，仅支持 ${VALID_PERIODS.join(', ')}`);
    }

    if (period === 'custom') {
      if (!startTime || !endTime) {
        throw new ValidationError('custom周期必须指定startTime和endTime');
      }
    }

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime())) {
        throw new ValidationError('startTime格式无效');
      }
      if (isNaN(end.getTime())) {
        throw new ValidationError('endTime格式无效');
      }
      if (start > end) {
        throw new ValidationError('startTime不能大于endTime');
      }

      const diffDays = (end - start) / (1000 * 60 * 60 * 24);
      if (diffDays > MAX_DATE_RANGE_DAYS) {
        throw new ValidationError(`时间跨度不能超过${MAX_DATE_RANGE_DAYS}天`);
      }
    }

    if (category) {
      const categoryList = Array.isArray(category) ? category : [category];
      for (const cat of categoryList) {
        if (!VALID_CATEGORIES.includes(cat)) {
          throw new ValidationError(`category参数无效，仅支持 ${VALID_CATEGORIES.join(', ')}`);
        }
      }

      if (operator?.roleCode !== 'admin' && operator?.categories) {
        const allowedCategories = Array.isArray(operator.categories) ? operator.categories : [operator.categories];
        for (const cat of categoryList) {
          if (!allowedCategories.includes(cat)) {
            throw new ForbiddenError(`无权限访问品类: ${cat}`);
          }
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateStatisticsParams
};
