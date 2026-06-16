const BaseService = require('./BaseService');
const Approval = require('../models/Approval');
const User = require('../models/User');
const { ValidationError } = require('../utils/error');

class ApprovalService extends BaseService {
  constructor() {
    super(Approval);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['title'],
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'username', 'nickname'] },
        { model: User, as: 'approver', attributes: ['id', 'username', 'nickname'] }
      ]
    });
  }

  async getById(id) {
    return super.getById(id, {
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'username', 'nickname'] },
        { model: User, as: 'approver', attributes: ['id', 'username', 'nickname'] }
      ]
    });
  }

  async create(data) {
    return await Approval.create(data);
  }

  async approve(id, data) {
    const approval = await this.getById(id);
    if (approval.status !== 0) {
      throw new ValidationError('该审批已处理，无法重复操作');
    }
    return await approval.update({
      status: 1,
      approverId: data.approverId,
      approverName: data.approverName,
      approveRemark: data.approveRemark,
      approveTime: new Date()
    });
  }

  async reject(id, data) {
    const approval = await this.getById(id);
    if (approval.status !== 0) {
      throw new ValidationError('该审批已处理，无法重复操作');
    }
    return await approval.update({
      status: 2,
      approverId: data.approverId,
      approverName: data.approverName,
      approveRemark: data.approveRemark,
      approveTime: new Date()
    });
  }

  async getPendingList(params = {}) {
    return super.getList({ ...params, status: 0 }, {
      searchFields: ['title'],
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'username', 'nickname'] },
        { model: User, as: 'approver', attributes: ['id', 'username', 'nickname'] }
      ]
    });
  }
}

module.exports = new ApprovalService();
