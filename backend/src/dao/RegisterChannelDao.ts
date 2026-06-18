import { BaseDao } from './BaseDao';
import { RegisterChannel } from '../models/RegisterChannel';

export class RegisterChannelDao extends BaseDao<RegisterChannel> {
  constructor() {
    super(RegisterChannel);
  }

  async getActiveChannels(): Promise<RegisterChannel[]> {
    return this.model.findAll({
      where: { status: 1 },
      order: [['id', 'ASC']],
    });
  }

  async findByCode(code: string): Promise<RegisterChannel | null> {
    return this.model.findOne({
      where: { channel_code: code },
    });
  }
}

export default RegisterChannelDao;
