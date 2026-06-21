import { BaseDao } from './BaseDao';
import { UserPermissionLog } from '../models/UserPermissionLog';

export class UserPermissionLogDao extends BaseDao<UserPermissionLog> {
  constructor() {
    super(UserPermissionLog);
  }
}

export default UserPermissionLogDao;
