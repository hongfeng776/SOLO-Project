const AdvertisementService = require('../services/AdvertisementService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class AdvertisementController {
  getList = [
    validate(paginationSchema.keys({
      type: Joi.number().integer().allow(null, ''),
      status: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await AdvertisementService.getAdList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getById = [
    async (req, res, next) => {
      try {
        const result = await AdvertisementService.getAdById(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  create = [
    validate(Joi.object({
      name: Joi.string().required().max(255),
      code: Joi.string().required().max(50),
      type: Joi.number().integer().required(),
      position: Joi.string().allow(null, ''),
      title: Joi.string().allow(null, ''),
      subtitle: Joi.string().allow(null, ''),
      image: Joi.string().allow(null, ''),
      video: Joi.string().allow(null, ''),
      redirectUrl: Joi.string().allow(null, ''),
      redirectType: Joi.number().integer(),
      targetId: Joi.number().integer().allow(null, ''),
      advertiserName: Joi.string().allow(null, ''),
      startTime: Joi.date().required(),
      endTime: Joi.date().required(),
      budgetAmount: Joi.number(),
      frequencyCap: Joi.number().integer(),
      targetAudience: Joi.object().allow(null, ''),
      status: Joi.number().integer(),
      auditStatus: Joi.number().integer(),
      sortOrder: Joi.number().integer(),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const id = await AdvertisementService.createAd(req.body, req.user?.userId);
        return created(res, { id }, '广告创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  update = [
    validate(Joi.object({
      name: Joi.string().max(255),
      code: Joi.string().max(50),
      type: Joi.number().integer(),
      position: Joi.string().allow(null, ''),
      title: Joi.string().allow(null, ''),
      subtitle: Joi.string().allow(null, ''),
      image: Joi.string().allow(null, ''),
      video: Joi.string().allow(null, ''),
      redirectUrl: Joi.string().allow(null, ''),
      redirectType: Joi.number().integer(),
      targetId: Joi.number().integer().allow(null, ''),
      advertiserName: Joi.string().allow(null, ''),
      startTime: Joi.date(),
      endTime: Joi.date(),
      budgetAmount: Joi.number(),
      frequencyCap: Joi.number().integer(),
      targetAudience: Joi.object().allow(null, ''),
      status: Joi.number().integer(),
      auditStatus: Joi.number().integer(),
      sortOrder: Joi.number().integer(),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        await AdvertisementService.updateAd(parseInt(req.params.id), req.body, req.user?.userId);
        return success(res, null, '广告更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  delete = [
    async (req, res, next) => {
      try {
        await AdvertisementService.deleteAd(parseInt(req.params.id));
        return success(res, null, '广告删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  batchDelete = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        await AdvertisementService.batchDeleteAds(req.body.ids);
        return success(res, null, '批量删除成功');
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new AdvertisementController();
