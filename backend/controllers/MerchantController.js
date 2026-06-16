const BaseController = require('./BaseController');
const merchantService = require('../services/MerchantService');
const approvalService = require('../services/ApprovalService');
const Merchant = require('../models/Merchant');
const Order = require('../models/Order');
const User = require('../models/User');
const { success } = require('../utils/result');
const { NotFoundError } = require('../utils/error');

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
      res.json(success({
        list: rows,
        total: count,
        pageNum: parseInt(pageNum),
        pageSize: parseInt(pageSize)
      }));
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
}

module.exports = new MerchantController();
