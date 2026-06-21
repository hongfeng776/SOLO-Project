import { Op } from 'sequelize';
import MessageTemplate from '../models/message-template.model';
import { BaseDao, IPaginationResult, IPaginationParams } from './base.dao';

class MessageTemplateDao extends BaseDao<MessageTemplate> {
  constructor() {
    super(MessageTemplate);
  }

  async findByCode(templateCode: string): Promise<MessageTemplate | null> {
    return this.findOne({ where: { templateCode } });
  }

  async getList(params: IPaginationParams): Promise<IPaginationResult<MessageTemplate>> {
    const {
      page = 1,
      pageSize = 10,
      templateName,
      templateCode,
      scene,
      templateStatus,
      notificationType,
      pushChannel,
      recipientType,
      isComplianceChecked,
      weightMin,
      weightMax,
    } = params;
    const where: any = {};

    if (templateName) {
      where.templateName = { [Op.like]: `%${templateName}%` };
    }
    if (templateCode) {
      where.templateCode = { [Op.like]: `%${templateCode}%` };
    }
    if (scene) {
      where.scene = scene;
    }
    if (templateStatus) {
      where.templateStatus = templateStatus;
    }
    if (notificationType) {
      where.notificationType = notificationType;
    }
    if (pushChannel) {
      where.pushChannel = pushChannel;
    }
    if (recipientType) {
      where.recipientType = recipientType;
    }
    if (isComplianceChecked !== undefined && isComplianceChecked !== '') {
      where.isComplianceChecked = isComplianceChecked === 'true' || isComplianceChecked === true;
    }
    if (weightMin !== undefined && weightMin !== '') {
      where.weight = { ...where.weight, [Op.gte]: Number(weightMin) };
    }
    if (weightMax !== undefined && weightMax !== '') {
      where.weight = { ...where.weight, [Op.lte]: Number(weightMax) };
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [
        ['weight', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    return {
      list: rows,
      total: count,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async getByIds(ids: number[]): Promise<MessageTemplate[]> {
    return this.findAll({ where: { id: { [Op.in]: ids } }, order: [['id', 'DESC']] });
  }

  async getBySceneAndStatus(scene: string, status: string): Promise<MessageTemplate[]> {
    return this.findAll({
      where: { scene, templateStatus: status },
      order: [['weight', 'DESC']],
    });
  }

  async batchUpdateStatus(ids: number[], templateStatus: string, data: any): Promise<[number, MessageTemplate[]]> {
    return this.model.update(data, {
      where: { id: { [Op.in]: ids } },
      returning: true,
    });
  }

  async batchUpdateWeight(ids: number[], weight: number): Promise<[number, MessageTemplate[]]> {
    return this.model.update(
      { weight },
      {
        where: { id: { [Op.in]: ids } },
        returning: true,
      }
    );
  }

  async batchUpdateContentFormat(ids: number[], data: any): Promise<[number, MessageTemplate[]]> {
    return this.model.update(data, {
      where: { id: { [Op.in]: ids } },
      returning: true,
    });
  }

  async checkDuplicateCode(id: number | null, templateCode: string): Promise<boolean> {
    const where: any = { templateCode };
    if (id) {
      where.id = { [Op.ne]: id };
    }
    const count = await this.count({ where });
    return count > 0;
  }
}

export default new MessageTemplateDao();
