import { Request, Response } from 'express';
import { OpeningReviewService } from '../services';
import { sendSuccess } from '../utils/response';
import {
  ReviewSubmitRequest,
  OpeningReviewBatchRequest,
  ReviewTraceRequest,
  ReviewQueryParams,
  ReviewLevel,
  ReviewStage,
  OpeningType,
  RejectReasonCode,
  ReviewLevelText,
  ReviewStageText,
  OpeningTypeText,
  RejectReasonText
} from '../types/openingReview';

const openingReviewService = new OpeningReviewService();

const PERSONAL_ACCOUNT_TYPES = [
  { value: 1, label: '一类账户(普通)' },
  { value: 2, label: '二类账户' },
  { value: 3, label: '三类账户' }
];

const CORPORATE_ACCOUNT_TYPES = [
  { value: 1, label: '基本存款账户' },
  { value: 2, label: '一般存款账户' },
  { value: 3, label: '专用存款账户' },
  { value: 4, label: '临时存款账户' }
];

const REVIEW_LEVEL_CONFIG = [
  {
    level: ReviewLevel.FIRST,
    name: ReviewLevelText[ReviewLevel.FIRST],
    requiredRoles: ['operator', 'manager', 'admin'],
    description: '一级审核，业务操作员可执行'
  },
  {
    level: ReviewLevel.SECOND,
    name: ReviewLevelText[ReviewLevel.SECOND],
    requiredRoles: ['manager', 'admin'],
    description: '二级审核，机构管理员可执行'
  },
  {
    level: ReviewLevel.FINAL,
    name: ReviewLevelText[ReviewLevel.FINAL],
    requiredRoles: ['admin'],
    description: '三级审核，仅管理员可执行'
  }
];

const OPENING_TYPE_LEVEL_MAP = {
  [OpeningType.PERSONAL]: {
    1: 2,
    2: 1,
    3: 1
  },
  [OpeningType.CORPORATE]: {
    1: 3,
    2: 2,
    3: 2,
    4: 1
  }
};

export class OpeningReviewController {
  async preconditions(req: Request, res: Response) {
    const { openingType, openingId } = req.query as any;
    const result = await openingReviewService.preCheckEnterConditions(
      Number(openingType),
      String(openingId)
    );
    return sendSuccess(res, result, '前置条件校验完成');
  }

  async getList(req: Request, res: Response) {
    const params = req.query as unknown as ReviewQueryParams;
    const result = await openingReviewService.getPendingReviewList(
      params,
      (req as any).userId,
      (req as any).orgId,
      (req as any).userRoles
    );
    return sendSuccess(res, result, '查询成功');
  }

  async getDetail(req: Request, res: Response) {
    const { openingType, openingId } = req.query as any;
    const result = await openingReviewService.getReviewDetail(
      Number(openingType),
      String(openingId)
    );
    return sendSuccess(res, result, '获取详情成功');
  }

  async submitReview(req: Request, res: Response) {
    const data = req.body as ReviewSubmitRequest;
    const result = await openingReviewService.submitReview(
      data,
      (req as any).userId,
      (req as any).userRoles
    );
    return sendSuccess(res, result, '审核提交成功');
  }

  async batchReview(req: Request, res: Response) {
    const data = req.body as OpeningReviewBatchRequest;
    const result = await openingReviewService.batchReview(
      data,
      (req as any).userId,
      (req as any).userRoles
    );
    return sendSuccess(res, result, '批量审核完成');
  }

  async trace(req: Request, res: Response) {
    const data = req.body as ReviewTraceRequest;
    const result = await openingReviewService.traceReview(data);
    return sendSuccess(res, result, '溯源查询成功');
  }

  async getConfig(req: Request, res: Response) {
    const rejectReasons = Object.entries(RejectReasonText).map(([code, label]) => ({
      code,
      label
    }));

    const reviewStages = Object.entries(ReviewStageText).map(([value, label]) => ({
      value: Number(value),
      label
    }));

    const openingTypes = Object.entries(OpeningTypeText).map(([value, label]) => ({
      value: Number(value),
      label
    }));

    const result = {
      reviewLevels: REVIEW_LEVEL_CONFIG,
      rejectReasons,
      reviewStages,
      openingTypes,
      personalAccountTypes: PERSONAL_ACCOUNT_TYPES,
      corporateAccountTypes: CORPORATE_ACCOUNT_TYPES,
      accountTypeOptions: [
        {
          openingType: OpeningType.PERSONAL,
          openingTypeLabel: OpeningTypeText[OpeningType.PERSONAL],
          options: PERSONAL_ACCOUNT_TYPES
        },
        {
          openingType: OpeningType.CORPORATE,
          openingTypeLabel: OpeningTypeText[OpeningType.CORPORATE],
          options: CORPORATE_ACCOUNT_TYPES
        }
      ],
      openingTypeLevelMap: OPENING_TYPE_LEVEL_MAP,
      rejectReasonEnum: RejectReasonCode,
      reviewLevelEnum: ReviewLevel,
      reviewStageEnum: ReviewStage
    };

    return sendSuccess(res, result, '获取配置成功');
  }
}
