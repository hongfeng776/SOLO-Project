const Joi = require('joi')
const { AppError } = require('../utils/response')

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })
    if (error) {
      const messages = error.details.map(d => d.message).join('; ')
      return next(new AppError(messages, 400, 400))
    }
    req.body = value
    next()
  }
}

const orderCreateSchema = Joi.object({
  passengerId: Joi.number().integer().required().messages({
    'any.required': '乘客ID必填',
    'number.base': '乘客ID必须为整数'
  }),
  startAddress: Joi.string().required().messages({
    'any.required': '起始地址必填'
  }),
  endAddress: Joi.string().required().messages({
    'any.required': '目的地址必填'
  }),
  capacityType: Joi.number().integer().valid(1, 2, 3, 4, 5).required().messages({
    'any.required': '运力类型必填',
    'any.only': '运力类型必须为1-5'
  }),
  startLng: Joi.number(),
  startLat: Joi.number(),
  endLng: Joi.number(),
  endLat: Joi.number(),
  remark: Joi.string().allow('', null)
})

const orderDispatchSchema = Joi.object({
  driverId: Joi.number().integer().required().messages({
    'any.required': '司机ID必填',
    'number.base': '司机ID必须为整数'
  })
})

const ticketCreateSchema = Joi.object({
  orderId: Joi.number().integer().required().messages({
    'any.required': '订单ID必填'
  }),
  type: Joi.number().integer().valid(1, 2, 3, 4).required().messages({
    'any.required': '工单类型必填',
    'any.only': '工单类型必须为1-4'
  }),
  priority: Joi.number().integer().valid(1, 2, 3, 4).required().messages({
    'any.required': '优先级必填',
    'any.only': '优先级必须为1-4'
  }),
  content: Joi.string().required().messages({
    'any.required': '工单内容必填'
  })
})

const couponCreateSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': '优惠券名称必填'
  }),
  code: Joi.string().required().messages({
    'any.required': '优惠券编码必填'
  }),
  type: Joi.number().integer().valid(1, 2, 3).required().messages({
    'any.required': '优惠券类型必填',
    'any.only': '优惠券类型必须为1-3'
  }),
  discount: Joi.number().positive().required().messages({
    'any.required': '优惠金额必填',
    'number.positive': '优惠金额必须大于0'
  }),
  minAmount: Joi.number().min(0).default(0),
  totalCount: Joi.number().integer().min(0).default(0),
  startTime: Joi.date(),
  endTime: Joi.date()
})

const ruleCreateSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': '规则名称必填'
  }),
  code: Joi.string().required().messages({
    'any.required': '规则编码必填'
  }),
  type: Joi.number().integer().valid(1, 2, 3, 4).required().messages({
    'any.required': '规则类型必填',
    'any.only': '规则类型必须为1-4'
  }),
  action: Joi.number().integer().valid(1, 2, 3, 4).required().messages({
    'any.required': '处理动作必填',
    'any.only': '处理动作必须为1-4'
  }),
  threshold: Joi.number().min(0).default(0),
  description: Joi.string().allow('', null)
})

module.exports = {
  validate,
  orderCreateSchema,
  orderDispatchSchema,
  ticketCreateSchema,
  couponCreateSchema,
  ruleCreateSchema
}
