import { BaseDao, PageResult, PageOptions } from './BaseDao';
import { AdminDao } from './AdminDao';
import { UserDao } from './UserDao';
import { UserProfileDao } from './UserProfileDao';
import { UserLoginTraceDao } from './UserLoginTraceDao';
import { UserConsumptionLedgerDao } from './UserConsumptionLedgerDao';
import { UserRegisterLogDao } from './UserRegisterLogDao';
import { UserStatisticDao } from './UserStatisticDao';
import { RegisterChannelDao } from './RegisterChannelDao';
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
import { OrderExceptionDao } from './OrderExceptionDao';
import { PaymentFlowDao } from './PaymentFlowDao';
import { GoodsSnapshotDao } from './GoodsSnapshotDao';
import { MerchantOrderRecordDao } from './MerchantOrderRecordDao';
import { PaymentReconcileDao } from './PaymentReconcileDao';
import { FundSettlementDao } from './FundSettlementDao';
import { LogisticsProviderDao } from './LogisticsProviderDao';
import { LogisticsProviderQualificationDao } from './LogisticsProviderQualificationDao';
import { LogisticsBranchNetworkDao } from './LogisticsBranchNetworkDao';
import { LogisticsFeeStandardDao } from './LogisticsFeeStandardDao';
import { LogisticsSignContractDao } from './LogisticsSignContractDao';
import { LogisticsFeeChangeLogDao } from './LogisticsFeeChangeLogDao';
import { LogisticsServiceEvaluationDao } from './LogisticsServiceEvaluationDao';
import { LogisticsProviderOperationLogDao } from './LogisticsProviderOperationLogDao';
import { ShipmentRecordDao } from './ShipmentRecordDao';
import { LogisticsTrackDao } from './LogisticsTrackDao';
import { AbnormalLogisticsLogDao } from './AbnormalLogisticsLogDao';
import { AfterSaleLedgerDao } from './AfterSaleLedgerDao';
import { AfterSaleOperationLogDao } from './AfterSaleOperationLogDao';
import { SystemPermissionDao } from './SystemPermissionDao';
import { UserPermissionDao } from './UserPermissionDao';
import { UserPermissionLogDao } from './UserPermissionLogDao';
import { AdminUserScopeDao } from './AdminUserScopeDao';

export {
  BaseDao,
  PageResult,
  PageOptions,
  AdminDao,
  UserDao,
  UserProfileDao,
  UserLoginTraceDao,
  UserConsumptionLedgerDao,
  UserRegisterLogDao,
  UserStatisticDao,
  RegisterChannelDao,
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
  OrderExceptionDao,
  PaymentFlowDao,
  GoodsSnapshotDao,
  MerchantOrderRecordDao,
  PaymentReconcileDao,
  FundSettlementDao,
  LogisticsProviderDao,
  LogisticsProviderQualificationDao,
  LogisticsBranchNetworkDao,
  LogisticsFeeStandardDao,
  LogisticsSignContractDao,
  LogisticsFeeChangeLogDao,
  LogisticsServiceEvaluationDao,
  LogisticsProviderOperationLogDao,
  ShipmentRecordDao,
  LogisticsTrackDao,
  AbnormalLogisticsLogDao,
  AfterSaleLedgerDao,
  AfterSaleOperationLogDao,
  SystemPermissionDao,
  UserPermissionDao,
  UserPermissionLogDao,
  AdminUserScopeDao,
};

export const daos = {
  adminDao: new AdminDao(),
  userDao: new UserDao(),
  userProfileDao: new UserProfileDao(),
  userLoginTraceDao: new UserLoginTraceDao(),
  userConsumptionLedgerDao: new UserConsumptionLedgerDao(),
  userRegisterLogDao: new UserRegisterLogDao(),
  userStatisticDao: new UserStatisticDao(),
  registerChannelDao: new RegisterChannelDao(),
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
  orderExceptionDao: new OrderExceptionDao(),
  paymentFlowDao: new PaymentFlowDao(),
  goodsSnapshotDao: new GoodsSnapshotDao(),
  merchantOrderRecordDao: new MerchantOrderRecordDao(),
  paymentReconcileDao: new PaymentReconcileDao(),
  fundSettlementDao: new FundSettlementDao(),
  logisticsProviderDao: new LogisticsProviderDao(),
  logisticsProviderQualificationDao: new LogisticsProviderQualificationDao(),
  logisticsBranchNetworkDao: new LogisticsBranchNetworkDao(),
  logisticsFeeStandardDao: new LogisticsFeeStandardDao(),
  logisticsSignContractDao: new LogisticsSignContractDao(),
  logisticsFeeChangeLogDao: new LogisticsFeeChangeLogDao(),
  logisticsServiceEvaluationDao: new LogisticsServiceEvaluationDao(),
  logisticsProviderOperationLogDao: new LogisticsProviderOperationLogDao(),
  shipmentRecordDao: new ShipmentRecordDao(),
  logisticsTrackDao: new LogisticsTrackDao(),
  abnormalLogisticsLogDao: new AbnormalLogisticsLogDao(),
  afterSaleLedgerDao: new AfterSaleLedgerDao(),
  afterSaleOperationLogDao: new AfterSaleOperationLogDao(),
  systemPermissionDao: new SystemPermissionDao(),
  userPermissionDao: new UserPermissionDao(),
  userPermissionLogDao: new UserPermissionLogDao(),
  adminUserScopeDao: new AdminUserScopeDao(),
};

export default daos;
