import { BaseDao } from './BaseDao';
import { LogisticsLinkWorkOrder } from '../models/LogisticsLinkWorkOrder';

export class LogisticsLinkWorkOrderDao extends BaseDao<LogisticsLinkWorkOrder> {
  constructor() {
    super(LogisticsLinkWorkOrder);
  }
}

export default LogisticsLinkWorkOrderDao;
