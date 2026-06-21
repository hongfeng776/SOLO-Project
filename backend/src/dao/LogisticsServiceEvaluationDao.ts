import { BaseDao } from './BaseDao';
import { LogisticsServiceEvaluation } from '../models/LogisticsServiceEvaluation';

export class LogisticsServiceEvaluationDao extends BaseDao<LogisticsServiceEvaluation> {
  constructor() {
    super(LogisticsServiceEvaluation);
  }
}

export default LogisticsServiceEvaluationDao;
