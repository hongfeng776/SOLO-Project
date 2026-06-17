import { BaseDao } from './BaseDao';
import { SensitiveWord } from '../models/SensitiveWord';

export class SensitiveWordDao extends BaseDao<SensitiveWord> {
  constructor() {
    super(SensitiveWord);
  }
}

export default SensitiveWordDao;
