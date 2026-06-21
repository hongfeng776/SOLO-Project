import { Op } from 'sequelize';
import MessageTemplateLog from '../models/message-template-log.model';
import { BaseDao, IPaginationResult, IPaginationParams } from './base.dao';

class MessageTemplateLogDao extends BaseDao<MessageTemplateLog> {
  constructor() {
    super(MessageTemplateLog);
  }

  async getList(params: IPaginationParams): Promise<IPaginationResult<MessageTemplateLog>> {
    const {
      page = 1,
      pageSize = 10,
      templateId,
      templateName,
      action,
      operatorName,
      startDate,
      endDate,
    } = params;
    const where: any = {};

    if (templateId) {
      where.templateId = templateId;
    }
    if (templateName) {
      where.templateName = { [Op.like]: `%${templateName}%` };
    }
    if (action) {
      where.action = action;
    }
    if (operatorName) {
      where.operatorName = { [Op.like]: `%${operatorName}%` };
    }
    if (startDate) {
      where.created_at = { ...where.created_at, [Op.gte]: startDate };
    }
    if (endDate) {
      where.created_at = { ...where.created_at, [Op.lte]: `${endDate} 23:59:59` };
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });

    return {
      list: rows,
      total: count,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async getByTemplateId(templateId: number, page = 1, pageSize = 20): Promise<IPaginationResult<MessageTemplateLog>> {
    return this.getList({ templateId, page, pageSize });
  }

  async createLog(data: any): Promise<MessageTemplateLog> {
    return this.create(data);
  }
}

export default new MessageTemplateLogDao();
