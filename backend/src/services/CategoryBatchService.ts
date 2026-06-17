import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';

export interface BatchOperationResult {
  total: number;
  success: number;
  fail: number;
  progress: number;
  failedItems?: Array<{ id: number; reason: string }>;
}

export interface SortItem {
  id: number;
  sort: number;
}

export interface MoveItem {
  id: number;
  target_parent_id: number;
}

export type ProgressCallback = (progress: number, processed: number, total: number) => void;

const OPERATOR_ROLE_NORMAL = 2;

class CategoryBatchService {
  private readonly categoryDao = daos.categoryDao;
  private readonly categoryLogDao = daos.categoryLogDao;

  async batchToggleStatus(
    ids: number[],
    targetStatus: number,
    operatorId: number,
    operatorRole: number,
    processCallback?: ProgressCallback,
    operatorType: number = 1
  ): Promise<BatchOperationResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的类目', 400);
    }

    const result: BatchOperationResult = {
      total: 0,
      success: 0,
      fail: 0,
      progress: 0,
      failedItems: [],
    };

    const allIds: number[] = [];
    for (const id of ids) {
      allIds.push(id);
      const descendants = await this.categoryDao.findAllIdsDescendants(id);
      allIds.push(...descendants);
    }
    const uniqueIds = [...new Set(allIds)];
    result.total = uniqueIds.length;

    let processed = 0;

    for (const id of uniqueIds) {
      try {
        const category = await this.categoryDao.findById(id);
        if (!category) {
          result.fail++;
          result.failedItems!.push({ id, reason: '类目不存在' });
          processed++;
          this.updateProgress(result, processed, processCallback);
          continue;
        }

        if (operatorRole === OPERATOR_ROLE_NORMAL && (category.level ?? 1) === 1) {
          result.fail++;
          result.failedItems!.push({ id, reason: '普通运维仅可操作level>=2的类目' });
          processed++;
          this.updateProgress(result, processed, processCallback);
          continue;
        }

        if (targetStatus === 0 && category.status === 0) {
          result.fail++;
          result.failedItems!.push({ id, reason: '类目已禁用' });
          processed++;
          this.updateProgress(result, processed, processCallback);
          continue;
        }

        if (targetStatus === 1 && category.status === 1) {
          result.fail++;
          result.failedItems!.push({ id, reason: '类目已启用' });
          processed++;
          this.updateProgress(result, processed, processCallback);
          continue;
        }

        const oldData = { status: category.status };
        await this.categoryDao.update(id, { status: targetStatus, updated_by: operatorId } as any);
        await this.categoryLogDao.create({
          category_id: id,
          operator_id: operatorId,
          operator_type: operatorType,
          action: targetStatus === 1 ? 'enable' : 'disable',
          old_data_json: oldData,
          new_data_json: { status: targetStatus },
          changed_fields: ['status'],
        } as any);

        result.success++;
      } catch (error) {
        result.fail++;
        result.failedItems!.push({
          id,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }

      processed++;
      this.updateProgress(result, processed, processCallback);
    }

    return result;
  }

  async batchSort(
    sortList: SortItem[],
    operatorId: number,
    operatorRole: number,
    operatorType: number = 1
  ): Promise<BatchOperationResult> {
    if (!sortList || sortList.length === 0) {
      throw new AppError('请提供排序数据', 400);
    }

    const result: BatchOperationResult = {
      total: sortList.length,
      success: 0,
      fail: 0,
      progress: 100,
      failedItems: [],
    };

    for (const item of sortList) {
      try {
        const category = await this.categoryDao.findById(item.id);
        if (!category) {
          result.fail++;
          result.failedItems!.push({ id: item.id, reason: '类目不存在' });
          continue;
        }

        if (operatorRole === OPERATOR_ROLE_NORMAL && (category.level ?? 1) === 1) {
          result.fail++;
          result.failedItems!.push({ id: item.id, reason: '普通运维仅可操作level>=2的类目' });
          continue;
        }

        const oldData = { sort: category.sort };
        await this.categoryDao.update(item.id, { sort: item.sort, updated_by: operatorId } as any);
        await this.categoryLogDao.create({
          category_id: item.id,
          operator_id: operatorId,
          operator_type: operatorType,
          action: 'sort',
          old_data_json: oldData,
          new_data_json: { sort: item.sort },
          changed_fields: ['sort'],
        } as any);

        result.success++;
      } catch (error) {
        result.fail++;
        result.failedItems!.push({
          id: item.id,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return result;
  }

  async batchMove(
    moveList: MoveItem[],
    operatorId: number,
    operatorRole: number,
    operatorType: number = 1
  ): Promise<BatchOperationResult> {
    if (!moveList || moveList.length === 0) {
      throw new AppError('请提供移动数据', 400);
    }

    const result: BatchOperationResult = {
      total: moveList.length,
      success: 0,
      fail: 0,
      progress: 100,
      failedItems: [],
    };

    for (const item of moveList) {
      try {
        const category = await this.categoryDao.findById(item.id);
        if (!category) {
          result.fail++;
          result.failedItems!.push({ id: item.id, reason: '类目不存在' });
          continue;
        }

        if (operatorRole === OPERATOR_ROLE_NORMAL && (category.level ?? 1) === 1) {
          result.fail++;
          result.failedItems!.push({ id: item.id, reason: '普通运维仅可操作level>=2的类目' });
          continue;
        }

        const targetParent = item.target_parent_id > 0
          ? await this.categoryDao.findById(item.target_parent_id)
          : null;

        if (item.target_parent_id > 0 && !targetParent) {
          result.fail++;
          result.failedItems!.push({ id: item.id, reason: '目标父级类目不存在' });
          continue;
        }

        const newLevel = targetParent ? (targetParent.level ?? 1) + 1 : 1;
        if (newLevel > 3) {
          result.fail++;
          result.failedItems!.push({ id: item.id, reason: '移动后层级超限，最多3级' });
          continue;
        }

        if (item.target_parent_id === item.id) {
          result.fail++;
          result.failedItems!.push({ id: item.id, reason: '不能将类目移动到自身下' });
          continue;
        }

        const descendants = await this.categoryDao.findAllIdsDescendants(item.id);
        if (descendants.includes(item.target_parent_id)) {
          result.fail++;
          result.failedItems!.push({ id: item.id, reason: '不能将类目移动到其子级下' });
          continue;
        }

        const oldData = { parent_id: category.parent_id, level: category.level };
        await this.categoryDao.update(item.id, {
          parent_id: item.target_parent_id,
          level: newLevel,
          updated_by: operatorId,
        } as any);
        await this.categoryLogDao.create({
          category_id: item.id,
          operator_id: operatorId,
          operator_type: operatorType,
          action: 'move',
          old_data_json: oldData,
          new_data_json: { parent_id: item.target_parent_id, level: newLevel },
          changed_fields: ['parent_id', 'level'],
        } as any);

        await this.updateDescendantLevels(item.id, newLevel, operatorId);

        const oldParentId = category.parent_id;
        if (oldParentId && oldParentId > 0) {
          const oldParentChildren = await this.categoryDao.findByParentId(oldParentId);
          await this.categoryDao.updateHasChildren(oldParentId, oldParentChildren.length > 0 ? 1 : 0);
        }
        if (item.target_parent_id > 0) {
          await this.categoryDao.updateHasChildren(item.target_parent_id, 1);
        }

        result.success++;
      } catch (error) {
        result.fail++;
        result.failedItems!.push({
          id: item.id,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return result;
  }

  private async updateDescendantLevels(
    parentId: number,
    parentLevel: number,
    operatorId: number
  ): Promise<void> {
    const children = await this.categoryDao.findByParentId(parentId);
    for (const child of children) {
      const newLevel = parentLevel + 1;
      if (newLevel !== child.level) {
        await this.categoryDao.update(child.id, { level: newLevel, updated_by: operatorId } as any);
      }
      await this.updateDescendantLevels(child.id, newLevel, operatorId);
    }
  }

  private updateProgress(
    result: BatchOperationResult,
    processed: number,
    callback?: ProgressCallback
  ): void {
    result.progress = result.total > 0 ? Math.round((processed / result.total) * 100) : 100;
    if (callback) {
      callback(result.progress, processed, result.total);
    }
  }
}

export const categoryBatchService = new CategoryBatchService();
export default CategoryBatchService;
