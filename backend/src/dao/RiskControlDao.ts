import { BaseDao } from './BaseDao';
import { RiskControl } from '../models/RiskControl';

export class RiskControlDao extends BaseDao<RiskControl> {
  constructor() {
    super(RiskControl);
  }
}

export default RiskControlDao;
