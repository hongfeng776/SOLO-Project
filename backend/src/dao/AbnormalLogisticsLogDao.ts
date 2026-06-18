import { BaseDao } from './BaseDao';
import { AbnormalLogisticsLog } from '../models/AbnormalLogisticsLog';

export class AbnormalLogisticsLogDao extends BaseDao<AbnormalLogisticsLog> {
  constructor() {
    super(AbnormalLogisticsLog);
  }
}

export default AbnormalLogisticsLogDao;
