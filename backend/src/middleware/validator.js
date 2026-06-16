const Joi = require('joi');
const { BadRequestError } = require('../utils/errors');

const validate = (schema, data = 'body') => {
  return (req, res, next) => {
    const source = data === 'body' ? req.body : data === 'query' ? req.query : req.params;
    const { error, value } = schema.validate(source, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = {};
      error.details.forEach((detail) => {
        errors[detail.path.join('.')] = detail.message;
      });
      return next(new BadRequestError('请求参数验证失败', errors));
    }

    if (data === 'body') req.body = value;
    else if (data === 'query') req.query = value;
    else req.params = value;

    next();
  };
};

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  keyword: Joi.string().trim().max(100).allow(null, ''),
  sortBy: Joi.string().trim().allow(null, ''),
  sortOrder: Joi.string().valid('ASC', 'DESC').allow(null, ''),
});

module.exports = {
  validate,
  paginationSchema,
  Joi,
};
