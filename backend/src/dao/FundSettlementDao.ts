import { BaseDao } from './BaseDao';
import { FundSettlement } from '../models/FundSettlement';

export class FundSettlementDao extends BaseDao<FundSettlement> {
  constructor() {
    super(FundSettlement);
  }
}

export default FundSettlementDao;
