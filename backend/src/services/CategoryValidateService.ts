import { daos } from '../dao';

export const MAX_LEVEL = 3;

export interface LevelQualificationRule {
  level: number;
  required: boolean;
  qualification_type: string;
  description: string;
}

export interface CategoryCreateData {
  code: string;
  name: string;
  parent_id?: number;
  icon?: string;
  sort?: number;
  required_fields_json?: any;
  compliance_rules_json?: any;
}

export interface ValidateResult {
  valid: boolean;
  errors: Array<{ field: string; message: string; code: string }>;
}

const LEVEL_QUALIFICATION_RULES: LevelQualificationRule[] = [
  {
    level: 1,
    required: true,
    qualification_type: 'business_license',
    description: '1级类目需绑定营业执照',
  },
  {
    level: 2,
    required: true,
    qualification_type: 'industry_qualification',
    description: '2级类目需绑定行业资质',
  },
  {
    level: 3,
    required: true,
    qualification_type: 'product_3c_cert',
    description: '3级类目需绑定单品3C认证',
  },
];

class CategoryValidateService {
  private readonly categoryDao = daos.categoryDao;

  async validateCreate(
    parentId: number,
    data: CategoryCreateData,
    _operatorId: number
  ): Promise<ValidateResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (parentId > 0) {
      const parentCategory = await this.categoryDao.findById(parentId);
      if (!parentCategory) {
        errors.push({ field: 'parent_id', message: '上级类目不存在', code: 'PARENT_NOT_FOUND' });
      } else if (parentCategory.status !== 1) {
        errors.push({ field: 'parent_id', message: '上级类目已禁用，无法新增', code: 'PARENT_DISABLED' });
      } else {
        const newLevel = (parentCategory.level ?? 1) + 1;
        if (newLevel > MAX_LEVEL) {
          errors.push({ field: 'level', message: `层级超限最多${MAX_LEVEL}级`, code: 'LEVEL_EXCEEDED' });
        }
      }
    }

    if (data.code) {
      const existingByCode = await this.categoryDao.findByCode(data.code);
      if (existingByCode) {
        errors.push({ field: 'code', message: `类目编码已存在：${data.code}`, code: 'CODE_DUPLICATE' });
      }
    } else {
      errors.push({ field: 'code', message: '类目编码不能为空', code: 'CODE_EMPTY' });
    }

    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: '类目名称不能为空', code: 'NAME_EMPTY' });
    } else {
      const existingByName = await this.categoryDao.findByParentAndName(parentId, data.name);
      if (existingByName) {
        errors.push({ field: 'name', message: '同级类目下名称已存在', code: 'NAME_DUPLICATE' });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async canSubmitCreate(parentId: number): Promise<boolean> {
    if (parentId === 0) {
      return true;
    }

    const parentCategory = await this.categoryDao.findById(parentId);
    if (!parentCategory || parentCategory.status !== 1) {
      return false;
    }

    const currentLevel = parentCategory.level ?? 1;
    if (currentLevel >= MAX_LEVEL) {
      return false;
    }

    return true;
  }

  getLevelQualificationRules(level: number): LevelQualificationRule[] {
    return LEVEL_QUALIFICATION_RULES.filter((r) => r.level === level);
  }

  getAllQualificationRules(): LevelQualificationRule[] {
    return LEVEL_QUALIFICATION_RULES;
  }

  async checkCodeUnique(code: string, excludeId?: number): Promise<ValidateResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!code || code.trim().length === 0) {
      errors.push({ field: 'code', message: '类目编码不能为空', code: 'CODE_EMPTY' });
      return { valid: false, errors };
    }

    const existing = await this.categoryDao.findByCode(code.trim());
    if (existing && (!excludeId || existing.id !== excludeId)) {
      errors.push({ field: 'code', message: `类目编码已存在：${code}`, code: 'CODE_DUPLICATE' });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async checkNameUnique(parentId: number, name: string, excludeId?: number): Promise<ValidateResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!name || name.trim().length === 0) {
      errors.push({ field: 'name', message: '类目名称不能为空', code: 'NAME_EMPTY' });
      return { valid: false, errors };
    }

    const existing = await this.categoryDao.findByParentAndName(parentId, name.trim(), excludeId);
    if (existing) {
      errors.push({ field: 'name', message: '同级类目下名称已存在', code: 'NAME_DUPLICATE' });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const categoryValidateService = new CategoryValidateService();
export default CategoryValidateService;
