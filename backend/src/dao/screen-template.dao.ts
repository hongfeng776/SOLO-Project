import { BaseDao } from './base.dao';
import { ScreenTemplate } from '../models';
import ScreenTemplateModel from '../models/screen-template.model';

class ScreenTemplateDao extends BaseDao<ScreenTemplateModel> {
  constructor() {
    super(ScreenTemplate);
  }

  async findByJobId(jobId: number) {
    return this.findAll({
      where: { jobId },
      order: [['id', 'DESC']],
    });
  }

  async findGlobalTemplates() {
    return this.findAll({
      where: { isGlobal: true },
      order: [['id', 'DESC']],
    });
  }

  async findByCreatorId(creatorId: number) {
    return this.findAll({
      where: { creatorId },
      order: [['id', 'DESC']],
    });
  }

  async incrementUseCount(id: number) {
    return this.model.increment('useCount', { where: { id } });
  }
}

export default new ScreenTemplateDao();
