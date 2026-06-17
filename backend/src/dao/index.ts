import { BaseDao, PageResult, PageOptions } from './BaseDao';
import { AdminDao } from './AdminDao';
import { UserDao } from './UserDao';
import { GoodsDao } from './GoodsDao';
import { GoodsAuditDao } from './GoodsAuditDao';
import { OrderDao } from './OrderDao';
import { OrderItemDao } from './OrderItemDao';
import { OrderLogDao } from './OrderLogDao';
import { MarketingDao } from './MarketingDao';
import { MarketingUserDao } from './MarketingUserDao';
import { AfterSaleDao } from './AfterSaleDao';
import { AfterSaleAuditDao } from './AfterSaleAuditDao';
import { MerchantDao } from './MerchantDao';
import { MerchantAuditDao } from './MerchantAuditDao';
import { RiskControlDao } from './RiskControlDao';
import { RiskAlertDao } from './RiskAlertDao';
import { OperateLogDao } from './OperateLogDao';
import { MessageDao } from './MessageDao';
import { PenaltyDao } from './PenaltyDao';
import { GoodsEditLogDao } from './GoodsEditLogDao';
import { MerchantQualificationDao } from './MerchantQualificationDao';
import { BrandAuthorizationDao } from './BrandAuthorizationDao';
import { CategoryDao } from './CategoryDao';
import { CategoryLogDao } from './CategoryLogDao';
import { CategoryPermissionDao } from './CategoryPermissionDao';
import { ArticleDao } from './ArticleDao';
import { ArticleVersionDao } from './ArticleVersionDao';
import { ArticleTopicDao } from './ArticleTopicDao';
import { SensitiveWordDao } from './SensitiveWordDao';
import { ArticleReviewLogDao } from './ArticleReviewLogDao';
import { GoodsAuditMainDao } from './GoodsAuditMainDao';
import { GoodsAuditItemDao } from './GoodsAuditItemDao';
import { GoodsAuditTimeoutDao } from './GoodsAuditTimeoutDao';
import { GoodsAuditResubmitDao } from './GoodsAuditResubmitDao';

export {
  BaseDao,
  PageResult,
  PageOptions,
  AdminDao,
  UserDao,
  GoodsDao,
  GoodsAuditDao,
  OrderDao,
  OrderItemDao,
  OrderLogDao,
  MarketingDao,
  MarketingUserDao,
  AfterSaleDao,
  AfterSaleAuditDao,
  MerchantDao,
  MerchantAuditDao,
  RiskControlDao,
  RiskAlertDao,
  OperateLogDao,
  MessageDao,
  PenaltyDao,
  GoodsEditLogDao,
  MerchantQualificationDao,
  BrandAuthorizationDao,
  CategoryDao,
  CategoryLogDao,
  CategoryPermissionDao,
  ArticleDao,
  ArticleVersionDao,
  ArticleTopicDao,
  SensitiveWordDao,
  ArticleReviewLogDao,
  GoodsAuditMainDao,
  GoodsAuditItemDao,
  GoodsAuditTimeoutDao,
  GoodsAuditResubmitDao,
};

export const daos = {
  adminDao: new AdminDao(),
  userDao: new UserDao(),
  goodsDao: new GoodsDao(),
  goodsAuditDao: new GoodsAuditDao(),
  orderDao: new OrderDao(),
  orderItemDao: new OrderItemDao(),
  orderLogDao: new OrderLogDao(),
  marketingDao: new MarketingDao(),
  marketingUserDao: new MarketingUserDao(),
  afterSaleDao: new AfterSaleDao(),
  afterSaleAuditDao: new AfterSaleAuditDao(),
  merchantDao: new MerchantDao(),
  merchantAuditDao: new MerchantAuditDao(),
  riskControlDao: new RiskControlDao(),
  riskAlertDao: new RiskAlertDao(),
  operateLogDao: new OperateLogDao(),
  messageDao: new MessageDao(),
  penaltyDao: new PenaltyDao(),
  goodsEditLogDao: new GoodsEditLogDao(),
  merchantQualificationDao: new MerchantQualificationDao(),
  brandAuthorizationDao: new BrandAuthorizationDao(),
  categoryDao: new CategoryDao(),
  categoryLogDao: new CategoryLogDao(),
  categoryPermissionDao: new CategoryPermissionDao(),
  articleDao: new ArticleDao(),
  articleVersionDao: new ArticleVersionDao(),
  articleTopicDao: new ArticleTopicDao(),
  sensitiveWordDao: new SensitiveWordDao(),
  articleReviewLogDao: new ArticleReviewLogDao(),
  goodsAuditMainDao: new GoodsAuditMainDao(),
  goodsAuditItemDao: new GoodsAuditItemDao(),
  goodsAuditTimeoutDao: new GoodsAuditTimeoutDao(),
  goodsAuditResubmitDao: new GoodsAuditResubmitDao(),
};

export default daos;
