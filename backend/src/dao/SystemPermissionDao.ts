import { BaseDao } from './BaseDao';
import { SystemPermission } from '../models/SystemPermission';

export class SystemPermissionDao extends BaseDao<SystemPermission> {
  constructor() {
    super(SystemPermission);
  }
}

export default SystemPermissionDao;
