export interface Coupon {
  id: number;
  name: string;
  code: string;
  type: number;
  discount: number;
  minAmount: number;
  totalCount: number;
  usedCount: number;
  perLimit: number;
  startTime: string;
  endTime: string;
  status: number;
  description: string;
  createTime: string;
  updateTime: string
}

export interface CityTierConfig {
  tier1?: {
    subsidyAmount?: number;
    maxSubsidyPerOrder?: number;
    discountRate?: number;
    perUserLimit?: number;
  };
  tier2?: {
    subsidyAmount?: number;
    maxSubsidyPerOrder?: number;
    discountRate?: number;
    perUserLimit?: number;
  };
  tier3?: {
    subsidyAmount?: number;
    maxSubsidyPerOrder?: number;
    discountRate?: number;
    perUserLimit?: number;
  };
  tier4?: {
    subsidyAmount?: number;
    maxSubsidyPerOrder?: number;
    discountRate?: number;
    perUserLimit?: number;
  }
}

export interface MarketingCampaign {
  id: number;
  name: string;
  code: string;
  scene: number;
  type: number;
  couponId: number | null;
  subsidyAmount: number;
  maxSubsidyPerOrder: number;
  discountRate: number;
  budget: number;
  usedBudget: number;
  dailyBudget: number;
  startTime: string;
  endTime: string;
  targetUser: number;
  userLevelMin: number;
  registerDaysMin: number;
  registerDaysMax: number;
  inactiveDays: number;
  cities: string[] | null;
  cityTierConfig: CityTierConfig | null;
  vehicleTypes: number[] | null;
  minOrderAmount: number;
  perUserLimit: number;
  perDayLimit: number;
  totalCount: number;
  mutuallyExclusive: number;
  exclusiveScenes: number[] | null;
  rules: any;
  status: number;
  participantCount: number;
  orderCount: number;
  receiveCount: number;
  useCount: number;
  sourceCampaignId: number | null;
  creatorId: number | null;
  creatorName: string | null;
  onlineTime: string | null;
  offlineTime: string | null;
  description: string | null;
  createTime: string;
  updateTime: string
}

export interface ValidateError {
  field: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  blocking: boolean;
  code: string;
  message: string;
  detail?: string[]
}

export interface ValidatePassed {
  field: string;
  message: string
}

export interface ValidateResult {
  valid: boolean;
  riskLevel: number;
  errors: ValidateError[];
  warnings: ValidateError[];
  passed: ValidatePassed[];
  summary: {
    totalChecks: number;
    errorCount: number;
    warningCount: number;
    passCount: number
  }
}

export interface AuditDiffField {
  field: string;
  fieldLabel: string;
  before: any;
  after: any
}

export interface MarketingAuditLog {
  id: number;
  campaignId: number;
  campaignName: string;
  action: string;
  actionLabel: string;
  actionIcon: string;
  actionDetail: string | null;
  operatorId: number;
  operatorName: string;
  beforeData: Partial<MarketingCampaign> | null;
  afterData: Partial<MarketingCampaign> | null;
  diffFields: AuditDiffField[] | null;
  validateResult: ValidateResult | null;
  ip: string | null;
  riskLevel: number;
  riskLabel: string;
  riskColor: string;
  remark: string | null;
  createTime: string
}

export interface SceneConfig {
  scene: number;
  name: string;
  maxSubsidy: number;
  maxDiscountRate: number;
  defaultTargetUser: number;
  requiredFields: string[];
  exclusiveScenes: number[];
  maxBudgetPerCity: number
}

export interface BatchOperationResult {
  success: {
    id: number;
    name?: string;
    newId?: number
  }[];
  failed: {
    id: number;
    reason: string
  }[]
}

export interface BatchUpdateParams {
  ids: number[];
  updateFields: Partial<MarketingCampaign>
}

export interface BatchStatusParams {
  ids: number[];
  status: number
}

export interface BatchCopyParams {
  ids: number[];
  nameSuffix?: string
}

export interface AuditQueryParams {
  page?: number;
  pageSize?: number;
  action?: string;
  riskLevel?: number;
  startDate?: string;
  endDate?: string
}

export interface CampaignQueryParams {
  page?: number;
  pageSize?: number;
  scene?: number;
  type?: number;
  status?: number;
  targetUser?: number;
  city?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string
}

export interface CampaignStatistics {
  participantCount: number;
  orderCount: number;
  receiveCount: number;
  useCount: number;
  usedBudget: number;
  budget: number;
  budgetUsage: string;
  dailyBudgetUsage: string | null;
  conversionRate: string
}

export interface RiskStats {
  totalRisk: number;
  totalBlocked: number;
  riskByAction: {
    label: string;
    count: number;
    blocked: number
  }[]
}
