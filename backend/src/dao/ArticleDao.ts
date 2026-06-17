import { BaseDao } from './BaseDao';
import { Article } from '../models/Article';

export class ArticleDao extends BaseDao<Article> {
  constructor() {
    super(Article);
  }
}

export default ArticleDao;
