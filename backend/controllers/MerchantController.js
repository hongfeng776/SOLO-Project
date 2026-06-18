const BaseController = require('./BaseController');
const merchantService = require('../services/MerchantService');
const merchantAuditService = require('../services/MerchantAuditService');
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
}

module.exports = new MerchantController();
