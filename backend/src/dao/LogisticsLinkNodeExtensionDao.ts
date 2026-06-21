import { BaseDao } from './BaseDao';
import { LogisticsLinkNodeExtension } from '../models/LogisticsLinkNodeExtension';

export class LogisticsLinkNodeExtensionDao extends BaseDao<LogisticsLinkNodeExtension> {
  constructor() {
    super(LogisticsLinkNodeExtension);
  }
}

export default LogisticsLinkNodeExtensionDao;
