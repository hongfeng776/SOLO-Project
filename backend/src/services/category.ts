import { Category, Tag } from '@models/index'
import { AppError } from '@utils/response'
import { Op, literal } from 'sequelize'
import { CategoryStatus, TagStatus } from '@/enums/tag-category'
import type { CategoryData, TagCategoryComplianceResult } from '@/types/index'

const buildTree = (categories: any[], parentId: number | null = null): any[] => {
  return categories
    .filter((c) => (parentId === null ? c.parentId === null || c.parentId === undefined : c.parentId === parentId))
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((c) => ({
      ...c.toJSON(),
      children: buildTree(categories, c.id)
    }))
}

export const categoryService = {
  async list(params: {
    page?: number
    pageSize?: number
    status?: number
    keyword?: string
    level?: number
    parentId?: number
    isTree?: boolean
  }) {
    const { page, pageSize, status, keyword, level, parentId, isTree } = params
    const where: any = {}

    if (status !== undefined) where.status = status
    if (level !== undefined) where.level = level
    if (parentId !== undefined) where.parentId = parentId
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ]
    }

    if (isTree) {
      const all = await Category.findAll({
        where,
        order: [['level', 'ASC'], ['sort', 'ASC'], ['create_time', 'DESC']]
      })
      return { list: buildTree(all), total: all.length }
    }

    if (page !== undefined && pageSize !== undefined) {
      const { count, rows } = await Category.findAndCountAll({
        where,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order: [['level', 'ASC'], ['sort', 'ASC'], ['create_time', 'DESC']]
      })
      return { list: rows, total: count, page, pageSize }
    }

    const rows = await Category.findAll({
      where,
      order: [['level', 'ASC'], ['sort', 'ASC'], ['create_time', 'DESC']]
    })
    return { list: rows, total: rows.length }
  },

  async getAll() {
    return Category.findAll({
      where: { status: CategoryStatus.ENABLED },
      order: [['level', 'ASC'], ['sort', 'ASC']]
    })
  },

  async all() {
    return this.getAll()
  },

  async getTree(params?: {
    status?: number
    keyword?: string
    level?: number
    parentId?: number
  }) {
    const where: any = {}
    if (params) {
      if (params.status !== undefined) where.status = params.status
      if (params.level !== undefined) where.level = params.level
      if (params.parentId !== undefined) where.parentId = params.parentId
      if (params.keyword) {
        where[Op.or] = [
          { name: { [Op.like]: `%${params.keyword}%` } },
          { code: { [Op.like]: `%${params.keyword}%` } }
        ]
      }
    }

    if (!where.status) where.status = CategoryStatus.ENABLED

    const all = await Category.findAll({
      where,
      order: [['level', 'ASC'], ['sort', 'ASC']]
    })
    return buildTree(all)
  },

  async tree() {
    return this.getTree()
  },

  async detail(id: number) {
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'type', 'useCount', 'status', 'hotLevel'],
          limit: 20,
          order: [['use_count', 'DESC']]
        }
      ]
    })
    if (!category) throw new AppError('分类不存在', 404)
    return category
  },

  validateCategoryData(data: CategoryData, isUpdate: boolean = false): TagCategoryComplianceResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!isUpdate || data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('分类名称不能为空')
      } else if (data.name.length > 50) {
        errors.push('分类名称不能超过50字符')
      }
    }

    if (!isUpdate || data.code !== undefined) {
      if (!data.code || data.code.trim().length === 0) {
        errors.push('分类编码不能为空')
      } else if (data.code.length > 30) {
        errors.push('分类编码不能超过30字符')
      }
    }

    if (!isUpdate || data.scenes !== undefined) {
      if (!data.scenes || !Array.isArray(data.scenes) || data.scenes.length === 0) {
        errors.push('适配内容场景不能为空')
      }
    }

    if (data.level !== undefined && (data.level < 1 || data.level > 3)) {
      errors.push('层级只能是1、2或3')
    }

    return { valid: errors.length === 0, errors, warnings }
  },

  async create(data: CategoryData, userId?: number) {
    const validation = this.validateCategoryData(data, false)
    if (!validation.valid) {
      throw new AppError(validation.errors.join('; '), 400)
    }

    const existingName = await Category.findOne({
      where: { name: data.name }
    })
    if (existingName) {
      throw new AppError('分类名称已存在', 400)
    }

    const existingCode = await Category.findOne({
      where: { code: data.code }
    })
    if (existingCode) {
      throw new AppError('分类编码已存在', 400)
    }

    let level = data.level || 1
    if (data.parentId) {
      const parent = await Category.findByPk(data.parentId)
      if (!parent) {
        throw new AppError('上级分类不存在', 400)
      }
      level = parent.level + 1
      if (level > 3) {
        throw new AppError('分类层级最多3级', 400)
      }
    }

    const category = await Category.create({
      ...data,
      level,
      scenes: JSON.stringify(data.scenes),
      status: data.status ?? CategoryStatus.ENABLED,
      creator: userId ? `user_${userId}` : ''
    } as any)

    return { id: category.id }
  },

  async update(id: number, data: Partial<CategoryData>, _userId?: number) {
    const category = await Category.findByPk(id)
    if (!category) throw new AppError('分类不存在', 404)

    const fullData: CategoryData = {
      name: data.name ?? category.name,
      code: data.code ?? category.code,
      parentId: data.parentId ?? category.parentId ?? undefined,
      level: data.level ?? category.level,
      description: data.description ?? category.description,
      coverImage: data.coverImage ?? category.coverImage,
      icon: data.icon ?? category.icon,
      color: data.color ?? category.color,
      sort: data.sort ?? category.sort,
      status: data.status ?? category.status,
      isCore: data.isCore ?? category.isCore,
      weight: data.weight ?? category.weight,
      scenes: data.scenes ?? (category.scenes ? JSON.parse(category.scenes) : [])
    }

    const validation = this.validateCategoryData(fullData, true)
    if (!validation.valid) {
      throw new AppError(validation.errors.join('; '), 400)
    }

    if (data.name && data.name !== category.name) {
      const existingName = await Category.findOne({
        where: { name: data.name, id: { [Op.ne]: id } }
      })
      if (existingName) {
        throw new AppError('分类名称已存在', 400)
      }
    }

    if (data.code && data.code !== category.code) {
      const existingCode = await Category.findOne({
        where: { code: data.code, id: { [Op.ne]: id } }
      })
      if (existingCode) {
        throw new AppError('分类编码已存在', 400)
      }
    }

    const updateData: any = { ...data }
    if (data.parentId !== undefined) {
      if (data.parentId === null || data.parentId === undefined) {
        updateData.level = 1
      } else {
        const parent = await Category.findByPk(data.parentId)
        if (!parent) {
          throw new AppError('上级分类不存在', 400)
        }
        const newLevel = parent.level + 1
        if (newLevel > 3) {
          throw new AppError('分类层级最多3级', 400)
        }
        updateData.level = newLevel
      }
    }
    if (data.scenes) {
      updateData.scenes = JSON.stringify(data.scenes)
    }

    await category.update(updateData)
    return { id: category.id }
  },

  async remove(id: number) {
    const category = await Category.findByPk(id)
    if (!category) throw new AppError('分类不存在', 404)

    const childCount = await Category.count({ where: { parentId: id } })
    if (childCount > 0) {
      throw new AppError('存在下级分类，无法删除', 400)
    }

    const tagCount = await Tag.count({ where: { categoryId: id } })
    if (tagCount > 0) {
      throw new AppError('分类下存在标签，无法删除', 400)
    }

    if ((category.noteCount || 0) > 0) {
      throw new AppError('分类下存在笔记，无法删除', 400)
    }

    await category.destroy()
    return true
  },

  async updateStatus(id: number, status: number, _userId?: number) {
    const category = await Category.findByPk(id)
    if (!category) throw new AppError('分类不存在', 404)

    await category.update({ status })

    if (status === CategoryStatus.DISABLED) {
      await Tag.update(
        { status: TagStatus.DISABLED },
        { where: { categoryId: id, status: TagStatus.ENABLED } }
      )
    }

    return { id: category.id }
  },

  async getStats() {
    const total = await Category.count()
    const enabled = await Category.count({ where: { status: CategoryStatus.ENABLED } })
    const disabled = await Category.count({ where: { status: CategoryStatus.DISABLED } })
    const core = await Category.count({ where: { isCore: 1 } })

    const level1 = await Category.count({ where: { level: 1 } })
    const level2 = await Category.count({ where: { level: 2 } })
    const level3 = await Category.count({ where: { level: 3 } })

    const totalTagCount = await Category.sum('tagCount') || 0
    const totalNoteCount = await Category.sum('noteCount') || 0

    const topCategories = await Category.findAll({
      where: { status: CategoryStatus.ENABLED },
      attributes: [
        'id',
        'name',
        'tagCount',
        'noteCount',
        [literal('tag_count * 2 + note_count'), 'score']
      ],
      order: [[literal('score'), 'DESC']],
      limit: 10
    })

    return {
      total,
      enabled,
      disabled,
      core,
      level1,
      level2,
      level3,
      totalTagCount,
      totalNoteCount,
      topCategories
    }
  }
}
