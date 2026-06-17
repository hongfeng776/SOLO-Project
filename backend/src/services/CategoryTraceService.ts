import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { CategoryLog } from '../models/CategoryLog';
import { Op, WhereOptions } from 'sequelize';

export interface CategoryTreeNode {
  id: number;
  code: string;
  name: string;
  parent_id: number;
  level: number;
  icon?: string;
  sort: number;
  status: number;
  product_count: number;
  has_children: number;
  children?: CategoryTreeNode[];
}

export interface CategoryBasicInfo {
  id: number;
  code: string;
  name: string;
  parent_id: number;
  level: number;
  icon?: string;
  sort: number;
  status: number;
  product_count: number;
  has_children: number;
  required_fields_json?: any;
  compliance_rules_json?: any;
  created_at: Date;
  updated_at: Date;
  creator?: { id: number; name?: string };
}

export interface CategoryFullTraceResult {
  basicInfo: CategoryBasicInfo;
  hierarchyLogs: CategoryLog[];
  productStats: {
    total_count: number;
    top_products: Array<{ id: number; name: string; sku_code: string; price: number; status?: number }>;
  };
  permissionConfigs: Array<{
    id: number;
    role_id: number;
    permission_type: number;
    scope: number;
    status: number;
  }>;
}

export interface ConstraintsCheckResult {
  valid: boolean;
  errors: Array<{ field: string; message: string; code: string }>;
}

class CategoryTraceService {
  private readonly categoryDao = daos.categoryDao;
  private readonly categoryLogDao = daos.categoryLogDao;
  private readonly categoryPermissionDao = daos.categoryPermissionDao;
  private readonly goodsDao = daos.goodsDao;
  private readonly userDao = daos.userDao;
  private readonly adminDao = daos.adminDao;

  async getCategoryFullTrace(categoryId: number): Promise<CategoryFullTraceResult> {
    const category = await this.categoryDao.findById(categoryId);
    if (!category) {
      throw new AppError('类目不存在', 404);
    }

    let creator: { id: number; name?: string } | undefined;
    if (category.created_by) {
      const admin = await this.adminDao.findById(category.created_by);
      if (admin) {
        creator = { id: category.created_by, name: (admin as unknown as Record<string, unknown>).username as string };
      } else {
        const user = await this.userDao.findById(category.created_by);
        if (user) {
          creator = { id: category.created_by, name: (user as unknown as Record<string, unknown>).username as string };
        } else {
          creator = { id: category.created_by };
        }
      }
    }

    const basicInfo: CategoryBasicInfo = {
      id: category.id,
      code: category.code,
      name: category.name,
      parent_id: category.parent_id ?? 0,
      level: category.level ?? 1,
      icon: category.icon,
      sort: category.sort ?? 0,
      status: category.status ?? 1,
      product_count: category.product_count ?? 0,
      has_children: category.has_children ?? 0,
      required_fields_json: category.required_fields_json,
      compliance_rules_json: category.compliance_rules_json,
      created_at: category.created_at,
      updated_at: category.updated_at,
      creator,
    };

    const hierarchyLogs = await this.categoryLogDao.findHierarchyLogs(categoryId);

    const categoryIds = [categoryId, ...(await this.categoryDao.findAllIdsDescendants(categoryId))];
    let totalCount = 0;
    const topProducts: Array<{ id: number; name: string; sku_code: string; price: number; status?: number }> = [];

    const goodsModel = this.goodsDao.getModel();

    try {
      totalCount = await goodsModel.count({
        where: { category_id: { [Op.in]: categoryIds } } as any,
      });

      const goodsList = await this.goodsDao.findAll({
        where: { category_id: { [Op.in]: categoryIds } } as any,
        order: [['created_at', 'DESC']],
        limit: 5,
      });

      for (const goods of goodsList) {
        topProducts.push({
          id: goods.id,
          name: goods.name,
          sku_code: goods.sku_code,
          price: Number(goods.price),
          status: goods.status,
        });
      }
    } catch (e) {
      totalCount = category.product_count ?? 0;
    }

    const permissionRecords = await this.categoryPermissionDao.findByCategoryId(categoryId);
    const permissionConfigs = permissionRecords.map((p) => ({
      id: p.id,
      role_id: p.role_id,
      permission_type: p.permission_type ?? 1,
      scope: p.scope ?? 1,
      status: p.status ?? 1,
    }));

    return {
      basicInfo,
      hierarchyLogs,
      productStats: {
        total_count: totalCount,
        top_products: topProducts,
      },
      permissionConfigs,
    };
  }

  async checkConstraints(
    code: string,
    name: string,
    id?: number,
    parentId: number = 0
  ): Promise<ConstraintsCheckResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (code) {
      const existingByCode = await this.categoryDao.findByCode(code.trim());
      if (existingByCode && (!id || existingByCode.id !== id)) {
        errors.push({ field: 'code', message: `类目编码已存在：${code}`, code: 'CODE_DUPLICATE' });
      }
    }

    if (name) {
      const existingByName = await this.categoryDao.findByParentAndName(parentId, name.trim(), id);
      if (existingByName) {
        errors.push({ field: 'name', message: '同级类目下名称已存在', code: 'NAME_DUPLICATE' });
      }
    }

    if (id !== undefined) {
      const category = await this.categoryDao.findById(id);
      if (category) {
        const currentLevel = category.level ?? 1;
        if (parentId !== undefined && parentId !== (category.parent_id ?? 0)) {
          const targetParent = parentId > 0 ? await this.categoryDao.findById(parentId) : null;
          const newLevel = targetParent ? (targetParent.level ?? 1) + 1 : 1;
          const descendants = await this.categoryDao.findAllDescendants(id);
          const maxDescendantLevel = descendants.reduce(
            (max, d) => Math.max(max, (d.level ?? 1) - currentLevel + newLevel),
            newLevel
          );
          if (maxDescendantLevel > 3) {
            errors.push({ field: 'parent_id', message: '移动后层级超限，最多3级', code: 'LEVEL_EXCEEDED' });
          }
        }
      }
    } else {
      if (parentId > 0) {
        const targetParent = await this.categoryDao.findById(parentId);
        if (targetParent) {
          const newLevel = (targetParent.level ?? 1) + 1;
          if (newLevel > 3) {
            errors.push({ field: 'level', message: '层级超限，最多3级', code: 'LEVEL_EXCEEDED' });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async getTreeWithStats(): Promise<CategoryTreeNode[]> {
    const allCategories = await this.categoryDao.findAll({
      order: [['sort', 'ASC'], ['id', 'ASC']],
    });

    const nodeMap = new Map<number, CategoryTreeNode>();
    for (const cat of allCategories) {
      nodeMap.set(cat.id, {
        id: cat.id,
        code: cat.code,
        name: cat.name,
        parent_id: cat.parent_id ?? 0,
        level: cat.level ?? 1,
        icon: cat.icon,
        sort: cat.sort ?? 0,
        status: cat.status ?? 1,
        product_count: cat.product_count ?? 0,
        has_children: cat.has_children ?? 0,
        children: [],
      });
    }

    const roots: CategoryTreeNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.parent_id === 0) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(node.parent_id);
        if (parent) {
          parent.children!.push(node);
        } else {
          roots.push(node);
        }
      }
    }

    for (const node of nodeMap.values()) {
      if (!node.children || node.children.length === 0) {
        delete (node as Partial<CategoryTreeNode>).children;
      }
    }

    return roots;
  }

  async getFlatListWithStats(params?: {
    level?: number;
    status?: number;
    parent_id?: number;
    keyword?: string;
  }): Promise<CategoryTreeNode[]> {
    const where: Record<string, unknown> = {} as Record<string, unknown>;

    if (params?.level !== undefined) {
      where.level = params.level;
    }
    if (params?.status !== undefined) {
      where.status = params.status;
    }
    if (params?.parent_id !== undefined) {
      where.parent_id = params.parent_id;
    }
    if (params?.keyword) {
      (where as Record<string, unknown>)[Op.or as unknown as string] = [
        { name: { [Op.like]: `%${params.keyword}%` } },
        { code: { [Op.like]: `%${params.keyword}%` } },
      ];
    }

    const categories = await this.categoryDao.findAll({
      where: where as WhereOptions,
      order: [['sort', 'ASC'], ['id', 'ASC']],
    });

    return categories.map((cat) => ({
      id: cat.id,
      code: cat.code,
      name: cat.name,
      parent_id: cat.parent_id ?? 0,
      level: cat.level ?? 1,
      icon: cat.icon,
      sort: cat.sort ?? 0,
      status: cat.status ?? 1,
      product_count: cat.product_count ?? 0,
      has_children: cat.has_children ?? 0,
    }));
  }
}

export const categoryTraceService = new CategoryTraceService();
export default CategoryTraceService;
