const Order = require('../models/Order');
const { ForbiddenError, ValidationError, NotFoundError } = require('../utils/error');

const EDITABLE_STATUSES = [0, 1];
const NON_EDITABLE_STATUSES = [3, 4, 5, 6];

const checkOrderEditPermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      throw new ForbiddenError('未登录，无操作权限');
    }

    const roleCode = user.roleCode;

    const order = await Order.findByPk(id);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (roleCode !== 'admin' && order.source === 'third_party') {
      throw new ForbiddenError('第三方来源订单仅管理员可编辑');
    }

    if (NON_EDITABLE_STATUSES.includes(order.status) || order.archiveStatus === 1) {
      throw new ForbiddenError('当前订单状态不可编辑');
    }

    if (roleCode === 'operator' && order.isAbnormal === 1) {
      throw new ForbiddenError('异常订单仅风控人员或管理员可操作');
    }

    if (roleCode === 'risk_operator' && order.isAbnormal !== 1) {
      throw new ForbiddenError('风控人员仅可操作异常订单');
    }

    req.order = order;
    next();
  } catch (error) {
    next(error);
  }
};

const checkOrderStatusPermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      throw new ForbiddenError('未登录，无操作权限');
    }

    const order = await Order.findByPk(id);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (req.path.includes('/reset')) {
      if (![0, 1].includes(order.status)) {
        throw new ForbiddenError('仅未履约订单可执行状态重置');
      }
      if (order.isLocked === 1) {
        throw new ForbiddenError('订单已锁定，无法重置状态');
      }
    }

    if ([3, 4].includes(order.status) && req.path.includes('/reset')) {
      throw new ForbiddenError('已履约订单仅可查看，不可重置');
    }

    req.order = order;
    next();
  } catch (error) {
    next(error);
  }
};

const checkBatchOperationPermission = async (req, res, next) => {
  try {
    const user = req.user;
    const { ids } = req.body;

    if (!user) {
      throw new ForbiddenError('未登录，无操作权限');
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的订单');
    }

    const roleCode = user.roleCode;
    const path = req.path;

    if (path.includes('/batch/confirm')) {
      if (!['admin', 'operator'].includes(roleCode)) {
        throw new ForbiddenError('仅管理员和运营人员可批量确认履约');
      }
    } else if (path.includes('/batch/abnormal')) {
      if (!['admin', 'risk_operator'].includes(roleCode)) {
        throw new ForbiddenError('仅管理员和风控人员可批量标记异常');
      }
    } else if (path.includes('/batch/archive')) {
      if (roleCode !== 'admin') {
        throw new ForbiddenError('仅管理员可批量归档');
      }
    }

    req.batchIds = ids;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkOrderEditPermission,
  checkOrderStatusPermission,
  checkBatchOperationPermission
};
