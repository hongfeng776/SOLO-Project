import { BaseDao } from './BaseDao';
import { ArticleReviewLog } from '../models/ArticleReviewLog';

export class ArticleReviewLogDao extends BaseDao<ArticleReviewLog> {
  constructor() {
    super(ArticleReviewLog);
  }
}

export default ArticleReviewLogDao;
