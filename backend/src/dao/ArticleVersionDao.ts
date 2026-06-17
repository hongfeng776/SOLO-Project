import { BaseDao } from './BaseDao';
import { ArticleVersion } from '../models/ArticleVersion';

export class ArticleVersionDao extends BaseDao<ArticleVersion> {
  constructor() {
    super(ArticleVersion);
  }
}

export default ArticleVersionDao;
