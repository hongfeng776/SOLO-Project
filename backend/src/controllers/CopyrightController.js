const CopyrightService = require('../services/CopyrightService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class CopyrightController {
  getList = [
    validate(paginationSchema.keys({
      type: Joi.number().integer().allow(null, ''),
      status: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CopyrightService.getCopyrightList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getById = [
    async (req, res, next) => {
      try {
        const result = await CopyrightService.getCopyrightById(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  create = [
    validate(Joi.object({
      code: Joi.string().required().max(50),
      name: Joi.string().required().max(255),
      type: Joi.number().integer().required(),
      supplierName: Joi.string().required().max(255),
      supplierContact: Joi.string().allow(null, ''),
      supplierPhone: Joi.string().allow(null, ''),
      contractNo: Joi.string().allow(null, ''),
      contractFile: Joi.string().allow(null, ''),
      authorizationFile: Joi.string().allow(null, ''),
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      territories: Joi.string().allow(null, ''),
      licenseFee: Joi.number(),
      currency: Joi.string().allow(null, ''),
      paymentStatus: Joi.number().integer(),
      description: Joi.string().allow(null, ''),
      attachments: Joi.array().allow(null, ''),
      status: Joi.number().integer(),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const id = await CopyrightService.createCopyright(req.body, req.user?.userId);
        return created(res, { id }, '版权创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  update = [
    validate(Joi.object({
      code: Joi.string().max(50),
      name: Joi.string().max(255),
      type: Joi.number().integer(),
      supplierName: Joi.string().max(255),
      supplierContact: Joi.string().allow(null, ''),
      supplierPhone: Joi.string().allow(null, ''),
      contractNo: Joi.string().allow(null, ''),
      contractFile: Joi.string().allow(null, ''),
      authorizationFile: Joi.string().allow(null, ''),
      startDate: Joi.date(),
      endDate: Joi.date(),
      territories: Joi.string().allow(null, ''),
      licenseFee: Joi.number(),
      currency: Joi.string().allow(null, ''),
      paymentStatus: Joi.number().integer(),
      description: Joi.string().allow(null, ''),
      attachments: Joi.array().allow(null, ''),
      status: Joi.number().integer(),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await CopyrightService.updateCopyright(parseInt(req.params.id), req.body, req.user?.userId);
        return success(res, null, '版权更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  delete = [
    async (req, res, next) => {
      try {
        await CopyrightService.deleteCopyright(parseInt(req.params.id));
        return success(res, null, '版权删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new CopyrightController();
