import { BaseDao } from './base.dao';
import RecruitmentChannelModel from '../models/recruitment-channel.model';

class RecruitmentChannelDao extends BaseDao<RecruitmentChannelModel> {
  constructor() {
    super(RecruitmentChannelModel);
  }

  async findByCode(code: string) {
    return this.findOne({ where: { code } });
  }
}

export default new RecruitmentChannelDao();
