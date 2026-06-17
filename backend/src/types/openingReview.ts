export enum OpeningType {
  PERSONAL = 1,
  CORPORATE = 2
}

export enum ReviewLevel {
  FIRST = 1,
  SECOND = 2,
  FINAL = 3
}

export enum ReviewResult {
  APPROVED = 1,
  REJECTED = 2,
  CANCELLED = 3
}

export enum ReviewStage {
  PENDING = 0,
  IN_REVIEW = 1,
  FIRST_PASS = 2,
  SECOND_PASS = 3,
  FINAL_PASS = 4,
  ALL_REJECTED = 5,
  CANCELLED = 6
}

export enum RejectReasonCode {
  MATERIAL_MISSING = 'MATERIAL_MISSING',
  INFO_FALSE = 'INFO_FALSE',
  RISK_HIGH = 'RISK_HIGH',
  NAME_MISMATCH = 'NAME_MISMATCH',
  PHOTO_UNCLEAR = 'PHOTO_UNCLEAR',
  OTHER = 'OTHER'
}

export const OpeningTypeText: Record<number, string> = {
  1: '个人开户',
  2: '对公开户'
};

export const ReviewLevelText: Record<number, string> = {
  1: '初审',
  2: '复审',
  3: '终审'
};

export const ReviewResultText: Record<number, string> = {
  1: '通过',
  2: '驳回',
  3: '取消'
};

export const ReviewStageText: Record<number, string> = {
  0: '待审核',
  1: '审核中',
  2: '初审通过',
  3: '复审通过',
  4: '终审通过',
  5: '已驳回',
  6: '已取消'
};

export const RejectReasonText: Record<string, string> = {
  MATERIAL_MISSING: '申请材料缺失',
  INFO_FALSE: '信息虚假不实',
  RISK_HIGH: '风险等级过高',
  NAME_MISMATCH: '姓名/名称不匹配',
  PHOTO_UNCLEAR: '影像资料不清晰',
  OTHER: '其他原因'
};

export const RiskLevelText: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
};

export const ChannelText: Record<string, string> = {
  counter: '柜面',
  ebank: '网上银行',
  mobile: '手机银行',
  atm: '自助设备'
};

export interface OpeningReviewItemVO {
  id: string;
  openingType: number;
  openingNo: string;
  customerName: string;
  idCardNo: string;
  accountTypeText: string;
  riskLevelText: string;
  channelCode?: string;
  submitTime?: string;
  submitterName?: string;
  reviewStage: number;
  reviewStageText: string;
  currentLevel: number;
  nextLevel: number;
  requiredLevel: number;
  precheckPassed: boolean;
  materialsUploaded: boolean;
  riskPrechecked: boolean;
  missingMaterials: string[];
  hasConflict: boolean;
  createdAt: string;
}

export interface ReviewLogVO {
  id: string;
  openingType: number;
  openingId: string;
  openingNo: string;
  reviewLevel: number;
  reviewLevelText: string;
  reviewerId: string;
  reviewerName: string;
  reviewResult: number;
  reviewResultText: string;
  reviewComment?: string;
  rejectReason?: string;
  rejectDetails?: string;
  supportingFiles?: any;
  preApprovedAmount?: number;
  riskLevelBefore?: number;
  riskLevelAfter?: number;
  consistencyCheck?: number;
  conflictFlag: number;
  nextRequiredLevel?: number;
  createdAt: string;
}

export interface OpeningReviewDetailVO {
  baseInfo: {
    id: string;
    openingNo: string;
    openingType: number;
    openingTypeText: string;
    customerName: string;
    idCardNo: string;
    accountType: number;
    accountTypeText: string;
    channelCode?: string;
    channelText?: string;
    status: number;
    statusText: string;
    submitTime?: string;
    submitterName?: string;
    submitOrgName?: string;
    targetOrgName?: string;
    openPurpose?: string;
    mobile?: string;
    registeredAddress?: string;
    businessAddress?: string;
    enterpriseName?: string;
    creditCode?: string;
    legalRepresentative?: string;
    legalIdCardNo?: string;
    agentName?: string;
    agentIdCardNo?: string;
    riskLevel: number;
    riskLevelText: string;
    riskTags?: string;
  };
  materials: {
    name: string;
    uploaded: boolean;
    url?: string;
    missing: boolean;
  }[];
  precheckResult: {
    passed: boolean;
    riskLevel: number;
    riskLevelText: string;
    overallScore?: number;
    items: {
      name: string;
      passed: boolean;
      message: string;
    }[];
  };
  currentReview: {
    currentLevel: number;
    currentLevelText: string;
    nextLevel: number;
    requiredLevel: number;
    canReview: boolean;
    hasConflict: boolean;
  };
  reviewLogs: ReviewLogVO[];
}

export interface ReviewSubmitRequest {
  openingType: number;
  openingId: string;
  level: number;
  result: number;
  comment?: string;
  rejectReason?: string;
  rejectDetails?: string;
  supportingFiles?: string[];
}

export interface OpeningReviewBatchRequest {
  ids: string[];
  openingType: number;
  level: number;
  result: number;
  comment?: string;
  rejectReason?: string;
}

export interface OpeningReviewBatchResultItem {
  id: string;
  openingNo: string;
  success: boolean;
  message?: string;
}

export interface ReviewTraceRequest {
  openingNo?: string;
  idCardNo?: string;
  creditCode?: string;
}

export interface ReviewTraceVO {
  openingList: OpeningReviewItemVO[];
  reviewLogs: ReviewLogVO[];
  consistencyReport: {
    totalReviewCount: number;
    conflictCount: number;
    infoInconsistencies: string[];
    suggestions: string[];
  };
}

export interface ReviewPreCheckVO {
  canEnter: boolean;
  reasons: string[];
  checklist: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}

export interface ReviewQueryParams {
  page?: number;
  pageSize?: number;
  openingType?: number;
  reviewStage?: number;
  channelCode?: string;
  accountType?: number;
  start_time?: string;
  end_time?: string;
  keyword?: string;
}
