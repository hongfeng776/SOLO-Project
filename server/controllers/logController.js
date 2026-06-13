const { Op } = require('sequelize');
const OperationLog = require('../models/OperationLog');
const { success } = require('../utils/response');
const { ErrorCode, ErrorMessage } = require('../constants/errorCode');

async function getLogList(req, res, next) {
  try {
    const {
      page = 1,
      pageSize = 20,
      username,
      module,
      operation,
      status,
      startTime,
      endTime
    } = req.query;

    const where = {};

    if (username) {
      where.username = { [Op.like]: `%${username}%` };
    }
    if (module) {
      where.module = module;
    }
    if (operation) {
      where.operation = operation;
    }
    if (status !== undefined && status !== '') {
      where.status = Number(status);
    }
    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) {
        where.created_at[Op.gte] = new Date(startTime);
      }
      if (endTime) {
        where.created_at[Op.lte] = new Date(endTime);
      }
    }

    const { count, rows } = await OperationLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });

    res.json(success({
      list: rows,
      total: count,
      page: Number(page),
      pageSize: Number(pageSize)
    }));
  } catch (err) {
    next(err);
  }
}

async function getLogDetail(req, res, next) {
  try {
    const { id } = req.params;
    const log = await OperationLog.findByPk(id);
    if (!log) {
      return res.status(404).json({
        code: ErrorCode.DATA_NOT_EXIST,
        message: ErrorMessage[ErrorCode.DATA_NOT_EXIST],
        data: null
      });
    }
    res.json(success(log));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLogList,
  getLogDetail
};
