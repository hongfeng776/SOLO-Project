import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { Category } from '../models/Category';

export interface CategoryUpdateData {
  name?: string;
  code?: string;
  parent_id?: number;
  icon?: string;
  sort?: number;
  status?: number;
  required_fields_json?: any;
  compliance_rules_json?: any;
  updated_by?: number;
}

export interface LinkageUpdateResult {
  success: boolean;
  needConfirm: boolean;
  category?: Category;
  message?: string;
  updatedProducts?: number;
}

class CategoryLinkageService {
  private readonly categoryDao = daos.categoryDao;
  private readonly categoryLogDao = daos.categoryLogDao;
  private readonly goodsDao = daos.goodsDao;

  async updateCategoryWithLinkage(
    categoryId: number,
    data: CategoryUpdateData,
    operatorId: number,
    needConfirm: boolean = false,
    operatorType: number = 1
  ): Promise<LinkageUpdateResult> {
    const category = await this.categoryDao.findById(categoryId);
    if (!category) {
      throw new AppError('类目不存在', 404);
    }

    const hasProducts = (category.product_count ?? 0) > 0;

    if (hasProducts && !needConfirm) {
      return {
        success: false,
        needConfirm: true,
        message: '该类目下存在存量商品，修改可能影响商品检索，请确认是否继续',
      };
    }

    const oldData = {
      parent_id: category.parent_id,
      name: category.name,
      sort: category.sort,
      status: category.status,
    };

    const changedFields: string[] = [];
    const updateData: Record<string, unknown> = {};

    for (const key of Object.keys(data)) {
      const dataKey = key as keyof CategoryUpdateData;
      if (data[dataKey] !== undefined && data[dataKey] !== (category as unknown as Record<string, unknown>)[key]) {
        changedFields.push(key);
        updateData[key] = data[dataKey];
      }
    }

    if (changedFields.length === 0) {
      return {
        success: true,
        needConfirm: false,
        category,
        message: '无变更内容',
      };
    }

    updateData.updated_by = operatorId;

    let updatedProducts = 0;

    if (data.parent_id !== undefined && data.parent_id !== category.parent_id) {
      const newParent = data.parent_id > 0 ? await this.categoryDao.findById(data.parent_id) : null;
      const newLevel = newParent ? (newParent.level ?? 1) + 1 : 1;

      if (newLevel > 3) {
        throw new AppError('移动后层级超限，最多3级', 400);
      }

      updateData.level = newLevel;

      updatedProducts = await this.updateCategoryPath(categoryId, data.parent_id);
    }

    if (data.name !== undefined && data.name !== category.name) {
      updatedProducts += await this.updateProductCategoryName(categoryId, data.name);
    }

    await this.categoryDao.update(categoryId, updateData);

    const oldParentId = category.parent_id;
    const newParentId = data.parent_id !== undefined ? data.parent_id : oldParentId;
    if (oldParentId !== newParentId) {
      if (oldParentId && oldParentId > 0) {
        const oldParentChildren = await this.categoryDao.findByParentId(oldParentId);
        await this.categoryDao.updateHasChildren(oldParentId, oldParentChildren.length > 0 ? 1 : 0);
      }
      if (newParentId && newParentId > 0) {
        await this.categoryDao.updateHasChildren(newParentId, 1);
      }
    }

    const updatedCategory = await this.categoryDao.findById(categoryId);

    await this.categoryLogDao.create({
      category_id: categoryId,
      operator_id: operatorId,
      operator_type: operatorType,
      action: 'update',
      old_data_json: oldData,
      new_data_json: {
        parent_id: data.parent_id ?? category.parent_id,
        name: data.name ?? category.name,
        sort: data.sort ?? category.sort,
        status: data.status ?? category.status,
      },
      changed_fields: changedFields,
    } as any);

    return {
      success: true,
      needConfirm: false,
      category: updatedCategory ?? undefined,
      updatedProducts,
    };
  }

  getEditPermissionType(categoryId: number): Promise<'empty' | 'hasProducts'> {
    return this.categoryDao.findById(categoryId).then((category) => {
      if (!category) {
        throw new AppError('类目不存在', 404);
      }
      return (category.product_count ?? 0) > 0 ? 'hasProducts' : 'empty';
    });
  }

  private async updateCategoryPath(categoryId: number, newParentId: number): Promise<number> {
    const categoryIds = await this.collectCategoryAndDescendantIds(categoryId);
    const categoryPathMap = await this.buildCategoryPathMap(newParentId, categoryId);
    const goodsModel = this.goodsDao.getModel();

    let updatedCount = 0;
    for (const cid of categoryIds) {
      const pathJson = categoryPathMap.get(cid);
      if (pathJson) {
        const where = { category_id: cid } as any;
        try {
          const [count] = await goodsModel.update(
            { category_path_json: pathJson } as any,
            { where }
          );
          updatedCount += count;
        } catch (e) {
          // ignore if column doesn't exist
        }
      }
    }
    return updatedCount;
  }

  private async updateProductCategoryName(categoryId: number, newName: string): Promise<number> {
    const categoryIds = await this.collectCategoryAndDescendantIds(categoryId);
    const goodsModel = this.goodsDao.getModel();
    let updatedCount = 0;
    for (const cid of categoryIds) {
      try {
        const [count] = await goodsModel.update(
          { category_name: newName } as any,
          { where: { category_id: cid } as any }
        );
        updatedCount += count;
      } catch (e) {
        // ignore if column doesn't exist
      }
    }
    return updatedCount;
  }

  private async collectCategoryAndDescendantIds(categoryId: number): Promise<number[]> {
    const ids = [categoryId];
    const descendants = await this.categoryDao.findAllDescendants(categoryId);
    for (const d of descendants) {
      ids.push(d.id);
    }
    return ids;
  }

  private async buildCategoryPathMap(
    newParentId: number,
    movedCategoryId: number
  ): Promise<Map<number, string[]>> {
    const result = new Map<number, string[]>();

    const parentPath: string[] = [];
    if (newParentId > 0) {
      let currentId: number | undefined = newParentId;
      const path: Category[] = [];
      while (currentId && currentId > 0) {
        const cat = await this.categoryDao.findById(currentId);
        if (cat) {
          path.unshift(cat);
          currentId = cat.parent_id;
        } else {
          break;
        }
      }
      for (const cat of path) {
        parentPath.push(cat.name);
      }
    }

    const movedCategory = await this.categoryDao.findById(movedCategoryId);
    if (!movedCategory) return result;

    const movedPath = [...parentPath, movedCategory.name];
    result.set(movedCategoryId, movedPath);

    const descendants = await this.categoryDao.findAllDescendants(movedCategoryId);
    const childrenMap = new Map<number, Category[]>();
    for (const d of descendants) {
      const pid = d.parent_id ?? 0;
      if (!childrenMap.has(pid)) {
        childrenMap.set(pid, []);
      }
      childrenMap.get(pid)!.push(d);
    }

    const queue: Array<{ id: number; path: string[] }> = [{ id: movedCategoryId, path: movedPath }];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = childrenMap.get(current.id) || [];
      for (const child of children) {
        const childPath = [...current.path, child.name];
        result.set(child.id, childPath);
        queue.push({ id: child.id, path: childPath });
      }
    }

    return result;
  }
}

export const categoryLinkageService = new CategoryLinkageService();
export default CategoryLinkageService;
