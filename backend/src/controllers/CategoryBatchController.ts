import { Request, Response } from 'express';
import {
  categoryBatchService,
  SortItem,
  MoveItem,
  ProgressCallback,
} from '../services/CategoryBatchService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const batchToggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const { ids, target_status, operator_id, operator_role, operator_type } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要操作的类目');
    return;
  }

  if (target_status === undefined) {
    badRequest(res, '缺少目标状态');
    return;
  }

  if (operator_id === undefined) {
    badRequest(res, '缺少操作人ID');
    return;
  }

  const parsedIds = ids.map((id: string | number) => parseInt(String(id), 10));
  const targetStatus = parseInt(String(target_status), 10);
  const operatorId = parseInt(operator_id, 10);
  const operatorRole = operator_role !== undefined ? parseInt(operator_role, 10) : 1;
  const operatorType = operator_type !== undefined ? parseInt(operator_type, 10) : 1;

  const progressEvents: Array<{ progress: number; processed: number; total: number }> = [];
  const progressCallback: ProgressCallback = (progress, processed, total) => {
    progressEvents.push({ progress, processed, total });
  };

  const result = await categoryBatchService.batchToggleStatus(
    parsedIds,
    targetStatus,
    operatorId,
    operatorRole,
    progressCallback,
    operatorType
  );

  ok(res, result, `批量${targetStatus === 1 ? '启用' : '禁用'}完成：成功${result.success}条，失败${result.fail}条`);
});

export const batchSort = asyncHandler(async (req: Request, res: Response) => {
  const { sort_list, operator_id, operator_role, operator_type } = req.body;

  if (!sort_list || !Array.isArray(sort_list) || sort_list.length === 0) {
    badRequest(res, '请提供排序数据');
    return;
  }

  if (operator_id === undefined) {
    badRequest(res, '缺少操作人ID');
    return;
  }

  const sortList: SortItem[] = sort_list.map((item: { id: string | number; sort: string | number }) => ({
    id: parseInt(String(item.id), 10),
    sort: parseInt(String(item.sort), 10),
  }));
  const operatorId = parseInt(operator_id, 10);
  const operatorRole = operator_role !== undefined ? parseInt(operator_role, 10) : 1;
  const operatorType = operator_type !== undefined ? parseInt(operator_type, 10) : 1;

  const result = await categoryBatchService.batchSort(sortList, operatorId, operatorRole, operatorType);
  ok(res, result, `批量排序完成：成功${result.success}条，失败${result.fail}条`);
});

export const batchMove = asyncHandler(async (req: Request, res: Response) => {
  const { move_list, operator_id, operator_role, operator_type } = req.body;

  if (!move_list || !Array.isArray(move_list) || move_list.length === 0) {
    badRequest(res, '请提供移动数据');
    return;
  }

  if (operator_id === undefined) {
    badRequest(res, '缺少操作人ID');
    return;
  }

  const moveList: MoveItem[] = move_list.map((item: { id: string | number; target_parent_id: string | number }) => ({
    id: parseInt(String(item.id), 10),
    target_parent_id: parseInt(String(item.target_parent_id), 10),
  }));
  const operatorId = parseInt(operator_id, 10);
  const operatorRole = operator_role !== undefined ? parseInt(operator_role, 10) : 1;
  const operatorType = operator_type !== undefined ? parseInt(operator_type, 10) : 1;

  const result = await categoryBatchService.batchMove(moveList, operatorId, operatorRole, operatorType);
  ok(res, result, `批量移动完成：成功${result.success}条，失败${result.fail}条`);
});

export const getBatchAbility = asyncHandler(async (req: Request, res: Response) => {
  const { ids, operator_role } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择类目');
    return;
  }

  const { daos } = await import('../dao');
  const parsedIds = ids.map((id: string | number) => parseInt(String(id), 10));
  const operatorRole = operator_role !== undefined ? parseInt(operator_role, 10) : 1;
  const categories = await daos.categoryDao.findByIds(parsedIds);

  const abilities = categories.map((cat) => {
    const reasons: string[] = [];
    let canEnable = true;
    let canDisable = true;
    let canSort = true;
    let canMove = true;
    let canDelete = true;

    if (operatorRole === 2 && (cat.level ?? 1) === 1) {
      canEnable = false;
      canDisable = false;
      canSort = false;
      canMove = false;
      canDelete = false;
      reasons.push('普通运维仅可操作level>=2的类目');
    }

    if (cat.status === 1) {
      canEnable = false;
    }
    if (cat.status === 0) {
      canDisable = false;
    }
    if ((cat.product_count ?? 0) > 0 || (cat.has_children ?? 0) === 1) {
      canDelete = false;
      reasons.push('类目下存在商品或子级，无法删除');
    }

    return {
      id: cat.id,
      can_enable: canEnable,
      can_disable: canDisable,
      can_sort: canSort,
      can_move: canMove,
      can_delete: canDelete,
      reasons: reasons.length > 0 ? reasons : undefined,
    };
  });

  ok(res, abilities, '获取批量操作权限成功');
});

export default {
  batchToggleStatus,
  batchSort,
  batchMove,
  getBatchAbility,
};
