import {
  marketingDao,
  marketingRewardRuleDao,
  marketingTemplateDao,
  marketingActivityLogDao,
  userDao,
  promoterDao,
} from '../dao';
import CommissionRule from '../models/CommissionRule.model';
import { MarketingAttributes, MarketingCreationAttributes, ParticipationThreshold, ActivityProductConfig } from '../models/Marketing.model';
import { MarketingRewardRuleAttributes, LadderRewardConfig, RankingRewardConfig, FullAmountRewardConfig } from '../models/MarketingRewardRule.model';
import { MarketingTemplateAttributes, MarketingTemplateCreationAttributes } from '../models/MarketingTemplate.model';
import { ValidationResult, ChangeDiff } from '../models/MarketingActivityLog.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import {
  MarketingStatus,
  MarketingType,
  RewardRuleType,
  ParticipationThresholdType,
  ActivityOperationType,
  ValidationSeverity,
  REWARD_RULE_MUTUAL_EXCLUSIONS,
  DISTRIBUTION_REWARD_MAX_RATE,
  DISTRIBUTION_REWARD_MIN_AMOUNT,
  DISTRIBUTION_REWARD_MAX_AMOUNT,
  ACTIVITY_NAME_MAX_LENGTH,
  ACTIVITY_DESCRIPTION_MAX_LENGTH,
  LADDER_REWARD_MAX_LEVELS,
  RANKING_REWARD_MAX_RANKS,
  FULL_AMOUNT_REWARD_MAX_THRESHOLDS,
  PROMOTER_LEVEL_CONFIGS,
  MARKETING_TYPE_LABELS,
  REWARD_RULE_TYPE_LABELS,
  PARTICIPATION_THRESHOLD_LABELS,
} from '../constants/enum';
import { Op, Transaction } from 'sequelize';
import { sequelize } from '../config/database';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import dayjs from 'dayjs';
import crypto from 'crypto';

export interface ActivityCreateParams extends MarketingCreationAttributes {
  rewardRule?: Omit<MarketingRewardRuleAttributes, 'id' | 'marketingId' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
  submitToken?: string;
  operatorId: string;
}

export interface ActivityUpdateParams extends Partial<MarketingAttributes> {
  rewardRule?: Partial<MarketingRewardRuleAttributes>;
  operatorId: string;
}

export interface RewardPreviewRequest {
  rewardRule: {
    ruleType: RewardRuleType;
    ladderConfigs?: LadderRewardConfig[];
    rankingConfigs?: RankingRewardConfig[];
    fullAmountConfigs?: FullAmountRewardConfig[];
    isStackableWithCommission: boolean;
  };
  marketingType: MarketingType;
  testData?: {
    orderAmount: number;
    orderCount: number;
    promoterLevel: string;
    baseCommissionRate: number;
  };
}

interface RewardPreviewResult {
  estimatedReward: number;
  baseCommission: number;
  activityReward: number;
  totalReward: number;
  calculationDetails: string[];
  warnings: string[];
}

export interface BatchCopyParams {
  templateIds: string[];
  startTime: Date;
  endTime: Date;
  operatorId: string;
  rewardParams?: {
    rewardRateMultiplier?: number;
    rewardAmountMultiplier?: number;
  };
  autoAdjustTime?: boolean;
}

interface BatchCreateResult {
  total: number;
  success: number;
  failed: number;
  details: {
    templateId: string;
    templateName: string;
    activityId?: string;
    activityName?: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
  }[];
}

interface TimeConflictCheckResult {
  hasConflict: boolean;
  conflicts: {
    activityId: string;
    activityName: string;
    startTime: Date;
    endTime: Date;
    overlapDays: number;
  }[];
}

interface ActivityValidationResult {
  valid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  infos: ValidationResult[];
}

class DistributionActivityService {
  private async getOperatorInfo(operatorId: string): Promise<{ id: string; name: string }> {
    const user = await userDao.findById(operatorId);
    if (!user) {
      throw new AppError('操作人员不存在', BusinessCode.NOT_FOUND);
    }
    return {
      id: operatorId,
      name: (user as any)?.nickname || (user as any)?.username || '系统',
    };
  }

  private generateSubmitToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async acquireSubmitLock(token: string): Promise<boolean> {
    const cacheKey = `${CacheKey.MARKETING_SUBMIT_LOCK}${token}`;
    const exists = await CacheUtils.exists(cacheKey);
    if (exists) {
      return false;
    }
    await CacheUtils.set(cacheKey, '1', CacheTTL.SHORT);
    return true;
  }

  private async releaseSubmitLock(token: string): Promise<void> {
    const cacheKey = `${CacheKey.MARKETING_SUBMIT_LOCK}${token}`;
    await CacheUtils.del(cacheKey);
  }

  public generateActivityCode(prefix: string = 'ACT'): string {
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  public async checkTimeConflict(
    startTime: Date,
    endTime: Date,
    excludeId?: string,
    marketingType?: MarketingType
  ): Promise<TimeConflictCheckResult> {
    const overlapResult = await marketingDao.checkTimeOverlap(
      startTime,
      endTime,
      excludeId,
      marketingType
    );

    const conflicts = overlapResult.overlappingActivities.map(activity => {
      const activityStart = dayjs(activity.startTime);
      const activityEnd = dayjs(activity.endTime);
      const overlapStart = dayjs(startTime).isAfter(activityStart) ? dayjs(startTime) : activityStart;
      const overlapEnd = dayjs(endTime).isBefore(activityEnd) ? dayjs(endTime) : activityEnd;
      const overlapDays = overlapEnd.diff(overlapStart, 'day') + 1;

      return {
        activityId: activity.id,
        activityName: activity.name,
        startTime: activity.startTime,
        endTime: activity.endTime,
        overlapDays,
      };
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  public validateParticipationThresholds(
    thresholds: ParticipationThreshold[]
  ): ActivityValidationResult {
    const errors: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];
    const infos: ValidationResult[] = [];

    for (const threshold of thresholds) {
      const label = PARTICIPATION_THRESHOLD_LABELS[threshold.thresholdType] || threshold.thresholdType;

      switch (threshold.thresholdType) {
        case ParticipationThresholdType.LEVEL:
          if (!threshold.thresholdValue || !PROMOTER_LEVEL_CONFIGS.find(c => c.level === threshold.thresholdValue)) {
            errors.push({
              field: 'participationThresholds.level',
              severity: ValidationSeverity.ERROR,
              message: `${label}值无效`,
              ruleCode: 'PT-001',
            });
          }
          break;

        case ParticipationThresholdType.TOTAL_ORDERS:
          const orders = Number(threshold.thresholdValue);
          if (isNaN(orders) || orders < 0) {
            errors.push({
              field: 'participationThresholds.totalOrders',
              severity: ValidationSeverity.ERROR,
              message: `${label}必须为非负数`,
              ruleCode: 'PT-002',
            });
          } else if (orders > 10000) {
            warnings.push({
              field: 'participationThresholds.totalOrders',
              severity: ValidationSeverity.WARNING,
              message: `${label}设置过高，可能导致参与人数过少`,
              ruleCode: 'PT-003',
            });
          }
          break;

        case ParticipationThresholdType.TOTAL_AMOUNT:
          const amount = Number(threshold.thresholdValue);
          if (isNaN(amount) || amount < 0) {
            errors.push({
              field: 'participationThresholds.totalAmount',
              severity: ValidationSeverity.ERROR,
              message: `${label}必须为非负数`,
              ruleCode: 'PT-004',
            });
          } else if (amount > 1000000) {
            warnings.push({
              field: 'participationThresholds.totalAmount',
              severity: ValidationSeverity.WARNING,
              message: `${label}设置过高，可能导致参与人数过少`,
              ruleCode: 'PT-005',
            });
          }
          break;

        case ParticipationThresholdType.REGISTRATION_DAYS:
          const days = Number(threshold.thresholdValue);
          if (isNaN(days) || days < 0 || days > 3650) {
            errors.push({
              field: 'participationThresholds.registrationDays',
              severity: ValidationSeverity.ERROR,
              message: `${label}必须在0-3650天之间`,
              ruleCode: 'PT-006',
            });
          }
          break;

        case ParticipationThresholdType.SPECIFIC_PROMOTERS:
          if (!threshold.thresholdValue || !Array.isArray(threshold.thresholdValue) || threshold.thresholdValue.length === 0) {
            errors.push({
              field: 'participationThresholds.specificPromoters',
              severity: ValidationSeverity.ERROR,
              message: `${label}必须至少指定一个推客`,
              ruleCode: 'PT-007',
            });
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      infos,
    };
  }

  public validateRewardRule(
    ruleType: RewardRuleType,
    ladderConfigs?: LadderRewardConfig[],
    rankingConfigs?: RankingRewardConfig[],
    fullAmountConfigs?: FullAmountRewardConfig[]
  ): ActivityValidationResult {
    const errors: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];
    const infos: ValidationResult[] = [];

    switch (ruleType) {
      case RewardRuleType.LADDER:
        if (!ladderConfigs || ladderConfigs.length === 0) {
          errors.push({
            field: 'rewardRule.ladderConfigs',
            severity: ValidationSeverity.ERROR,
            message: '阶梯奖励必须配置至少一个阶梯',
            ruleCode: 'RR-001',
          });
          break;
        }
        if (ladderConfigs.length > LADDER_REWARD_MAX_LEVELS) {
          errors.push({
            field: 'rewardRule.ladderConfigs',
            severity: ValidationSeverity.ERROR,
            message: `阶梯奖励最多配置${LADDER_REWARD_MAX_LEVELS}个阶梯`,
            ruleCode: 'RR-002',
          });
          break;
        }

        ladderConfigs.sort((a, b) => a.level - b.level);
        let prevMaxAmount = 0;
        let prevMaxOrders = 0;

        for (let i = 0; i < ladderConfigs.length; i++) {
          const config = ladderConfigs[i];
          const levelLabel = `第${config.level}阶梯`;

          if (config.minAmount < 0) {
            errors.push({
              field: `rewardRule.ladderConfigs[${i}].minAmount`,
              severity: ValidationSeverity.ERROR,
              message: `${levelLabel}最低金额不能为负数`,
              ruleCode: 'RR-003',
            });
          }
          if (config.minOrders < 0) {
            errors.push({
              field: `rewardRule.ladderConfigs[${i}].minOrders`,
              severity: ValidationSeverity.ERROR,
              message: `${levelLabel}最低订单数不能为负数`,
              ruleCode: 'RR-004',
            });
          }

          if (config.rewardType === 'fixed') {
            if (config.rewardAmount < DISTRIBUTION_REWARD_MIN_AMOUNT || config.rewardAmount > DISTRIBUTION_REWARD_MAX_AMOUNT) {
              errors.push({
                field: `rewardRule.ladderConfigs[${i}].rewardAmount`,
                severity: ValidationSeverity.ERROR,
                message: `${levelLabel}奖励金额必须在¥${DISTRIBUTION_REWARD_MIN_AMOUNT}-¥${DISTRIBUTION_REWARD_MAX_AMOUNT}之间`,
                ruleCode: 'RR-005',
              });
            }
          } else {
            if (config.rewardRate < 0 || config.rewardRate > DISTRIBUTION_REWARD_MAX_RATE) {
              errors.push({
                field: `rewardRule.ladderConfigs[${i}].rewardRate`,
                severity: ValidationSeverity.ERROR,
                message: `${levelLabel}奖励比例必须在0-${DISTRIBUTION_REWARD_MAX_RATE * 100}%之间`,
                ruleCode: 'RR-006',
              });
            } else if (config.rewardRate > 0.3) {
              warnings.push({
                field: `rewardRule.ladderConfigs[${i}].rewardRate`,
                severity: ValidationSeverity.WARNING,
                message: `${levelLabel}奖励比例超过30%，请注意成本控制`,
                ruleCode: 'RR-007',
              });
            }
          }

          if (i > 0) {
            if (config.minAmount <= prevMaxAmount) {
              errors.push({
                field: `rewardRule.ladderConfigs[${i}].minAmount`,
                severity: ValidationSeverity.ERROR,
                message: `${levelLabel}最低金额必须大于上一阶梯`,
                ruleCode: 'RR-008',
              });
            }
            if (config.minOrders <= prevMaxOrders) {
              errors.push({
                field: `rewardRule.ladderConfigs[${i}].minOrders`,
                severity: ValidationSeverity.ERROR,
                message: `${levelLabel}最低订单数必须大于上一阶梯`,
                ruleCode: 'RR-009',
              });
            }
          }

          prevMaxAmount = config.minAmount;
          prevMaxOrders = config.minOrders;
        }
        break;

      case RewardRuleType.RANKING:
        if (!rankingConfigs || rankingConfigs.length === 0) {
          errors.push({
            field: 'rewardRule.rankingConfigs',
            severity: ValidationSeverity.ERROR,
            message: '排名奖励必须配置至少一个排名区间',
            ruleCode: 'RR-010',
          });
          break;
        }
        if (rankingConfigs.length > RANKING_REWARD_MAX_RANKS) {
          errors.push({
            field: 'rewardRule.rankingConfigs',
            severity: ValidationSeverity.ERROR,
            message: `排名奖励最多配置${RANKING_REWARD_MAX_RANKS}个排名区间`,
            ruleCode: 'RR-011',
          });
          break;
        }

        rankingConfigs.sort((a, b) => a.rankStart - b.rankStart);

        for (let i = 0; i < rankingConfigs.length; i++) {
          const config = rankingConfigs[i];
          const rangeLabel = `第${config.rankStart}-${config.rankEnd}名`;

          if (config.rankStart < 1 || config.rankEnd < config.rankStart) {
            errors.push({
              field: `rewardRule.rankingConfigs[${i}]`,
              severity: ValidationSeverity.ERROR,
              message: `${rangeLabel}排名区间无效`,
              ruleCode: 'RR-012',
            });
          }

          if (i > 0 && config.rankStart !== rankingConfigs[i - 1].rankEnd + 1) {
            errors.push({
              field: `rewardRule.rankingConfigs[${i}].rankStart`,
              severity: ValidationSeverity.ERROR,
              message: `${rangeLabel}与上一区间不连续`,
              ruleCode: 'RR-013',
            });
          }

          if (config.rewardType === 'fixed') {
            if (config.rewardAmount < DISTRIBUTION_REWARD_MIN_AMOUNT || config.rewardAmount > DISTRIBUTION_REWARD_MAX_AMOUNT) {
              errors.push({
                field: `rewardRule.rankingConfigs[${i}].rewardAmount`,
                severity: ValidationSeverity.ERROR,
                message: `${rangeLabel}奖励金额必须在¥${DISTRIBUTION_REWARD_MIN_AMOUNT}-¥${DISTRIBUTION_REWARD_MAX_AMOUNT}之间`,
                ruleCode: 'RR-014',
              });
            }
          } else {
            if (config.rewardRate < 0 || config.rewardRate > DISTRIBUTION_REWARD_MAX_RATE) {
              errors.push({
                field: `rewardRule.rankingConfigs[${i}].rewardRate`,
                severity: ValidationSeverity.ERROR,
                message: `${rangeLabel}奖励比例必须在0-${DISTRIBUTION_REWARD_MAX_RATE * 100}%之间`,
                ruleCode: 'RR-015',
              });
            } else if (config.rewardRate > 0.3) {
              warnings.push({
                field: `rewardRule.rankingConfigs[${i}].rewardRate`,
                severity: ValidationSeverity.WARNING,
                message: `${rangeLabel}奖励比例超过30%，请注意成本控制`,
                ruleCode: 'RR-016',
              });
            }
          }
        }
        break;

      case RewardRuleType.FULL_AMOUNT:
        if (!fullAmountConfigs || fullAmountConfigs.length === 0) {
          errors.push({
            field: 'rewardRule.fullAmountConfigs',
            severity: ValidationSeverity.ERROR,
            message: '满额奖励必须配置至少一个满额阈值',
            ruleCode: 'RR-017',
          });
          break;
        }
        if (fullAmountConfigs.length > FULL_AMOUNT_REWARD_MAX_THRESHOLDS) {
          errors.push({
            field: 'rewardRule.fullAmountConfigs',
            severity: ValidationSeverity.ERROR,
            message: `满额奖励最多配置${FULL_AMOUNT_REWARD_MAX_THRESHOLDS}个阈值`,
            ruleCode: 'RR-018',
          });
          break;
        }

        fullAmountConfigs.sort((a, b) => a.threshold - b.threshold);

        for (let i = 0; i < fullAmountConfigs.length; i++) {
          const config = fullAmountConfigs[i];
          const thresholdLabel = `满¥${config.threshold}`;

          if (config.threshold <= 0) {
            errors.push({
              field: `rewardRule.fullAmountConfigs[${i}].threshold`,
              severity: ValidationSeverity.ERROR,
              message: `${thresholdLabel}必须大于0`,
              ruleCode: 'RR-019',
            });
          }

          if (i > 0 && config.threshold <= fullAmountConfigs[i - 1].threshold) {
            errors.push({
              field: `rewardRule.fullAmountConfigs[${i}].threshold`,
              severity: ValidationSeverity.ERROR,
              message: `${thresholdLabel}必须大于上一阈值`,
              ruleCode: 'RR-020',
            });
          }

          if (config.rewardType === 'fixed') {
            if (config.rewardAmount < DISTRIBUTION_REWARD_MIN_AMOUNT || config.rewardAmount > DISTRIBUTION_REWARD_MAX_AMOUNT) {
              errors.push({
                field: `rewardRule.fullAmountConfigs[${i}].rewardAmount`,
                severity: ValidationSeverity.ERROR,
                message: `${thresholdLabel}奖励金额必须在¥${DISTRIBUTION_REWARD_MIN_AMOUNT}-¥${DISTRIBUTION_REWARD_MAX_AMOUNT}之间`,
                ruleCode: 'RR-021',
              });
            }
          } else {
            if (config.rewardRate < 0 || config.rewardRate > DISTRIBUTION_REWARD_MAX_RATE) {
              errors.push({
                field: `rewardRule.fullAmountConfigs[${i}].rewardRate`,
                severity: ValidationSeverity.ERROR,
                message: `${thresholdLabel}奖励比例必须在0-${DISTRIBUTION_REWARD_MAX_RATE * 100}%之间`,
                ruleCode: 'RR-022',
              });
            } else if (config.rewardRate > 0.3) {
              warnings.push({
                field: `rewardRule.fullAmountConfigs[${i}].rewardRate`,
                severity: ValidationSeverity.WARNING,
                message: `${thresholdLabel}奖励比例超过30%，请注意成本控制`,
                ruleCode: 'RR-023',
              });
            }
          }

          if (i > 0 && config.canStack && !fullAmountConfigs[i - 1].canStack) {
            warnings.push({
              field: `rewardRule.fullAmountConfigs[${i}].canStack`,
              severity: ValidationSeverity.WARNING,
              message: `高级别可叠加但低级别不可叠加，可能导致规则不清晰`,
              ruleCode: 'RR-024',
            });
          }
        }
        break;

      default:
        errors.push({
          field: 'rewardRule.ruleType',
          severity: ValidationSeverity.ERROR,
          message: '无效的奖励规则类型',
          ruleCode: 'RR-025',
        });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      infos,
    };
  }

  public checkRewardRuleMutualExclusion(
    existingRuleType: RewardRuleType | undefined,
    newRuleType: RewardRuleType
  ): { valid: boolean; conflict?: string } {
    if (!existingRuleType) {
      return { valid: true };
    }

    for (const exclusion of REWARD_RULE_MUTUAL_EXCLUSIONS) {
      if (exclusion.includes(existingRuleType) && exclusion.includes(newRuleType) && existingRuleType !== newRuleType) {
        return {
          valid: false,
          conflict: `${REWARD_RULE_TYPE_LABELS[existingRuleType]}与${REWARD_RULE_TYPE_LABELS[newRuleType]}互斥，不能同时配置`,
        };
      }
    }

    return { valid: true };
  }

  public async checkCommissionConflict(
    rewardRate: number,
    isStackableWithCommission: boolean,
    productIds?: string[]
  ): Promise<{ hasConflict: boolean; message?: string; maxTotalRate: number }> {
    const commissionRules = await CommissionRule.findAll({ where: { status: 1 } } as any);
    const maxCommissionRate = Math.max(...commissionRules.map((r: any) => r.commissionRate || 0), 0);

    const totalRate = maxCommissionRate + (isStackableWithCommission ? rewardRate : 0);
    const maxAllowedRate = DISTRIBUTION_REWARD_MAX_RATE;

    if (totalRate > maxAllowedRate) {
      return {
        hasConflict: true,
        message: `佣金比例(${maxCommissionRate * 100}%) + 活动奖励比例(${rewardRate * 100}%) = ${totalRate * 100}%，超过最大限制${maxAllowedRate * 100}%`,
        maxTotalRate: totalRate,
      };
    }

    return {
      hasConflict: false,
      maxTotalRate: totalRate,
    };
  }

  public async validateActivityData(
    data: Partial<MarketingAttributes> & { rewardRule?: any },
    isUpdate: boolean = false,
    activityId?: string
  ): Promise<ActivityValidationResult> {
    const allErrors: ValidationResult[] = [];
    const allWarnings: ValidationResult[] = [];
    const allInfos: ValidationResult[] = [];

    if (data.name) {
      if (data.name.length > ACTIVITY_NAME_MAX_LENGTH) {
        allErrors.push({
          field: 'name',
          severity: ValidationSeverity.ERROR,
          message: `活动名称不能超过${ACTIVITY_NAME_MAX_LENGTH}个字符`,
          ruleCode: 'AD-001',
        });
      }
      if (data.name.trim().length < 2) {
        allErrors.push({
          field: 'name',
          severity: ValidationSeverity.ERROR,
          message: '活动名称至少2个字符',
          ruleCode: 'AD-002',
        });
      }
    } else if (!isUpdate) {
      allErrors.push({
        field: 'name',
        severity: ValidationSeverity.ERROR,
        message: '活动名称不能为空',
        ruleCode: 'AD-003',
      });
    }

    if (data.description && data.description.length > ACTIVITY_DESCRIPTION_MAX_LENGTH) {
      allErrors.push({
        field: 'description',
        severity: ValidationSeverity.ERROR,
        message: `活动描述不能超过${ACTIVITY_DESCRIPTION_MAX_LENGTH}个字符`,
        ruleCode: 'AD-004',
      });
    }

    if (data.startTime && data.endTime) {
      const start = dayjs(data.startTime);
      const end = dayjs(data.endTime);
      const now = dayjs();

      if (!isUpdate && start.isBefore(now.subtract(1, 'minute'))) {
        allErrors.push({
          field: 'startTime',
          severity: ValidationSeverity.ERROR,
          message: '活动开始时间不能早于当前时间',
          ruleCode: 'AD-005',
        });
      }

      if (end.isBefore(start)) {
        allErrors.push({
          field: 'endTime',
          severity: ValidationSeverity.ERROR,
          message: '活动结束时间必须晚于开始时间',
          ruleCode: 'AD-006',
        });
      }

      const durationDays = end.diff(start, 'day');
      if (durationDays > 365) {
        allWarnings.push({
          field: 'endTime',
          severity: ValidationSeverity.WARNING,
          message: '活动持续时间超过1年，请确认是否合理',
          ruleCode: 'AD-007',
        });
      }

      if (durationDays < 1) {
        allWarnings.push({
          field: 'endTime',
          severity: ValidationSeverity.WARNING,
          message: '活动持续时间不足1天，可能影响参与率',
          ruleCode: 'AD-008',
        });
      }

      const timeConflict = await this.checkTimeConflict(
        data.startTime,
        data.endTime,
        activityId,
        data.type
      );

      if (timeConflict.hasConflict) {
        timeConflict.conflicts.forEach(conflict => {
          allWarnings.push({
            field: 'timeRange',
            severity: ValidationSeverity.WARNING,
            message: `与活动「${conflict.activityName}」时间重叠${conflict.overlapDays}天`,
            ruleCode: 'AD-009',
          });
        });
      }
    }

    if (data.budget !== undefined && data.budget !== null) {
      const budget = Number(data.budget);
      if (isNaN(budget) || budget < 0) {
        allErrors.push({
          field: 'budget',
          severity: ValidationSeverity.ERROR,
          message: '活动预算必须为非负数',
          ruleCode: 'AD-010',
        });
      } else if (budget === 0) {
        allWarnings.push({
          field: 'budget',
          severity: ValidationSeverity.WARNING,
          message: '活动预算为0，可能无法正常发放奖励',
          ruleCode: 'AD-011',
        });
      }
    }

    if (data.participationThresholds && data.participationThresholds.length > 0) {
      const thresholdValidation = this.validateParticipationThresholds(data.participationThresholds);
      allErrors.push(...thresholdValidation.errors);
      allWarnings.push(...thresholdValidation.warnings);
      allInfos.push(...thresholdValidation.infos);
    }

    if (data.rewardRule && data.rewardRule.ruleType) {
      const rewardValidation = this.validateRewardRule(
        data.rewardRule.ruleType,
        data.rewardRule.ladderConfigs,
        data.rewardRule.rankingConfigs,
        data.rewardRule.fullAmountConfigs
      );
      allErrors.push(...rewardValidation.errors);
      allWarnings.push(...rewardValidation.warnings);
      allInfos.push(...rewardValidation.infos);

      if (rewardValidation.valid) {
        const maxRewardRate = Math.max(
          ...(data.rewardRule.ladderConfigs?.map((c: any) => c.rewardRate || 0) || []),
          ...(data.rewardRule.rankingConfigs?.map((c: any) => c.rewardRate || 0) || []),
          ...(data.rewardRule.fullAmountConfigs?.map((c: any) => c.rewardRate || 0) || []),
          0
        );

        if (maxRewardRate > 0) {
          const commissionConflict = await this.checkCommissionConflict(
            maxRewardRate,
            data.rewardRule.isStackableWithCommission,
            data.productConfig?.productIds
          );

          if (commissionConflict.hasConflict) {
            allErrors.push({
              field: 'rewardRule',
              severity: ValidationSeverity.ERROR,
              message: commissionConflict.message!,
              ruleCode: 'AD-012',
            });
          } else if (commissionConflict.maxTotalRate > 0.3) {
            allWarnings.push({
              field: 'rewardRule',
              severity: ValidationSeverity.WARNING,
              message: `总奖励比例达到${commissionConflict.maxTotalRate * 100}%，请注意成本控制`,
              ruleCode: 'AD-013',
            });
          }
        }
      }
    }

    if (data.maxCommissionRate !== undefined && data.maxCommissionRate !== null) {
      const rate = Number(data.maxCommissionRate);
      if (isNaN(rate) || rate < 0 || rate > DISTRIBUTION_REWARD_MAX_RATE) {
        allErrors.push({
          field: 'maxCommissionRate',
          severity: ValidationSeverity.ERROR,
          message: `最高佣金比例必须在0-${DISTRIBUTION_REWARD_MAX_RATE * 100}%之间`,
          ruleCode: 'AD-014',
        });
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      infos: allInfos,
    };
  }

  private async logActivityOperation(
    params: {
      marketingId?: string;
      templateId?: string;
      operatorId: string;
      operatorName: string;
      operationType: ActivityOperationType;
      operationDetail?: string;
      beforeData?: object;
      afterData?: object;
      changeDiffs?: ChangeDiff[];
      validationResults?: ValidationResult[];
      previewSnapshot?: object;
      ipAddress?: string;
      userAgent?: string;
      remark?: string;
    }
  ): Promise<void> {
    await marketingActivityLogDao.create({
      marketingId: params.marketingId,
      templateId: params.templateId,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      operationType: params.operationType,
      operationDetail: params.operationDetail,
      beforeData: params.beforeData,
      afterData: params.afterData,
      changeDiffs: params.changeDiffs,
      validationResults: params.validationResults,
      previewSnapshot: params.previewSnapshot,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      remark: params.remark,
    });
  }

  private calculateChangeDiff(
    beforeData: Record<string, any>,
    afterData: Record<string, any>
  ): ChangeDiff[] {
    const diffs: ChangeDiff[] = [];
    const allFields = new Set([...Object.keys(beforeData), ...Object.keys(afterData)]);

    for (const field of allFields) {
      const oldVal = beforeData[field];
      const newVal = afterData[field];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diffs.push({
          field,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }

    return diffs;
  }

  public async createDistributionActivity(params: ActivityCreateParams): Promise<any> {
    const operator = await this.getOperatorInfo(params.operatorId);

    const submitToken = params.submitToken || this.generateSubmitToken();
    const lockAcquired = await this.acquireSubmitLock(submitToken);
    if (!lockAcquired) {
      throw new AppError('操作过于频繁，请稍后再试', BusinessCode.ERROR);
    }

    const transaction: Transaction = await sequelize.transaction();

    try {
      const validationResult = await this.validateActivityData(params);
      if (!validationResult.valid) {
        await transaction.rollback();
        await this.releaseSubmitLock(submitToken);
        const errorMessages = validationResult.errors.map(e => e.message).join('；');
        throw new AppError(errorMessages, BusinessCode.PARAM_ERROR);
      }

      if (params.submitToken) {
        const tokenExists = await marketingDao.existsBySubmitToken(params.submitToken);
        if (tokenExists) {
          await transaction.rollback();
          await this.releaseSubmitLock(submitToken);
          throw new AppError('活动已提交，请勿重复操作', BusinessCode.ERROR);
        }
      }

      if (!params.code) {
        params.code = this.generateActivityCode();
      }

      const codeExists = await marketingDao.existsByCode(params.code);
      if (codeExists) {
        await transaction.rollback();
        await this.releaseSubmitLock(submitToken);
        throw new AppError('活动编码已存在', BusinessCode.ERROR);
      }

      const activityData: MarketingCreationAttributes = {
        ...params,
        createdBy: operator.id,
        submitToken: params.submitToken || submitToken,
        status: params.status || MarketingStatus.DRAFT,
      };

      const marketing = await marketingDao.create(activityData, { transaction });

      if (params.rewardRule) {
        const rewardRuleData: any = {
          ...params.rewardRule,
          marketingId: marketing.id,
          marketingType: params.type,
          status: 1,
        };
        await marketingRewardRuleDao.create(rewardRuleData, { transaction });
      }

      await transaction.commit();
      await this.releaseSubmitLock(submitToken);

      await this.logActivityOperation({
        marketingId: marketing.id,
        operatorId: operator.id,
        operatorName: operator.name,
        operationType: ActivityOperationType.CREATE,
        operationDetail: `创建分销活动：${marketing.name}`,
        afterData: { ...activityData, rewardRule: params.rewardRule },
        validationResults: [...validationResult.errors, ...validationResult.warnings, ...validationResult.infos],
      });

      await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);

      return this.getActivityDetail(marketing.id);
    } catch (error) {
      await transaction.rollback();
      await this.releaseSubmitLock(submitToken);
      throw error;
    }
  }

  public async updateDistributionActivity(
    id: string,
    params: ActivityUpdateParams
  ): Promise<any> {
    const operator = await this.getOperatorInfo(params.operatorId);
    const marketing = await marketingDao.findById(id);

    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }

    const beforeData = marketing.get({ plain: true });
    const existingRewardRule = await marketingRewardRuleDao.findByMarketingId(id);

    if (params.rewardRule && params.rewardRule.ruleType && existingRewardRule) {
      const exclusionCheck = this.checkRewardRuleMutualExclusion(
        existingRewardRule.ruleType as RewardRuleType,
        params.rewardRule.ruleType as RewardRuleType
      );
      if (!exclusionCheck.valid) {
        throw new AppError(exclusionCheck.conflict!, BusinessCode.PARAM_ERROR);
      }
    }

    const validationResult = await this.validateActivityData(params, true, id);
    if (!validationResult.valid) {
      const errorMessages = validationResult.errors.map(e => e.message).join('；');
      throw new AppError(errorMessages, BusinessCode.PARAM_ERROR);
    }

    if (params.code && params.code !== marketing.code) {
      const codeExists = await marketingDao.existsByCodeAndId(params.code, id);
      if (codeExists) {
        throw new AppError('活动编码已存在', BusinessCode.ERROR);
      }
    }

    const { rewardRule, ...activityData } = params;
    await marketingDao.update(activityData, { where: { id } });

    if (rewardRule) {
      if (existingRewardRule) {
        await marketingRewardRuleDao.update(rewardRule as any, { where: { id: existingRewardRule.id } });
      } else {
        await marketingRewardRuleDao.create({
          ...rewardRule,
          marketingId: id,
          marketingType: marketing.type,
          status: 1,
        } as any);
      }
    }

    const changeDiffs = this.calculateChangeDiff(
      beforeData,
      { ...beforeData, ...activityData }
    );

    await this.logActivityOperation({
      marketingId: id,
      operatorId: operator.id,
      operatorName: operator.name,
      operationType: ActivityOperationType.UPDATE,
      operationDetail: `更新活动信息`,
      beforeData,
      afterData: { ...beforeData, ...activityData, rewardRule },
      changeDiffs,
      validationResults: [...validationResult.errors, ...validationResult.warnings, ...validationResult.infos],
    });

    await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);

    return this.getActivityDetail(id);
  }

  public async getActivityDetail(id: string): Promise<any> {
    const cacheKey = `${CacheKey.MARKETING_DETAIL}${id}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }

    const result: any = marketing.get({ plain: true });
    const rewardRule = await marketingRewardRuleDao.findByMarketingId(id);
    if (rewardRule) {
      result.rewardRule = rewardRule.get({ plain: true });
    }

    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  public async previewActivityReward(
    marketingId: string,
    params: RewardPreviewRequest,
    operatorId: string
  ): Promise<RewardPreviewResult> {
    const operator = await this.getOperatorInfo(operatorId);

    const warnings: string[] = [];
    const calculationDetails: string[] = [];

    const testOrderAmount = params.testData?.orderAmount || 10000;
    const testOrderCount = params.testData?.orderCount || 10;
    const testPromoterLevel = params.testData?.promoterLevel || 'L3';
    const baseCommissionRate = params.testData?.baseCommissionRate || 0.12;

    const levelConfig = PROMOTER_LEVEL_CONFIGS.find(c => c.level === testPromoterLevel);
    const effectiveBaseRate = baseCommissionRate || levelConfig?.commissionRate || 0.1;

    let activityReward = 0;
    const { ruleType, ladderConfigs, rankingConfigs, fullAmountConfigs, isStackableWithCommission } = params.rewardRule;

    switch (ruleType) {
      case RewardRuleType.LADDER:
        if (ladderConfigs && ladderConfigs.length > 0) {
          const sortedConfigs = [...ladderConfigs].sort((a, b) => b.level - a.level);
          const matchedConfig = sortedConfigs.find(
            c => testOrderAmount >= c.minAmount && testOrderCount >= c.minOrders
          );

          if (matchedConfig) {
            calculationDetails.push(`匹配阶梯等级：第${matchedConfig.level}阶（满¥${matchedConfig.minAmount}且${matchedConfig.minOrders}单）`);
            if (matchedConfig.rewardType === 'fixed') {
              activityReward = matchedConfig.rewardAmount;
              calculationDetails.push(`阶梯奖励：固定金额¥${matchedConfig.rewardAmount}`);
            } else {
              activityReward = testOrderAmount * matchedConfig.rewardRate;
              calculationDetails.push(`阶梯奖励：订单金额¥${testOrderAmount} × ${matchedConfig.rewardRate * 100}% = ¥${activityReward.toFixed(2)}`);
            }
          } else {
            calculationDetails.push('未达到任何阶梯门槛');
          }
        }
        break;

      case RewardRuleType.RANKING:
        if (rankingConfigs && rankingConfigs.length > 0) {
          const testRank = Math.ceil(testOrderCount / 2);
          const matchedConfig = rankingConfigs.find(
            c => testRank >= c.rankStart && testRank <= c.rankEnd
          );

          if (matchedConfig) {
            calculationDetails.push(`测试排名：第${testRank}名，匹配区间：第${matchedConfig.rankStart}-${matchedConfig.rankEnd}名`);
            if (matchedConfig.rewardType === 'fixed') {
              activityReward = matchedConfig.rewardAmount;
              calculationDetails.push(`排名奖励：固定金额¥${matchedConfig.rewardAmount}`);
            } else {
              activityReward = testOrderAmount * matchedConfig.rewardRate;
              calculationDetails.push(`排名奖励：订单金额¥${testOrderAmount} × ${matchedConfig.rewardRate * 100}% = ¥${activityReward.toFixed(2)}`);
            }
          }
        }
        break;

      case RewardRuleType.FULL_AMOUNT:
        if (fullAmountConfigs && fullAmountConfigs.length > 0) {
          const sortedConfigs = [...fullAmountConfigs].sort((a, b) => b.threshold - a.threshold);

          for (const config of sortedConfigs) {
            if (testOrderAmount >= config.threshold) {
              if (config.rewardType === 'fixed') {
                const reward = config.rewardAmount;
                activityReward += reward;
                calculationDetails.push(`满¥${config.threshold}奖励：固定金额¥${reward}${config.canStack ? '（可叠加）' : ''}`);
              } else {
                const reward = testOrderAmount * config.rewardRate;
                activityReward += reward;
                calculationDetails.push(`满¥${config.threshold}奖励：订单金额¥${testOrderAmount} × ${config.rewardRate * 100}% = ¥${reward.toFixed(2)}${config.canStack ? '（可叠加）' : ''}`);
              }
              if (!config.canStack) {
                break;
              }
            }
          }

          if (activityReward === 0) {
            calculationDetails.push('未达到任何满额门槛');
          }
        }
        break;
    }

    const baseCommission = testOrderAmount * effectiveBaseRate;
    calculationDetails.unshift(`基础佣金：订单金额¥${testOrderAmount} × ${effectiveBaseRate * 100}% = ¥${baseCommission.toFixed(2)}`);

    let totalReward: number;
    if (isStackableWithCommission) {
      totalReward = baseCommission + activityReward;
      calculationDetails.push(`总奖励：基础佣金¥${baseCommission.toFixed(2)} + 活动奖励¥${activityReward.toFixed(2)} = ¥${totalReward.toFixed(2)}`);
    } else {
      totalReward = Math.max(baseCommission, activityReward);
      calculationDetails.push(`奖励不可叠加，取较高值：MAX(¥${baseCommission.toFixed(2)}, ¥${activityReward.toFixed(2)}) = ¥${totalReward.toFixed(2)}`);
    }

    const maxReward = testOrderAmount * DISTRIBUTION_REWARD_MAX_RATE;
    if (totalReward > maxReward) {
      warnings.push(`总奖励超过最大限制¥${maxReward.toFixed(2)}（${DISTRIBUTION_REWARD_MAX_RATE * 100}%）`);
    }

    await marketingDao.incrementPreviewCount(marketingId);

    const snapshot = {
      testData: params.testData,
      rewardRule: params.rewardRule,
      result: {
        baseCommission,
        activityReward,
        totalReward,
        calculationDetails,
        warnings,
      },
      previewAt: new Date(),
    };

    await CacheUtils.set(`${CacheKey.MARKETING_PREVIEW_SNAPSHOT}${marketingId}`, snapshot, CacheTTL.LONG);

    await this.logActivityOperation({
      marketingId,
      operatorId: operator.id,
      operatorName: operator.name,
      operationType: ActivityOperationType.PREVIEW,
      operationDetail: `预览活动奖励效果`,
      previewSnapshot: snapshot,
    });

    return {
      estimatedReward: Number(totalReward.toFixed(2)),
      baseCommission: Number(baseCommission.toFixed(2)),
      activityReward: Number(activityReward.toFixed(2)),
      totalReward: Number(totalReward.toFixed(2)),
      calculationDetails,
      warnings,
    };
  }

  public async batchCopyTemplates(params: BatchCopyParams): Promise<BatchCreateResult> {
    const operator = await this.getOperatorInfo(params.operatorId);
    const details: BatchCreateResult['details'] = [];
    let success = 0;
    let failed = 0;

    for (const templateId of params.templateIds) {
      try {
        const template = await marketingTemplateDao.findById(templateId);
        if (!template) {
          details.push({
            templateId,
            templateName: '-',
            status: 'failed',
            reason: '模板不存在',
          });
          failed++;
          continue;
        }

        const plainTemplate = template.get({ plain: true });

        let startTime = new Date(params.startTime);
        let endTime = new Date(params.endTime);

        if (params.autoAdjustTime && plainTemplate.activityDurationDays) {
          endTime = dayjs(startTime).add(plainTemplate.activityDurationDays, 'day').toDate();
        }

        const timeConflict = await this.checkTimeConflict(startTime, endTime, undefined, plainTemplate.marketingType);
        if (timeConflict.hasConflict && params.autoAdjustTime) {
          let adjusted = false;
          for (let i = 0; i < 30 && !adjusted; i++) {
            startTime = dayjs(startTime).add(1, 'day').toDate();
            endTime = dayjs(endTime).add(1, 'day').toDate();
            const newConflict = await this.checkTimeConflict(startTime, endTime, undefined, plainTemplate.marketingType);
            if (!newConflict.hasConflict) {
              adjusted = true;
            }
          }
          if (!adjusted) {
            details.push({
              templateId,
              templateName: plainTemplate.name,
              status: 'failed',
              reason: '自动调整时间30天内仍存在冲突，请手动设置时间',
            });
            failed++;
            continue;
          }
        } else if (timeConflict.hasConflict) {
          details.push({
            templateId,
            templateName: plainTemplate.name,
            status: 'failed',
            reason: `与活动「${timeConflict.conflicts[0].activityName}」时间冲突`,
          });
          failed++;
          continue;
        }

        let rewardConfig = plainTemplate.rewardConfig;
        if (params.rewardParams && rewardConfig) {
          rewardConfig = JSON.parse(JSON.stringify(rewardConfig));
          if (params.rewardParams.rewardRateMultiplier) {
            if (rewardConfig?.configs) {
              rewardConfig.configs = rewardConfig.configs.map((c: any) => ({
                ...c,
                rewardRate: c.rewardRate ? c.rewardRate * params.rewardParams!.rewardRateMultiplier! : c.rewardRate,
              }));
            }
          }
          if (params.rewardParams.rewardAmountMultiplier) {
            if (rewardConfig?.configs) {
              rewardConfig.configs = rewardConfig.configs.map((c: any) => ({
                ...c,
                rewardAmount: c.rewardAmount ? c.rewardAmount * params.rewardParams!.rewardAmountMultiplier! : c.rewardAmount,
              }));
            }
          }
        }

        const newActivityCode = this.generateActivityCode();
        const activityData: any = {
          name: `${plainTemplate.name}（复制）`,
          code: newActivityCode,
          type: plainTemplate.marketingType,
          description: plainTemplate.description,
          coverImage: plainTemplate.coverImage,
          startTime,
          endTime,
          budget: plainTemplate.budget,
          participationThresholds: plainTemplate.participationConfig,
          productConfig: plainTemplate.productConfig,
          templateId: plainTemplate.id,
          createdBy: operator.id,
          status: MarketingStatus.DRAFT,
        };

        const validationResult = await this.validateActivityData(activityData);
        if (!validationResult.valid) {
          details.push({
            templateId,
            templateName: plainTemplate.name,
            status: 'failed',
            reason: validationResult.errors.map(e => e.message).join('；'),
          });
          failed++;
          continue;
        }

        const transaction: Transaction = await sequelize.transaction();
        try {
          const marketing = await marketingDao.create(activityData, { transaction });

          if (rewardConfig) {
            await marketingRewardRuleDao.create({
              marketingId: marketing.id,
              ruleType: rewardConfig.ruleType,
              marketingType: plainTemplate.marketingType,
              ladderConfigs: rewardConfig.configs,
              rankingConfigs: rewardConfig.configs,
              fullAmountConfigs: rewardConfig.configs,
              isStackableWithCommission: rewardConfig.isStackableWithCommission,
              status: 1,
            } as any, { transaction });
          }

          await marketingTemplateDao.incrementUseCount(templateId);
          await transaction.commit();

          success++;
          details.push({
            templateId,
            templateName: plainTemplate.name,
            activityId: marketing.id,
            activityName: activityData.name,
            status: 'success',
          });

          await this.logActivityOperation({
            marketingId: marketing.id,
            templateId,
            operatorId: operator.id,
            operatorName: operator.name,
            operationType: ActivityOperationType.COPY_TEMPLATE,
            operationDetail: `从模板「${plainTemplate.name}」复制创建活动`,
            afterData: activityData,
            validationResults: [...validationResult.errors, ...validationResult.warnings, ...validationResult.infos],
          });
        } catch (dbError) {
          await transaction.rollback();
          throw dbError;
        }
      } catch (err: any) {
        failed++;
        const template = await marketingTemplateDao.findById(templateId);
        details.push({
          templateId,
          templateName: template?.name || '-',
          status: 'failed',
          reason: err.message || '操作失败',
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);

    return {
      total: params.templateIds.length,
      success,
      failed,
      details,
    };
  }

  public async batchCreateSimilarActivities(
    sourceActivityId: string,
    count: number,
    timeOffsetDays: number,
    operatorId: string
  ): Promise<BatchCreateResult> {
    const operator = await this.getOperatorInfo(operatorId);
    const sourceActivity = await marketingDao.findById(sourceActivityId);

    if (!sourceActivity) {
      throw new AppError('源活动不存在', BusinessCode.NOT_FOUND);
    }

    const sourceData = sourceActivity.get({ plain: true });
    const sourceRewardRule = await marketingRewardRuleDao.findByMarketingId(sourceActivityId);
    const details: BatchCreateResult['details'] = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < count; i++) {
      try {
        const startTime = dayjs(sourceData.startTime).add(i * timeOffsetDays, 'day').toDate();
        const endTime = dayjs(sourceData.endTime).add(i * timeOffsetDays, 'day').toDate();

        const timeConflict = await this.checkTimeConflict(startTime, endTime, undefined, sourceData.type);
        if (timeConflict.hasConflict) {
          details.push({
            templateId: sourceActivityId,
            templateName: sourceData.name,
            status: 'failed',
            reason: `第${i + 1}个活动与「${timeConflict.conflicts[0].activityName}」时间冲突`,
          });
          failed++;
          continue;
        }

        const activityData: any = {
          ...sourceData,
          name: `${sourceData.name}（${i + 1}期）`,
          code: this.generateActivityCode(),
          startTime,
          endTime,
          templateId: sourceData.templateId || sourceActivityId,
          createdBy: operator.id,
          status: MarketingStatus.DRAFT,
          id: undefined,
          submitToken: this.generateSubmitToken(),
          previewCount: 0,
          lastPreviewAt: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        };

        const validationResult = await this.validateActivityData(activityData);
        if (!validationResult.valid) {
          details.push({
            templateId: sourceActivityId,
            templateName: sourceData.name,
            status: 'failed',
            reason: `第${i + 1}个活动：${validationResult.errors.map(e => e.message).join('；')}`,
          });
          failed++;
          continue;
        }

        const transaction: Transaction = await sequelize.transaction();
        try {
          const marketing = await marketingDao.create(activityData, { transaction });

          if (sourceRewardRule) {
            await marketingRewardRuleDao.create({
              ...sourceRewardRule.get({ plain: true }),
              id: undefined,
              marketingId: marketing.id,
              createdAt: undefined,
              updatedAt: undefined,
              deletedAt: undefined,
            } as any, { transaction });
          }

          await transaction.commit();

          success++;
          details.push({
            templateId: sourceActivityId,
            templateName: sourceData.name,
            activityId: marketing.id,
            activityName: activityData.name,
            status: 'success',
          });

          await this.logActivityOperation({
            marketingId: marketing.id,
            operatorId: operator.id,
            operatorName: operator.name,
            operationType: ActivityOperationType.BATCH_CREATE,
            operationDetail: `从活动「${sourceData.name}」批量创建同类活动（第${i + 1}期）`,
            afterData: activityData,
          });
        } catch (dbError) {
          await transaction.rollback();
          throw dbError;
        }
      } catch (err: any) {
        failed++;
        details.push({
          templateId: sourceActivityId,
          templateName: sourceData.name,
          status: 'failed',
          reason: `第${i + 1}个活动：${err.message}`,
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);

    return {
      total: count,
      success,
      failed,
      details,
    };
  }

  public async batchUpdateActivityTimes(
    ids: string[],
    startTime: Date,
    endTime: Date,
    operatorId: string,
    autoAdjust: boolean = false
  ): Promise<BatchCreateResult> {
    const operator = await this.getOperatorInfo(operatorId);
    const details: BatchCreateResult['details'] = [];
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const activity = await marketingDao.findById(id);
        if (!activity) {
          details.push({
            templateId: id,
            templateName: '-',
            status: 'failed',
            reason: '活动不存在',
          });
          failed++;
          continue;
        }

        let actualStartTime = new Date(startTime);
        let actualEndTime = new Date(endTime);

        const timeConflict = await this.checkTimeConflict(actualStartTime, actualEndTime, id, activity.type);
        if (timeConflict.hasConflict && autoAdjust) {
          let adjusted = false;
          for (let i = 0; i < 30 && !adjusted; i++) {
            actualStartTime = dayjs(actualStartTime).add(1, 'day').toDate();
            actualEndTime = dayjs(actualEndTime).add(1, 'day').toDate();
            const newConflict = await this.checkTimeConflict(actualStartTime, actualEndTime, id, activity.type);
            if (!newConflict.hasConflict) {
              adjusted = true;
            }
          }
          if (!adjusted) {
            details.push({
              templateId: id,
              templateName: activity.name,
              status: 'failed',
              reason: '自动调整时间30天内仍存在冲突',
            });
            failed++;
            continue;
          }
        } else if (timeConflict.hasConflict) {
          details.push({
            templateId: id,
            templateName: activity.name,
            status: 'failed',
            reason: `与活动「${timeConflict.conflicts[0].activityName}」时间冲突`,
          });
          failed++;
          continue;
        }

        const beforeData = activity.get({ plain: true });
        await marketingDao.update({ startTime: actualStartTime, endTime: actualEndTime } as any, { where: { id } });

        const changeDiffs = [
          { field: 'startTime', oldValue: activity.startTime, newValue: actualStartTime },
          { field: 'endTime', oldValue: activity.endTime, newValue: actualEndTime },
        ];

        success++;
        details.push({
          templateId: id,
          templateName: activity.name,
          activityId: id,
          activityName: activity.name,
          status: 'success',
        });

        await this.logActivityOperation({
          marketingId: id,
          operatorId: operator.id,
          operatorName: operator.name,
          operationType: ActivityOperationType.BATCH_UPDATE,
          operationDetail: `批量更新活动时间`,
          beforeData,
          afterData: { ...beforeData, startTime: actualStartTime, endTime: actualEndTime },
          changeDiffs,
        });
      } catch (err: any) {
        failed++;
        const activity = await marketingDao.findById(id);
        details.push({
          templateId: id,
          templateName: activity?.name || '-',
          status: 'failed',
          reason: err.message || '操作失败',
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
    for (const id of ids) {
      await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${id}`);
    }

    return {
      total: ids.length,
      success,
      failed,
      details,
    };
  }

  public async updateActivitySort(
    updates: { id: string; sort: number }[],
    operatorId: string
  ): Promise<void> {
    const operator = await this.getOperatorInfo(operatorId);

    await marketingDao.updateSorts(updates);

    for (const update of updates) {
      await this.logActivityOperation({
        marketingId: update.id,
        operatorId: operator.id,
        operatorName: operator.name,
        operationType: ActivityOperationType.UPDATE_SORT,
        operationDetail: `调整活动排序为${update.sort}`,
      });
    }

    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
  }

  public async createTemplate(
    params: Omit<MarketingTemplateCreationAttributes, 'id' | 'useCount' | 'sort' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { operatorId: string }
  ): Promise<any> {
    const operator = await this.getOperatorInfo(params.operatorId);

    if (!params.code) {
      params.code = `TPL_${this.generateActivityCode('TPL')}`;
    }

    const codeExists = await marketingTemplateDao.existsByCode(params.code);
    if (codeExists) {
      throw new AppError('模板编码已存在', BusinessCode.ERROR);
    }

    const template = await marketingTemplateDao.create({
      ...params,
      createdBy: operator.id,
    });

    await this.logActivityOperation({
      templateId: template.id,
      operatorId: operator.id,
      operatorName: operator.name,
      operationType: ActivityOperationType.CREATE,
      operationDetail: `创建活动模板：${template.name}`,
      afterData: template.get({ plain: true }),
    });

    await CacheUtils.delPattern(`${CacheKey.MARKETING_TEMPLATE_LIST}*`);

    return this.getTemplateDetail(template.id);
  }

  public async getTemplateDetail(id: string): Promise<any> {
    const cacheKey = `${CacheKey.MARKETING_TEMPLATE_DETAIL}${id}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const template = await marketingTemplateDao.findById(id);
    if (!template) {
      throw new AppError('模板不存在', BusinessCode.NOT_FOUND);
    }

    const result = template.get({ plain: true });
    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  public async getTemplateList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    category?: any;
    marketingType?: MarketingType;
    isHot?: boolean;
    isRecommended?: boolean;
  }): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const cacheKey = `${CacheKey.MARKETING_TEMPLATE_LIST}${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<PaginationResult<any>>(cacheKey);
    if (cached) return cached;

    const { rows, count } = await marketingTemplateDao.findAllPaged(params);
    const result: PaginationResult<any> = {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async getActivityOperationLogs(
    marketingId: string,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await marketingActivityLogDao.findAllPaged({
      ...params,
      marketingId,
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getSubmitToken(): Promise<string> {
    return this.generateSubmitToken();
  }

  public async getActivityValidation(
    data: Partial<MarketingAttributes> & { rewardRule?: any },
    isUpdate: boolean = false,
    activityId?: string
  ): Promise<ActivityValidationResult> {
    const result = await this.validateActivityData(data, isUpdate, activityId);

    const cacheKey = `${CacheKey.MARKETING_VALIDATION_RESULT}${activityId || 'new'}`;
    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);

    return result;
  }

  public async getParticipationThresholdOptions(): Promise<{ type: string; label: string; description: string }[]> {
    return Object.values(ParticipationThresholdType).map(type => ({
      type,
      label: PARTICIPATION_THRESHOLD_LABELS[type],
      description: this.getThresholdDescription(type),
    }));
  }

  private getThresholdDescription(type: ParticipationThresholdType): string {
    const descriptions: Record<ParticipationThresholdType, string> = {
      [ParticipationThresholdType.LEVEL]: '只有达到指定推客等级的推客才能参与',
      [ParticipationThresholdType.TOTAL_ORDERS]: '累计订单数达到指定值的推客才能参与',
      [ParticipationThresholdType.TOTAL_AMOUNT]: '累计成交额达到指定值的推客才能参与',
      [ParticipationThresholdType.REGISTRATION_DAYS]: '注册天数达到指定值的推客才能参与',
      [ParticipationThresholdType.QUALIFICATION_VERIFIED]: '已完成资质认证的推客才能参与',
      [ParticipationThresholdType.SPECIFIC_PROMOTERS]: '只有指定的推客才能参与',
    };
    return descriptions[type] || '';
  }

  public async getRewardRuleTypeOptions(): Promise<{ type: string; label: string; description: string; mutuallyExclusive: string[] }[]> {
    return Object.values(RewardRuleType).map(type => ({
      type,
      label: REWARD_RULE_TYPE_LABELS[type],
      description: this.getRewardRuleDescription(type),
      mutuallyExclusive: this.getMutuallyExclusiveRules(type),
    }));
  }

  private getRewardRuleDescription(type: RewardRuleType): string {
    const descriptions: Record<RewardRuleType, string> = {
      [RewardRuleType.LADDER]: '根据累计成交额或订单数达到不同阶梯，享受不同奖励',
      [RewardRuleType.RANKING]: '根据活动期间的业绩排名，排名越高奖励越多',
      [RewardRuleType.FULL_AMOUNT]: '订单金额达到指定阈值，即可获得对应奖励',
    };
    return descriptions[type] || '';
  }

  private getMutuallyExclusiveRules(type: RewardRuleType): string[] {
    const exclusions: string[] = [];
    for (const exclusion of REWARD_RULE_MUTUAL_EXCLUSIONS) {
      if (exclusion.includes(type)) {
        exclusion.forEach(t => {
          if (t !== type && !exclusions.includes(REWARD_RULE_TYPE_LABELS[t])) {
            exclusions.push(REWARD_RULE_TYPE_LABELS[t]);
          }
        });
      }
    }
    return exclusions;
  }

  public async getMarketingTypeOptions(): Promise<{ type: string; label: string; description: string }[]> {
    const distributionTypes = [
      MarketingType.DISTRIBUTION_LADDER,
      MarketingType.DISTRIBUTION_RANKING,
      MarketingType.DISTRIBUTION_FULL_AMOUNT,
      MarketingType.DISTRIBUTION_NEW_USER,
      MarketingType.DISTRIBUTION_INVITE,
    ];

    return distributionTypes.map((type) => ({
      type,
      label: MARKETING_TYPE_LABELS[type],
      description: this.getMarketingTypeDescription(type),
    }));
  }

  private getMarketingTypeDescription(type: MarketingType): string {
    const descriptions: Record<MarketingType, string> = {
      [MarketingType.COUPON]: '优惠券营销活动',
      [MarketingType.DISCOUNT]: '折扣营销活动',
      [MarketingType.CASHBACK]: '返现营销活动',
      [MarketingType.REBATE]: '返利营销活动',
      [MarketingType.BONUS]: '奖金营销活动',
      [MarketingType.DISTRIBUTION_LADDER]: '按销售额阶梯递增的分销奖励活动，销售额越高奖励比例越高',
      [MarketingType.DISTRIBUTION_RANKING]: '按分销业绩排名的奖励活动，排名越靠前奖励越丰厚',
      [MarketingType.DISTRIBUTION_FULL_AMOUNT]: '达到指定销售额门槛即可获得对应奖励的分销活动',
      [MarketingType.DISTRIBUTION_NEW_USER]: '针对新用户注册并完成首单的分销奖励活动',
      [MarketingType.DISTRIBUTION_INVITE]: '邀请新用户加入分销体系的推荐奖励活动',
    };
    return descriptions[type] || '';
  }
}

export default new DistributionActivityService();