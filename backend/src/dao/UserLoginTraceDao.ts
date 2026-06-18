import { BaseDao } from './BaseDao';
import { UserLoginTrace } from '../models/UserLoginTrace';

export class UserLoginTraceDao extends BaseDao<UserLoginTrace> {
  constructor() {
    super(UserLoginTrace);
  }
}

export default UserLoginTraceDao;
