const BaseController = require('./BaseController');
const approvalService = require('../services/ApprovalService');
const { success } = require('../utils/result');

class ApprovalController extends BaseController {
  constructor() {
    super(approvalService);
  }

  async approve(req, res, next) {
    try {
      const { id } = req.params;
      const result = await approvalService.approve(id, {
        approverId: req.user?.id,
        approverName: req.user?.nickname || req.user?.username || '',
        approveRemark: req.body.approveRemark
      });
      res.json(success(result, '审批通过'));
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const { id } = req.params;
      const result = await approvalService.reject(id, {
        approverId: req.user?.id,
        approverName: req.user?.nickname || req.user?.username || '',
        approveRemark: req.body.approveRemark
      });
      res.json(success(result, '审批已拒绝'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApprovalController();
