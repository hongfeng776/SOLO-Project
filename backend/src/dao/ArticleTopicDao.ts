import { BaseDao } from './BaseDao';
import { ArticleTopic } from '../models/ArticleTopic';

export class ArticleTopicDao extends BaseDao<ArticleTopic> {
  constructor() {
    super(ArticleTopic);
  }
}

export default ArticleTopicDao;
