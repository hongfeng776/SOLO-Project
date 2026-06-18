import AfterSaleAuditService, { afterSaleAuditService } from './AfterSaleAuditService';
import AfterSaleService, { afterSaleService } from './AfterSaleService';
import AuthService, { authService } from './AuthService';
import GoodsAuditService, { goodsAuditService } from './GoodsAuditService';
import GoodsService, { goodsService } from './GoodsService';
import HotCacheService, { hotCacheService } from './HotCacheService';
import MarketingCalcService, { marketingCalcService } from './MarketingCalcService';
import MarketingService, { marketingService } from './MarketingService';
import MerchantAuditService, { merchantAuditService } from './MerchantAuditService';
import MerchantService, { merchantService } from './MerchantService';
import MessageService, { messageService } from './MessageService';
import OperateLogService, { operateLogService } from './OperateLogService';
import OrderFlowService, { orderFlowService } from './OrderFlowService';
import OrderService, { orderService } from './OrderService';
import PenaltyService, { penaltyService } from './PenaltyService';
import RiskControlService, { riskControlService } from './RiskControlService';
import StatisticsService, { statisticsService } from './StatisticsService';
import UserService, { userService } from './UserService';
import GoodsValidateService, { goodsValidateService } from './GoodsValidateService';
import GoodsEditorService, { goodsEditorService } from './GoodsEditorService';
import GoodsBatchService, { goodsBatchService } from './GoodsBatchService';
import GoodsTraceService, { goodsTraceService } from './GoodsTraceService';
import CategoryValidateService, { categoryValidateService } from './CategoryValidateService';
import CategoryLinkageService, { categoryLinkageService } from './CategoryLinkageService';
import CategoryBatchService, { categoryBatchService } from './CategoryBatchService';
import CategoryTraceService, { categoryTraceService } from './CategoryTraceService';
import GoodsAuditValidateService, { goodsAuditValidateService } from './GoodsAuditValidateService';
import GoodsAuditReviewService, { goodsAuditReviewService } from './GoodsAuditReviewService';
import GoodsAuditBatchService, { goodsAuditBatchService } from './GoodsAuditBatchService';
import GoodsAuditTraceService, { goodsAuditTraceService } from './GoodsAuditTraceService';
import OrderValidateService, { orderValidateService } from './OrderValidateService';
import OrderBatchService, { orderBatchService } from './OrderBatchService';
import OrderTraceService, { orderTraceService } from './OrderTraceService';
import ShippingValidateService, { shippingValidateService } from './ShippingValidateService';
import ShippingSyncService, { shippingSyncService } from './ShippingSyncService';
import LogisticsBatchService, { logisticsBatchService } from './LogisticsBatchService';
import LogisticsTraceService, { logisticsTraceService } from './LogisticsTraceService';
import AfterSaleValidateService, { afterSaleValidateService } from './AfterSaleValidateService';
import AfterSaleSyncService, { afterSaleSyncService } from './AfterSaleSyncService';
import AfterSaleBatchService, { afterSaleBatchService } from './AfterSaleBatchService';
import AfterSaleTraceService, { afterSaleTraceService } from './AfterSaleTraceService';

export {
  AfterSaleAuditService,
  AfterSaleService,
  AuthService,
  GoodsAuditService,
  GoodsService,
  HotCacheService,
  MarketingCalcService,
  MarketingService,
  MerchantAuditService,
  MerchantService,
  MessageService,
  OperateLogService,
  OrderFlowService,
  OrderService,
  PenaltyService,
  RiskControlService,
  StatisticsService,
  UserService,
  GoodsValidateService,
  GoodsEditorService,
  GoodsBatchService,
  GoodsTraceService,
  CategoryValidateService,
  CategoryLinkageService,
  CategoryBatchService,
  CategoryTraceService,
  GoodsAuditValidateService,
  GoodsAuditReviewService,
  GoodsAuditBatchService,
  GoodsAuditTraceService,
  OrderValidateService,
  OrderBatchService,
  OrderTraceService,
  ShippingValidateService,
  ShippingSyncService,
  LogisticsBatchService,
  LogisticsTraceService,
  AfterSaleValidateService,
  AfterSaleSyncService,
  AfterSaleBatchService,
  AfterSaleTraceService,
};

export const services: Record<string, any> = {
  afterSaleAuditService,
  afterSaleService,
  authService,
  goodsAuditService,
  goodsService,
  hotCacheService,
  marketingCalcService,
  marketingService,
  merchantAuditService,
  merchantService,
  messageService,
  operateLogService,
  orderFlowService,
  orderService,
  penaltyService,
  riskControlService,
  statisticsService,
  userService,
  goodsValidateService,
  goodsEditorService,
  goodsBatchService,
  goodsTraceService,
  categoryValidateService,
  categoryLinkageService,
  categoryBatchService,
  categoryTraceService,
  goodsAuditValidateService,
  goodsAuditReviewService,
  goodsAuditBatchService,
  goodsAuditTraceService,
  orderValidateService,
  orderBatchService,
  orderTraceService,
  shippingValidateService,
  shippingSyncService,
  logisticsBatchService,
  logisticsTraceService,
  afterSaleValidateService,
  afterSaleSyncService,
  afterSaleBatchService,
  afterSaleTraceService,
};

export default services;
