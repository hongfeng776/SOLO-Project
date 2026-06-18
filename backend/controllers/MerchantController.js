const BaseController = require('./BaseController');
const merchantService = require('../services/MerchantService');
const merchantAuditService = require('../services/MerchantAuditService');
const merchantOpsService = require('../services/MerchantOpsService');
const approvalService = require('../services/ApprovalService');
const Merchant = require('../models/Merchant');
const Order = require('../models/Order');
const User = require('../models/User');
const { success, pagination } = require('../utils/result');
const { NotFoundError, ValidationError } = require('../utils/error');

class MerchantController extends BaseController {
  constructor() {
    super(merchantService);
  }

  async auditMerchant(req, res, next) {
    try {
      const { id } = req.params;
      const { auditStatus, approveRemark } = req.body;
      const merchant = await Merchant.findByPk(id);
      if (!merchant) throw new NotFoundError('商家不存在');
      await merchant.update({ auditStatus });
      await approvalService.create({
        type: 'merchant',
        businessId: merchant.id,
        title: `商家审核: ${merchant.name}`,
        applicantId: null,
        applicantName: merchant.contact || '',
        status: auditStatus === 1 ? 1 : (auditStatus === 2 ? 2 : 0),
        approverId: req.user?.id,
        approverName: req.user?.nickname || req.user?.username || '',
        approveRemark: approveRemark || '',
        approveTime: new Date()
      });
      res.json(success(merchant, '审核完成'));
    } catch (error) {
      next(error);
    }
  }

  async getMerchantOrders(req, res, next) {
    try {
      const { id } = req.params;
      const { pageNum = 1, pageSize = 10 } = req.query;
      const { count, rows } = await Order.findAndCountAll({
        where: { merchantId: id },
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname'] }],
        offset: (pageNum - 1) * pageSize,
        limit: parseInt(pageSize),
        order: [['id', 'DESC']]
      });
      res.json(pagination(rows, count, pageNum, pageSize));
    } catch (error) {
      next(error);
    }
  }

  async updateViolation(req, res, next) {
    try {
      const { id } = req.params;
      const { violationLevel, description } = req.body;
      const merchant = await Merchant.findByPk(id);
      if (!merchant) throw new NotFoundError('商家不存在');
      const updateData = {
        violationLevel,
        violationCount: merchant.violationCount + 1,
        lastViolationTime: new Date()
      };
      if (violationLevel >= 3) {
        updateData.status = 0;
      }
      await merchant.update(updateData);
      res.json(success(merchant, '违规等级更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async getAuditDetail(req, res, next) {
    try {
      const { id } = req.params;
      const result = await merchantAuditService.getAuditDetail(id);
      res.json(success(result, '查询成功'));
    } catch (error) {
      next(error);
    }
  }

  async preAuditCheck(req, res, next) {
    try {
      const { id } = req.params;
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const result = await merchantAuditService.preAuditCheck(id, operator);
      res.json(success(result, '前置校验完成'));
    } catch (error) {
      next(error);
    }
  }

  async submitAuditPass(req, res, next) {
    try {
      const { id } = req.params;
      const { qualificationResults = {}, remark = '' } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const result = await merchantAuditService.submitAudit(id, operator, {
        qualificationResults, remark, type: 'pass'
      });
      res.json(success(result, result.merchant.auditStatus === 1 ? '终审通过，商家入驻成功' : '初审通过，已进入终审流程'));
    } catch (error) {
      next(error);
    }
  }

  async submitAuditReject(req, res, next) {
    try {
      const { id } = req.params;
      const { qualificationResults = {}, remark = '' } = req.body;
      if (!remark || remark.trim().length === 0) {
        throw new ValidationError('驳回原因不能为空');
      }
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const result = await merchantAuditService.submitAudit(id, operator, {
        qualificationResults, remark, type: 'reject'
      });
      res.json(success(result, '审核驳回成功，入驻流程已锁定'));
    } catch (error) {
      next(error);
    }
  }

  async submitAuditTemporary(req, res, next) {
    try {
      const { id } = req.params;
      const { qualificationResults = {}, remark = '' } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const result = await merchantAuditService.submitAudit(id, operator, {
        qualificationResults, remark, type: 'temporary'
      });
      res.json(success(result, '已暂存审核'));
    } catch (error) {
      next(error);
    }
  }

  async batchAuditPass(req, res, next) {
    try {
      const { ids = [], remark = '', qualificationResultsMap = {} } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const result = await merchantAuditService.batchAudit(operator, {
        ids, type: 'pass', remark, qualificationResultsMap
      });
      res.json(success(result, `批量审核通过完成：成功${result.successCount}条，失败${result.failCount}条`));
    } catch (error) {
      next(error);
    }
  }

  async batchAuditReject(req, res, next) {
    try {
      const { ids = [], remark = '', qualificationResultsMap = {} } = req.body;
      if (!remark || remark.trim().length === 0) {
        throw new ValidationError('批量驳回原因不能为空');
      }
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const result = await merchantAuditService.batchAudit(operator, {
        ids, type: 'reject', remark, qualificationResultsMap
      });
      res.json(success(result, `批量驳回完成：成功${result.successCount}条，失败${result.failCount}条`));
    } catch (error) {
      next(error);
    }
  }

  async batchAuditTemporary(req, res, next) {
    try {
      const { ids = [], remark = '', qualificationResultsMap = {} } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const result = await merchantAuditService.batchAudit(operator, {
        ids, type: 'temporary', remark, qualificationResultsMap
      });
      res.json(success(result, `批量暂存完成：成功${result.successCount}条，失败${result.failCount}条`));
    } catch (error) {
      next(error);
    }
  }

  async checkExpiredAudits(req, res, next) {
    try {
      const result = await merchantAuditService.checkAndResetExpiredAudits();
      res.json(success(result, `审核过期检查完成，重置${result.resetCount}条记录`));
    } catch (error) {
      next(error);
    }
  }

  async getAuditTrace(req, res, next) {
    try {
      const { id } = req.params;
      const { pageNum = 1, pageSize = 20 } = req.query;
      const result = await merchantAuditService.getAuditTrace(id, { pageNum: parseInt(pageNum), pageSize: parseInt(pageSize) });
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async getPendingAuditList(req, res, next) {
    try {
      const { pageNum = 1, pageSize = 10 } = req.pagination;
      const result = await merchantAuditService.getPendingAuditList({
        ...req.query,
        pageNum: parseInt(pageNum),
        pageSize: parseInt(pageSize)
      });
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async getAuditStats(req, res, next) {
    try {
      const result = await merchantService.getStats();
      res.json(success(result, '统计查询成功'));
    } catch (error) {
      next(error);
    }
  }

  async saveQualifications(req, res, next) {
    try {
      const { id } = req.params;
      const { qualifications = [] } = req.body;
      await merchantService.saveQualifications(id, qualifications);
      res.json(success(null, '资质材料保存成功'));
    } catch (error) {
      next(error);
    }
  }

  async getQualifications(req, res, next) {
    try {
      const { id } = req.params;
      const result = await merchantService.getQualifications(id);
      res.json(success(result, '查询成功'));
    } catch (error) {
      next(error);
    }
  }

  async getOpsDetail(req, res, next) {
    try {
      const { id } = req.params;
      const result = await merchantService.getDetail(id);
      res.json(success(result, '查询成功'));
    } catch (error) {
      next(error);
    }
  }

  async preOpsCheck(req, res, next) {
    try {
      const { id } = req.params;
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const merchant = await Merchant.findByPk(id);
      if (!merchant) throw new NotFoundError('商家不存在');
      const permissions = {
        canEditBasic: ['admin', 'merchant_operator', 'senior_operator'].includes(operator.role),
        canEditBusiness: ['admin', 'senior_operator'].includes(operator.role),
        canEditContact: ['admin', 'merchant_operator', 'senior_operator'].includes(operator.role),
        canEditSettlement: ['admin', 'finance_operator', 'senior_operator'].includes(operator.role),
        canEditStatus: ['admin', 'senior_operator'].includes(operator.role),
        canBatch: ['admin', 'senior_operator'].includes(operator.role),
        canEditHighRisk: operator.role === 'admin'
      };
      const statusEditable = merchant.operationStatus !== 3;
      const isLocked = merchant.operationStatus === 2 || merchant.settleStatus === 5;
      res.json(success({
        merchant: merchant.toJSON(),
        permissions,
        statusEditable,
        isLocked,
        isHighRisk: merchant.merchantCategory === 2
      }, '前置校验完成'));
    } catch (error) {
      next(error);
    }
  }

  async updateBasicInfo(req, res, next) {
    try {
      const { id } = req.params;
      const { fields, reason = '', remark = '' } = req.body;
      if (!fields || Object.keys(fields).length === 0) {
        throw new ValidationError('请填写要修改的信息');
      }
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const result = await merchantOpsService.updateMerchantInfo(id, 'BASIC', fields, operator, ip, reason, remark);
      res.json(success(result, '基础工商信息更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async updateBusinessInfo(req, res, next) {
    try {
      const { id } = req.params;
      const { fields, reason = '', remark = '' } = req.body;
      if (!fields || Object.keys(fields).length === 0) {
        throw new ValidationError('请填写要修改的信息');
      }
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const result = await merchantOpsService.updateMerchantInfo(id, 'BUSINESS', fields, operator, ip, reason, remark);
      res.json(success(result, '经营品类信息更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async updateContactInfo(req, res, next) {
    try {
      const { id } = req.params;
      const { fields, reason = '', remark = '' } = req.body;
      if (!fields || Object.keys(fields).length === 0) {
        throw new ValidationError('请填写要修改的信息');
      }
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const result = await merchantOpsService.updateMerchantInfo(id, 'CONTACT', fields, operator, ip, reason, remark);
      res.json(success(result, '联系方式更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async updateSettlementInfo(req, res, next) {
    try {
      const { id } = req.params;
      const { fields, reason = '', remark = '' } = req.body;
      if (!fields || Object.keys(fields).length === 0) {
        throw new ValidationError('请填写要修改的信息');
      }
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const result = await merchantOpsService.updateMerchantInfo(id, 'SETTLEMENT', fields, operator, ip, reason, remark);
      res.json(success(result, '结算信息更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async updateBusinessStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason = '' } = req.body;
      if (status === undefined) throw new ValidationError('请选择经营状态');
      if ((status === 2 || status === 3) && !reason) {
        throw new ValidationError('请填写状态变更原因');
      }
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const result = await merchantOpsService.updateBusinessStatus(id, status, reason, operator, ip);
      res.json(success(result, '经营状态更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async updateOperationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason = '', unlockTime } = req.body;
      if (status === undefined) throw new ValidationError('请选择运营状态');
      if ((status === 2 || status === 3) && !reason) {
        throw new ValidationError('请填写锁定原因');
      }
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const result = await merchantOpsService.updateOperationStatus(id, status, reason, unlockTime, operator, ip);
      res.json(success(result, '运营状态更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchUpdateTags(req, res, next) {
    try {
      const { ids = [], tags = [] } = req.body;
      if (ids.length === 0) throw new ValidationError('请选择要操作的商家');
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const result = await merchantOpsService.batchUpdateTags(ids, tags, operator, ip);
      res.json(success(result, `批量更新标签完成：成功${result.success}条，失败${result.failed}条，跳过${result.skipped}条`));
    } catch (error) {
      next(error);
    }
  }

  async batchUpdateNotice(req, res, next) {
    try {
      const { ids = [], notice = '' } = req.body;
      if (ids.length === 0) throw new ValidationError('请选择要操作的商家');
      if (!notice || notice.trim().length === 0) {
        throw new ValidationError('请填写公示信息');
      }
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const result = await merchantOpsService.batchUpdateNotice(ids, notice, operator, ip);
      res.json(success(result, `批量修正公示信息完成：成功${result.success}条，失败${result.failed}条`));
    } catch (error) {
      next(error);
    }
  }

  async batchLockAccounts(req, res, next) {
    try {
      const { ids = [], reason = '' } = req.body;
      if (ids.length === 0) throw new ValidationError('请选择要操作的商家');
      if (!reason || reason.trim().length === 0) {
        throw new ValidationError('请填写锁定原因');
      }
      const operator = {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
      };
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const result = await merchantOpsService.batchLockAccounts(ids, reason, operator, ip);
      res.json(success(result, `批量锁定账号完成：成功${result.success}条，失败${result.failed}条，跳过${result.skipped}条`));
    } catch (error) {
      next(error);
    }
  }

  async getChangeLogs(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 20, changeType, startDate, endDate, operatorId, riskLevel } = req.query;
      const result = await merchantOpsService.getChangeLogs(id, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        changeType: changeType ? parseInt(changeType) : undefined,
        startDate,
        endDate,
        operatorId: operatorId ? parseInt(operatorId) : undefined,
        riskLevel: riskLevel !== undefined ? parseInt(riskLevel) : undefined
      });
      res.json(pagination(result.list, result.total, result.page, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async getCompleteTrace(req, res, next) {
    try {
      const { id } = req.params;
      const result = await merchantOpsService.getCompleteTrace(id);
      res.json(success(result, '查询成功'));
    } catch (error) {
      next(error);
    }
  }

  async getOpsStats(req, res, next) {
    try {
      const { businessType, merchantLevel, operationStatus } = req.query;
      const result = await merchantOpsService.getOpsStats({
        businessType,
        merchantLevel: merchantLevel ? parseInt(merchantLevel) : undefined,
        operationStatus: operationStatus !== undefined ? parseInt(operationStatus) : undefined
      });
      res.json(success(result, '统计查询成功'));
    } catch (error) {
      next(error);
    }
  }

  async getOpsMerchantList(req, res, next) {
    try {
      const { pageNum = 1, pageSize = 10 } = req.pagination;
      const result = await merchantService.getList({
        ...req.query,
        pageNum: parseInt(pageNum),
        pageSize: parseInt(pageSize)
      });
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async verifyFieldUnique(req, res, next) {
    try {
      const { fieldName, value, excludeId } = req.query;
      if (!fieldName || !value) throw new ValidationError('请填写校验字段和值');
      await merchantOpsService.validateFieldUniqueness(fieldName, value, excludeId ? parseInt(excludeId) : null);
      res.json(success({ unique: true }, '校验通过，该值可用'));
    } catch (error) {
      res.json(success({ unique: false, message: error.message }, '校验完成'));
    }
  }
}

module.exports = new MerchantController();
