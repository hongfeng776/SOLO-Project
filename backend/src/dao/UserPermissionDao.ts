import { BaseDao } from './BaseDao';
import { UserPermission } from '../models/UserPermission';

export class UserPermissionDao extends BaseDao<UserPermission> {
  constructor() {
    super(UserPermission);
  }
}

export default UserPermissionDao;
