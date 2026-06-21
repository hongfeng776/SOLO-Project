import { BaseDao } from './BaseDao';
import { LogisticsSignContract } from '../models/LogisticsSignContract';

export class LogisticsSignContractDao extends BaseDao<LogisticsSignContract> {
  constructor() {
    super(LogisticsSignContract);
  }
}

export default LogisticsSignContractDao;
