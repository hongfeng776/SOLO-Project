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
};

export const services = {
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
};

export default services;
