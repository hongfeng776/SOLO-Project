import { BaseDao } from './BaseDao';
import { UserRegisterLog } from '../models/UserRegisterLog';

export class UserRegisterLogDao extends BaseDao<UserRegisterLog> {
  constructor() {
    super(UserRegisterLog);
  }
}

export default UserRegisterLogDao;
