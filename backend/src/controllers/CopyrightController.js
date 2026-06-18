const CopyrightService = require('../services/CopyrightService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class CopyrightController {
  getList = [
    validate(paginationSchema.keys({
      type: Joi.number().integer().allow(null, ''),
      contentType: Joi.number().integer().allow(null, ''),
      status: Joi.number().integer().allow(null, ''),
      ownershipStatus: Joi.number().integer().allow(null, ''),
      complianceStatus: Joi.number().integer().allow(null, ''),
      bindStatus: Joi.number().integer().allow(null, ''),
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

  checkConflict = [
    validate(Joi.object({
      code: Joi.string().max(50),
      contentIds: Joi.array().items(Joi.number().integer()).allow(null, ''),
      excludeId: Joi.number().integer().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightService.checkConflict(req.body, req.body.excludeId);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  verifyQualification = [
    validate(Joi.object({
      copyrightCertificate: Joi.string().allow(null, ''),
      authorizationAgreement: Joi.string().allow(null, ''),
      ownershipProof: Joi.string().allow(null, ''),
      qualificationFiles: Joi.array().allow(null, ''),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightService.verifyQualificationFiles(req.body);
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
      contentType: Joi.number().integer().allow(null, ''),
      supplierName: Joi.string().required().max(255),
      supplierContact: Joi.string().allow(null, ''),
      supplierPhone: Joi.string().allow(null, ''),
      contractNo: Joi.string().allow(null, ''),
      contractFile: Joi.string().allow(null, ''),
      authorizationFile: Joi.string().allow(null, ''),
      copyrightCertificate: Joi.string().allow(null, ''),
      authorizationAgreement: Joi.string().allow(null, ''),
      ownershipProof: Joi.string().allow(null, ''),
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      territories: Joi.string().allow(null, ''),
      licenseScope: Joi.array().allow(null, ''),
      licenseFee: Joi.number(),
      currency: Joi.string().allow(null, ''),
      paymentStatus: Joi.number().integer(),
      ownershipStatus: Joi.number().integer(),
      description: Joi.string().allow(null, ''),
      attachments: Joi.array().allow(null, ''),
      qualificationFiles: Joi.array().allow(null, ''),
      status: Joi.number().integer(),
      remark: Joi.string().allow(null, ''),
      contentIds: Joi.array().items(Joi.number().integer()).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const id = await CopyrightService.createCopyright(req.body, req.user?.userId);
        const syncData = await CopyrightService.syncCopyrightToModules(id, 'create');
        return created(res, { id, syncData }, '版权创建成功');
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
      contentType: Joi.number().integer().allow(null, ''),
      supplierName: Joi.string().max(255),
      supplierContact: Joi.string().allow(null, ''),
      supplierPhone: Joi.string().allow(null, ''),
      contractNo: Joi.string().allow(null, ''),
      contractFile: Joi.string().allow(null, ''),
      authorizationFile: Joi.string().allow(null, ''),
      copyrightCertificate: Joi.string().allow(null, ''),
      authorizationAgreement: Joi.string().allow(null, ''),
      ownershipProof: Joi.string().allow(null, ''),
      startDate: Joi.date(),
      endDate: Joi.date(),
      territories: Joi.string().allow(null, ''),
      licenseScope: Joi.array().allow(null, ''),
      licenseFee: Joi.number(),
      currency: Joi.string().allow(null, ''),
      paymentStatus: Joi.number().integer(),
      ownershipStatus: Joi.number().integer(),
      description: Joi.string().allow(null, ''),
      attachments: Joi.array().allow(null, ''),
      qualificationFiles: Joi.array().allow(null, ''),
      status: Joi.number().integer(),
      remark: Joi.string().allow(null, ''),
      contentIds: Joi.array().items(Joi.number().integer()).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        await CopyrightService.updateCopyright(id, req.body, req.user?.userId);
        const syncData = await CopyrightService.syncCopyrightToModules(id, 'update');
        return success(res, { syncData }, '版权更新成功');
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

  batchImport = [
    validate(Joi.object({
      rows: Joi.array().items(Joi.object()).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightService.batchImport(req.body.rows, req.user?.userId);
        return success(res, result, '批量导入完成');
      } catch (error) {
        next(error);
      }
    }
  ];

  batchRenew = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).required(),
      extendMonths: Joi.number().integer().min(1).allow(null, ''),
      extendEndDate: Joi.date().allow(null, ''),
      renewalReason: Joi.string().allow(null, ''),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightService.batchRenew(req.body, req.user?.userId);
        return success(res, result, '批量续期完成');
      } catch (error) {
        next(error);
      }
    }
  ];

  batchInvalid = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).required(),
      invalidReason: Joi.string().required(),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightService.batchInvalid(req.body, req.user?.userId);
        return success(res, result, '批量标记失效完成');
      } catch (error) {
        next(error);
      }
    }
  ];

  traceCopyright = [
    validate(paginationSchema.keys({
      code: Joi.string().allow(null, ''),
      contentId: Joi.number().integer().allow(null, ''),
      supplierName: Joi.string().allow(null, ''),
      contentType: Joi.number().integer().allow(null, ''),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await CopyrightService.traceCopyright(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  syncToModules = [
    validate(Joi.object({
      action: Joi.string().valid('create', 'update', 'expire', 'renew', 'invalid').required(),
    })),
    async (req, res, next) => {
      try {
        const result = await CopyrightService.syncCopyrightToModules(
          parseInt(req.params.id),
          req.body.action
        );
        return success(res, result, '同步完成');
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new CopyrightController();
