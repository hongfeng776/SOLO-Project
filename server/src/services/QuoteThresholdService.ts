import { Op } from 'sequelize';
import quoteThresholdDAO from '@dao/QuoteThresholdDAO';
import quoteThresholdHistoryDAO from '@dao/QuoteThresholdHistoryDAO';
import { db } from '@models/index';
import QuoteThreshold, { ThresholdType, ScopeType, ConfigStatus } from '@models/QuoteThreshold';
import QuoteThresholdHistory, { ChangeType } from '@models/QuoteThresholdHistory';
import { AppError } from '@middlewares/errorHandler';
import { CacheUtil } from '@utils/cache';

const ACTIVE_THRESHOLDS_CACHE_KEY = 'quote:thresholds:active';
const ACTIVE_THRESHOLDS_CACHE_TTL = 60;
const REQUIRED_PERMISSION = 'stock:threshold:manage';

export interface RangeValidationError {
  field: string;
  message: string;
  suggestion: string;
}

export interface RangeValidationResult {
  valid: boolean;
  errors: RangeValidationError[];
}

export interface PeriodValidationResult {
  valid: boolean;
  message?: string;
}

export interface ConflictDetail {
  type: string;
  message: string;
  level: 'warning' | 'error';
  similarConfig?: Record<string, unknown>;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
}

export interface ThresholdListParams {
  scopeType?: ScopeType;
  sector?: string;
  thresholdType?: ThresholdType;
  status?: ConfigStatus;
  page: number;
  pageSize: number;
}

export interface OperatorInfo {
  id: number;
  name: string;
}

export interface MatchScenario {
  scenarioName: string;
  matchScore: number;
  suggestion: string;
}

interface ActiveThreshold {
  id: number;
  threshold_type: ThresholdType;
  sector: string;
  min_value: number;
  max_value: number;
  warning_threshold: number;
  trigger_threshold: number;
  scope_type: ScopeType;
  config_status: ConfigStatus;
  version: number;
}

class QuoteThresholdService {
  async validatePermission(userId: number): Promise<boolean> {
    const userRoles = await db.UserRole.findAll({
      where: { user_id: userId },
      attributes: ['role_id'],
    });

    if (userRoles.length === 0) {
      return false;
    }

    const roleIds = userRoles.map((ur) => (ur as { role_id: number }).role_id);

    const rolePermissions = await db.RolePermission.findAll({
      where: { role_id: { [Op.in]: roleIds } },
      attributes: ['perm_id'],
    });

    if (rolePermissions.length === 0) {
      return false;
    }

    const permIds = rolePermissions.map((rp) => (rp as { perm_id: number }).perm_id);

    const permission = await db.Permission.findOne({
      where: {
        id: { [Op.in]: permIds },
        perm_code: REQUIRED_PERMISSION,
      },
    });

    return permission !== null;
  }

  async validateRange(
    type: ThresholdType,
    min: number,
    max: number,
    warn: number,
    trigger: number,
  ): Promise<RangeValidationResult> {
    const errors: RangeValidationError[] = [];

    if (warn >= trigger) {
      errors.push({
        field: 'warning_threshold',
        message: '预警阈值必须小于触发阈值',
        suggestion: '请确保 warning_threshold < trigger_threshold',
      });
    }

    if (min > max) {
      errors.push({
        field: 'min_value',
        message: '最小值不能大于最大值',
        suggestion: '请确保 min_value <= max_value',
      });
    }

    switch (type) {
      case 'change_rate': {
        if (min < 0 || min > 100) {
          errors.push({
            field: 'min_value',
            message: '涨跌幅最小值范围应为 0-100',
            suggestion: '请设置 0-100 之间的数值',
          });
        }
        if (max < 0 || max > 100) {
          errors.push({
            field: 'max_value',
            message: '涨跌幅最大值范围应为 0-100',
            suggestion: '请设置 0-100 之间的数值',
          });
        }
        if (max > 50) {
          errors.push({
            field: 'max_value',
            message: '涨跌幅极值超过50%，请确认是否合理',
            suggestion: '建议最大值不超过 50%',
          });
        }
        if (warn < 0 || warn > 100) {
          errors.push({
            field: 'warning_threshold',
            message: '预警阈值范围应为 0-100',
            suggestion: '请设置 0-100 之间的数值',
          });
        }
        if (trigger < 0 || trigger > 100) {
          errors.push({
            field: 'trigger_threshold',
            message: '触发阈值范围应为 0-100',
            suggestion: '请设置 0-100 之间的数值',
          });
        }
        break;
      }
      case 'volume': {
        if (min < 0) {
          errors.push({
            field: 'min_value',
            message: '成交量最小值不能为负',
            suggestion: '请设置大于等于 0 的数值',
          });
        }
        if (max < 0) {
          errors.push({
            field: 'max_value',
            message: '成交量最大值不能为负',
            suggestion: '请设置大于等于 0 的数值',
          });
        }
        if (warn < 0) {
          errors.push({
            field: 'warning_threshold',
            message: '预警阈值不能为负',
            suggestion: '请设置大于等于 0 的数值',
          });
        }
        if (trigger < 0) {
          errors.push({
            field: 'trigger_threshold',
            message: '触发阈值不能为负',
            suggestion: '请设置大于等于 0 的数值',
          });
        }
        break;
      }
      case 'turnover': {
        if (min < 0 || min > 100) {
          errors.push({
            field: 'min_value',
            message: '换手率最小值范围应为 0-100',
            suggestion: '请设置 0-100 之间的数值',
          });
        }
        if (max < 0 || max > 100) {
          errors.push({
            field: 'max_value',
            message: '换手率最大值范围应为 0-100',
            suggestion: '请设置 0-100 之间的数值',
          });
        }
        if (warn < 0 || warn > 100) {
          errors.push({
            field: 'warning_threshold',
            message: '预警阈值范围应为 0-100',
            suggestion: '请设置 0-100 之间的数值',
          });
        }
        if (trigger < 0 || trigger > 100) {
          errors.push({
            field: 'trigger_threshold',
            message: '触发阈值范围应为 0-100',
            suggestion: '请设置 0-100 之间的数值',
          });
        }
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async validateEffectivePeriod(
    start: Date,
    end: Date | null,
    isPermanent: boolean,
  ): Promise<PeriodValidationResult> {
    if (isPermanent) {
      if (end !== null) {
        return {
          valid: false,
          message: '永久配置不应设置结束时间',
        };
      }
      return { valid: true };
    }

    if (end === null) {
      return {
        valid: false,
        message: '临时配置必须设置结束时间',
      };
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime())) {
      return {
        valid: false,
        message: '生效开始时间格式不正确',
      };
    }

    if (isNaN(endDate.getTime())) {
      return {
        valid: false,
        message: '生效结束时间格式不正确',
      };
    }

    if (endDate <= startDate) {
      return {
        valid: false,
        message: '结束时间必须晚于开始时间',
      };
    }

    return { valid: true };
  }

  async getThresholdList(params: ThresholdListParams): Promise<{
    list: QuoteThreshold[];
    total: number;
    stats: Record<string, number>;
  }> {
    const { scopeType, sector, thresholdType, status, page, pageSize } = params;

    const where: Record<string, unknown> = {};

    if (scopeType) {
      where.scope_type = scopeType;
    }
    if (sector) {
      where.sector = sector;
    }
    if (thresholdType) {
      where.threshold_type = thresholdType;
    }
    if (status) {
      where.config_status = status;
    }

    const { rows, count } = await quoteThresholdDAO.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [
        ['scope_type', 'ASC'],
        ['sector', 'ASC'],
        ['threshold_type', 'ASC'],
        ['version', 'DESC'],
      ],
    });

    const allRecords = await quoteThresholdDAO.findAll({ where });
    const stats: Record<string, number> = {
      total: count,
      permanent: 0,
      temporary: 0,
      expired: 0,
      global: 0,
      sector: 0,
    };

    for (const record of allRecords) {
      stats[record.config_status] = (stats[record.config_status] || 0) + 1;
      stats[record.scope_type] = (stats[record.scope_type] || 0) + 1;
    }

    return { list: rows, total: count, stats };
  }

  async getActiveThresholds(sectors?: string[]): Promise<Record<string, ActiveThreshold>> {
    const cacheKey = sectors
      ? `${ACTIVE_THRESHOLDS_CACHE_KEY}:${sectors.sort().join(',')}`
      : ACTIVE_THRESHOLDS_CACHE_KEY;

    try {
      return await CacheUtil.getOrSet<Record<string, ActiveThreshold>>(
        cacheKey,
        ACTIVE_THRESHOLDS_CACHE_TTL,
        async () => this.fetchActiveThresholds(sectors),
      );
    } catch {
      // TODO: Redis unavailable, fallback to direct DB query without caching
      return this.fetchActiveThresholds(sectors);
    }
  }

  private async fetchActiveThresholds(sectors?: string[]): Promise<Record<string, ActiveThreshold>> {
    const result: Record<string, ActiveThreshold> = {};
    const now = new Date();

    const where: Record<string, unknown> = {
      config_status: { [Op.ne]: 'expired' },
      effective_start: { [Op.lte]: now },
      [Op.or]: [
        { effective_end: null },
        { effective_end: { [Op.gte]: now } },
      ],
    };

    if (sectors && sectors.length > 0) {
      where.sector = { [Op.in]: [...sectors, 'GLOBAL'] };
    }

    const allActive = await quoteThresholdDAO.findAll({
      where,
      order: [
        ['scope_type', 'ASC'],
        ['sector', 'ASC'],
        ['threshold_type', 'ASC'],
        ['version', 'DESC'],
      ],
    });

    const seen = new Set<string>();
    for (const threshold of allActive) {
      const key = `${threshold.sector}_${threshold.threshold_type}`;
      if (!seen.has(key)) {
        seen.add(key);
        result[key] = {
          id: threshold.id,
          threshold_type: threshold.threshold_type,
          sector: threshold.sector,
          min_value: Number(threshold.min_value),
          max_value: Number(threshold.max_value),
          warning_threshold: Number(threshold.warning_threshold),
          trigger_threshold: Number(threshold.trigger_threshold),
          scope_type: threshold.scope_type,
          config_status: threshold.config_status,
          version: threshold.version,
        };
      }
    }

    return result;
  }

  async createThreshold(
    data: {
      threshold_type: ThresholdType;
      sector: string;
      min_value: number;
      max_value: number;
      warning_threshold: number;
      trigger_threshold: number;
      scope_type: ScopeType;
      config_status: ConfigStatus;
      effective_start: Date;
      effective_end: Date | null;
      remark?: string;
    },
    operator: OperatorInfo,
  ): Promise<{ threshold: QuoteThreshold; history: QuoteThresholdHistory }> {
    const transaction = await db.sequelize.transaction();

    try {
      const hasPermission = await this.validatePermission(operator.id);
      if (!hasPermission) {
        throw new AppError(403, '无权限进行此操作');
      }

      const rangeValidation = await this.validateRange(
        data.threshold_type,
        data.min_value,
        data.max_value,
        data.warning_threshold,
        data.trigger_threshold,
      );
      if (!rangeValidation.valid) {
        throw new AppError(400, `区间校验失败: ${rangeValidation.errors.map((e) => e.message).join('; ')}`);
      }

      const periodValidation = await this.validateEffectivePeriod(
        data.effective_start,
        data.effective_end,
        data.config_status === 'permanent',
      );
      if (!periodValidation.valid) {
        throw new AppError(400, periodValidation.message || '生效时段校验失败');
      }

      const conflictResult = await this.checkConflictWithHistory(
        data.threshold_type,
        data.sector,
        data.min_value,
        data.max_value,
        data.warning_threshold,
        data.trigger_threshold,
      );

      const version = await quoteThresholdDAO.findLatestVersion(
        data.threshold_type,
        data.scope_type,
        data.sector,
      );

      const threshold = await db.QuoteThreshold.create(
        {
          ...data,
          version,
          created_by: operator.id,
          operator: operator.name,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction },
      );

      const history = await db.QuoteThresholdHistory.create(
        {
          threshold_id: threshold.id,
          change_type: 'create' as ChangeType,
          before_snapshot: null,
          after_snapshot: threshold.toJSON() as Record<string, unknown>,
          conflict_check_result: conflictResult as unknown as Record<string, unknown>,
          operator_id: operator.id,
          operator_name: operator.name,
          remark: data.remark || '创建阈值配置',
          created_at: new Date(),
        },
        { transaction },
      );

      await transaction.commit();

      await CacheUtil.delByPattern(`${ACTIVE_THRESHOLDS_CACHE_KEY}*`);

      return { threshold, history };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchUpdateThresholds(
    ids: number[],
    patch: Partial<{
      min_value: number;
      max_value: number;
      warning_threshold: number;
      trigger_threshold: number;
      config_status: ConfigStatus;
      effective_start: Date;
      effective_end: Date | null;
      remark: string;
    }>,
    operator: OperatorInfo,
  ): Promise<{ updated: number; conflicts: number; errors: Array<{ id: number; message: string }> }> {
    const transaction = await db.sequelize.transaction();

    try {
      const hasPermission = await this.validatePermission(operator.id);
      if (!hasPermission) {
        throw new AppError(403, '无权限进行此操作');
      }

      let updated = 0;
      let conflicts = 0;
      const errors: Array<{ id: number; message: string }> = [];

      for (const id of ids) {
        try {
          const existing = await quoteThresholdDAO.findById(id);
          if (!existing) {
            errors.push({ id, message: '阈值配置不存在' });
            continue;
          }

          const merged = {
            threshold_type: existing.threshold_type,
            min_value: patch.min_value !== undefined ? patch.min_value : Number(existing.min_value),
            max_value: patch.max_value !== undefined ? patch.max_value : Number(existing.max_value),
            warning_threshold:
              patch.warning_threshold !== undefined
                ? patch.warning_threshold
                : Number(existing.warning_threshold),
            trigger_threshold:
              patch.trigger_threshold !== undefined
                ? patch.trigger_threshold
                : Number(existing.trigger_threshold),
          };

          const rangeValidation = await this.validateRange(
            merged.threshold_type,
            merged.min_value,
            merged.max_value,
            merged.warning_threshold,
            merged.trigger_threshold,
          );
          if (!rangeValidation.valid) {
            errors.push({ id, message: rangeValidation.errors.map((e) => e.message).join('; ') });
            continue;
          }

          const conflictResult = await this.checkConflictWithHistory(
            existing.threshold_type,
            existing.sector,
            merged.min_value,
            merged.max_value,
            merged.warning_threshold,
            merged.trigger_threshold,
            id,
          );
          if (conflictResult.hasConflict) {
            conflicts++;
          }

          const beforeSnapshot = existing.toJSON() as Record<string, unknown>;

          const updateData: Record<string, unknown> = {
            updated_at: new Date(),
          };
          if (patch.min_value !== undefined) updateData.min_value = patch.min_value;
          if (patch.max_value !== undefined) updateData.max_value = patch.max_value;
          if (patch.warning_threshold !== undefined)
            updateData.warning_threshold = patch.warning_threshold;
          if (patch.trigger_threshold !== undefined)
            updateData.trigger_threshold = patch.trigger_threshold;
          if (patch.config_status !== undefined) updateData.config_status = patch.config_status;
          if (patch.effective_start !== undefined) updateData.effective_start = patch.effective_start;
          if (patch.effective_end !== undefined) updateData.effective_end = patch.effective_end;

          const [affectedCount] = await db.QuoteThreshold.update(updateData, {
            where: { id },
            transaction,
          });

          if (affectedCount > 0) {
            updated++;

            const updatedThreshold = await quoteThresholdDAO.findById(id);
            await db.QuoteThresholdHistory.create(
              {
                threshold_id: id,
                change_type: 'update' as ChangeType,
                before_snapshot: beforeSnapshot,
                after_snapshot: updatedThreshold
                  ? (updatedThreshold.toJSON() as Record<string, unknown>)
                  : null,
                conflict_check_result: conflictResult as unknown as Record<string, unknown>,
                operator_id: operator.id,
                operator_name: operator.name,
                remark: patch.remark || '批量更新阈值配置',
                created_at: new Date(),
              },
              { transaction },
            );
          }
        } catch (err) {
          errors.push({
            id,
            message: err instanceof Error ? err.message : '未知错误',
          });
        }
      }

      await transaction.commit();

      await CacheUtil.delByPattern(`${ACTIVE_THRESHOLDS_CACHE_KEY}*`);

      return { updated, conflicts, errors };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateThreshold(
    id: number,
    data: Partial<{
      threshold_type: ThresholdType;
      sector: string;
      min_value: number;
      max_value: number;
      warning_threshold: number;
      trigger_threshold: number;
      scope_type: ScopeType;
      config_status: ConfigStatus;
      effective_start: Date;
      effective_end: Date | null;
      remark: string;
    }>,
    operator: OperatorInfo,
  ): Promise<{ threshold: QuoteThreshold; history: QuoteThresholdHistory; conflicts: ConflictDetail[] }> {
    const transaction = await db.sequelize.transaction();

    try {
      const hasPermission = await this.validatePermission(operator.id);
      if (!hasPermission) {
        throw new AppError(403, '无权限进行此操作');
      }

      const existing = await quoteThresholdDAO.findById(id);
      if (!existing) {
        throw new AppError(404, '阈值配置不存在');
      }

      const merged = {
        threshold_type: data.threshold_type || existing.threshold_type,
        sector: data.sector || existing.sector,
        min_value: data.min_value !== undefined ? data.min_value : Number(existing.min_value),
        max_value: data.max_value !== undefined ? data.max_value : Number(existing.max_value),
        warning_threshold:
          data.warning_threshold !== undefined
            ? data.warning_threshold
            : Number(existing.warning_threshold),
        trigger_threshold:
          data.trigger_threshold !== undefined
            ? data.trigger_threshold
            : Number(existing.trigger_threshold),
        config_status: data.config_status || existing.config_status,
        effective_start: data.effective_start || existing.effective_start,
        effective_end: data.effective_end !== undefined ? data.effective_end : existing.effective_end,
      };

      const rangeValidation = await this.validateRange(
        merged.threshold_type,
        merged.min_value,
        merged.max_value,
        merged.warning_threshold,
        merged.trigger_threshold,
      );
      if (!rangeValidation.valid) {
        throw new AppError(400, `区间校验失败: ${rangeValidation.errors.map((e) => e.message).join('; ')}`);
      }

      const periodValidation = await this.validateEffectivePeriod(
        merged.effective_start,
        merged.effective_end,
        merged.config_status === 'permanent',
      );
      if (!periodValidation.valid) {
        throw new AppError(400, periodValidation.message || '生效时段校验失败');
      }

      const conflictResult = await this.checkConflictWithHistory(
        merged.threshold_type,
        merged.sector,
        merged.min_value,
        merged.max_value,
        merged.warning_threshold,
        merged.trigger_threshold,
        id,
      );

      const beforeSnapshot = existing.toJSON() as Record<string, unknown>;

      const updateData: Record<string, unknown> = {
        updated_at: new Date(),
      };
      if (data.threshold_type !== undefined) updateData.threshold_type = data.threshold_type;
      if (data.sector !== undefined) updateData.sector = data.sector;
      if (data.min_value !== undefined) updateData.min_value = data.min_value;
      if (data.max_value !== undefined) updateData.max_value = data.max_value;
      if (data.warning_threshold !== undefined)
        updateData.warning_threshold = data.warning_threshold;
      if (data.trigger_threshold !== undefined)
        updateData.trigger_threshold = data.trigger_threshold;
      if (data.scope_type !== undefined) updateData.scope_type = data.scope_type;
      if (data.config_status !== undefined) updateData.config_status = data.config_status;
      if (data.effective_start !== undefined) updateData.effective_start = data.effective_start;
      if (data.effective_end !== undefined) updateData.effective_end = data.effective_end;

      await db.QuoteThreshold.update(updateData, {
        where: { id },
        transaction,
      });

      const updatedThreshold = await quoteThresholdDAO.findById(id);
      if (!updatedThreshold) {
        throw new AppError(500, '更新后无法获取阈值配置');
      }

      const history = await db.QuoteThresholdHistory.create(
        {
          threshold_id: id,
          change_type: 'update' as ChangeType,
          before_snapshot: beforeSnapshot,
          after_snapshot: updatedThreshold.toJSON() as Record<string, unknown>,
          conflict_check_result: conflictResult as unknown as Record<string, unknown>,
          operator_id: operator.id,
          operator_name: operator.name,
          remark: data.remark || '更新阈值配置',
          created_at: new Date(),
        },
        { transaction },
      );

      await transaction.commit();

      await CacheUtil.delByPattern(`${ACTIVE_THRESHOLDS_CACHE_KEY}*`);

      return {
        threshold: updatedThreshold,
        history,
        conflicts: conflictResult.conflicts,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteThreshold(id: number, operator: OperatorInfo): Promise<boolean> {
    const transaction = await db.sequelize.transaction();

    try {
      const hasPermission = await this.validatePermission(operator.id);
      if (!hasPermission) {
        throw new AppError(403, '无权限进行此操作');
      }

      const existing = await quoteThresholdDAO.findById(id);
      if (!existing) {
        throw new AppError(404, '阈值配置不存在');
      }

      const beforeSnapshot = existing.toJSON() as Record<string, unknown>;

      await db.QuoteThresholdHistory.create(
        {
          threshold_id: id,
          change_type: 'delete' as ChangeType,
          before_snapshot: beforeSnapshot,
          after_snapshot: null,
          conflict_check_result: null,
          operator_id: operator.id,
          operator_name: operator.name,
          remark: '删除阈值配置',
          created_at: new Date(),
        },
        { transaction },
      );

      await db.QuoteThreshold.destroy({
        where: { id },
        transaction,
      });

      await transaction.commit();

      await CacheUtil.delByPattern(`${ACTIVE_THRESHOLDS_CACHE_KEY}*`);

      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getThresholdHistory(
    thresholdId: number,
    days: number = 90,
  ): Promise<{
    list: QuoteThresholdHistory[];
    stats: {
      changeTypeDist: Record<ChangeType, number>;
      operatorDist: Record<string, number>;
      avgInterval: number;
    };
  }> {
    const threshold = await quoteThresholdDAO.findById(thresholdId);
    if (!threshold) {
      throw new AppError(404, '阈值配置不存在');
    }

    const list = await quoteThresholdHistoryDAO.findByThresholdId(thresholdId, days);
    const stats = await quoteThresholdHistoryDAO.getStatsByThresholdId(thresholdId, days);

    return { list, stats };
  }

  async checkConflictWithHistory(
    type: ThresholdType,
    sector: string,
    min: number,
    max: number,
    warn: number,
    trigger: number,
    excludeId?: number,
  ): Promise<ConflictCheckResult> {
    const conflicts: ConflictDetail[] = [];

    if (warn >= trigger) {
      conflicts.push({
        type: 'logic_conflict',
        message: '预警阈值不能大于等于触发阈值',
        level: 'error',
      });
    }

    if (min > max) {
      conflicts.push({
        type: 'logic_conflict',
        message: '最小值不能大于最大值',
        level: 'error',
      });
    }

    if (type === 'change_rate' && max > 50) {
      conflicts.push({
        type: 'extreme_value',
        message: `涨跌幅最大值 ${max}% 超过极值 50%`,
        level: 'error',
      });
    }

    const overlapConflicts = await quoteThresholdDAO.checkConflicts(type, sector, min, max, excludeId);
    for (const overlap of overlapConflicts) {
      conflicts.push({
        type: 'range_overlap',
        message: `与现有配置(ID:${overlap.id}, 版本:${overlap.version})的数值区间存在重叠`,
        level: 'warning',
        similarConfig: overlap.toJSON() as Record<string, unknown>,
      });
    }

    const recentHistory = await quoteThresholdHistoryDAO.findRecentByTypeAndSector(type, sector, 24);
    for (const history of recentHistory) {
      const snapshot = history.after_snapshot;
      if (snapshot && typeof snapshot === 'object') {
        const snapWarn = Number((snapshot as { warning_threshold?: number }).warning_threshold || 0);
        const snapTrigger = Number((snapshot as { trigger_threshold?: number }).trigger_threshold || 0);

        if (snapWarn > 0 && Math.abs(warn - snapWarn) / snapWarn > 0.5) {
          conflicts.push({
            type: 'historical_drift',
            message: `预警阈值与24小时内历史配置差异超过50% (历史:${snapWarn}, 当前:${warn})`,
            level: 'warning',
            similarConfig: snapshot,
          });
        }

        if (snapTrigger > 0 && Math.abs(trigger - snapTrigger) / snapTrigger > 0.5) {
          conflicts.push({
            type: 'historical_drift',
            message: `触发阈值与24小时内历史配置差异超过50% (历史:${snapTrigger}, 当前:${trigger})`,
            level: 'warning',
            similarConfig: snapshot,
          });
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  async expireTemporaryThresholds(): Promise<number> {
    const transaction = await db.sequelize.transaction();

    try {
      const expiredList = await quoteThresholdDAO.findExpiredTemporary();
      let expiredCount = 0;

      for (const threshold of expiredList) {
        const beforeSnapshot = threshold.toJSON() as Record<string, unknown>;

        const [affectedCount] = await db.QuoteThreshold.update(
          {
            config_status: 'expired' as ConfigStatus,
            updated_at: new Date(),
          },
          {
            where: { id: threshold.id },
            transaction,
          },
        );

        if (affectedCount > 0) {
          expiredCount++;

          await db.QuoteThresholdHistory.create(
            {
              threshold_id: threshold.id,
              change_type: 'expire' as ChangeType,
              before_snapshot: beforeSnapshot,
              after_snapshot: {
                ...beforeSnapshot,
                config_status: 'expired',
              },
              conflict_check_result: null,
              operator_id: 0,
              operator_name: 'system',
              remark: '系统自动过期临时阈值配置',
              created_at: new Date(),
            },
            { transaction },
          );
        }
      }

      await transaction.commit();

      if (expiredCount > 0) {
        await CacheUtil.delByPattern(`${ACTIVE_THRESHOLDS_CACHE_KEY}*`);
      }

      return expiredCount;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getMatchingScenarios(
    stockSector: string,
    stockVolatility: number,
  ): Promise<MatchScenario[]> {
    const scenarios: MatchScenario[] = [];
    const activeThresholds = await this.getActiveThresholds([stockSector, 'GLOBAL']);

    const types: ThresholdType[] = ['change_rate', 'volume', 'turnover'];

    for (const type of types) {
      const sectorKey = `${stockSector}_${type}`;
      const globalKey = `GLOBAL_${type}`;
      const threshold = activeThresholds[sectorKey] || activeThresholds[globalKey];

      if (threshold) {
        const inRange =
          stockVolatility >= Number(threshold.min_value) &&
          stockVolatility <= Number(threshold.max_value);
        const aboveWarn = stockVolatility >= Number(threshold.warning_threshold);
        const aboveTrigger = stockVolatility >= Number(threshold.trigger_threshold);

        let matchScore = 0;
        let suggestion = '';
        const scenarioName = this.getScenarioName(type);

        if (inRange) {
          matchScore += 30;
        }
        if (aboveWarn) {
          matchScore += 30;
        }
        if (aboveTrigger) {
          matchScore += 40;
        }

        if (aboveTrigger) {
          suggestion = `${scenarioName}已触发阈值(${stockVolatility} >= ${threshold.trigger_threshold})，建议立即介入风控`;
        } else if (aboveWarn) {
          suggestion = `${scenarioName}已达预警线(${stockVolatility} >= ${threshold.warning_threshold})，建议密切关注`;
        } else if (inRange) {
          suggestion = `${scenarioName}处于正常区间内，持续监控`;
        } else {
          suggestion = `${scenarioName}未进入监控区间`;
          matchScore = Math.max(0, matchScore - 20);
        }

        scenarios.push({
          scenarioName,
          matchScore,
          suggestion,
        });
      }
    }

    return scenarios.sort((a, b) => b.matchScore - a.matchScore);
  }

  private getScenarioName(type: ThresholdType): string {
    switch (type) {
      case 'change_rate':
        return '涨跌幅监控';
      case 'volume':
        return '成交量监控';
      case 'turnover':
        return '换手率监控';
      default:
        return type;
    }
  }
}

export default new QuoteThresholdService();
