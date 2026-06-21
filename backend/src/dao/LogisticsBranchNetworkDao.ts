import { BaseDao } from './BaseDao';
import { LogisticsBranchNetwork } from '../models/LogisticsBranchNetwork';

export class LogisticsBranchNetworkDao extends BaseDao<LogisticsBranchNetwork> {
  constructor() {
    super(LogisticsBranchNetwork);
  }
}

export default LogisticsBranchNetworkDao;
