import { Tag, TagUsageLog, Category, Note } from '@models/index'
import { AppError } from '@utils/response'
import { Op, fn, col, literal } from 'sequelize'
import { TagStatus, TagActionType, HotLevel, COMPLIANCE_LIBRARIES } from '@/enums/tag-category'
import type { TagData, BatchTagOpsData, TagCategoryComplianceResult } from '@/types/index'

const HIGH_PERMISSION_ROLES = ['admin', 'super_admin', 'super_ops']

const hasHighPermission = (userRoles: string[]): boolean => {
  return userRoles.some((r) => HIGH_PERMISSION_ROLES.includes(r.toLowerCase()))
}

const getAllComplianceTags = (): Set<string> => {
  const tags = new Set<string>()
  COMPLIANCE_LIBRARIES.forEach((lib) => {
    lib.tags.forEach((t) => tags.add(t))
  })
  return tags
}

export const tagManagementService = {
  async list(params: {
    page: number
    pageSize: number
    keyword?: string
    categoryId?: number
    type?: string
    status?: number
    hotLevel?: number
    isCore?: number
    parentId?: number
  }) {
    const { page, pageSize, keyword, categoryId, type, status, hotLevel, isCore, parentId } = params
    const where: any = {}

    if (status !== undefined) where.status = status
    if (type) where.type = type
    if (categoryId !== undefined) where.categoryId = categoryId
    if (parentId !== undefined) where.parentId = parentId
    if (hotLevel !== undefined) where.hotLevel = hotLevel
    if (isCore !== undefined) where.isCore = isCore
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` }
    }

    const { count, rows } = await Tag.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [
        ['is_core', 'DESC'],
        ['hot_level', 'DESC'],
        ['weight', 'DESC'],
        ['use_count', 'DESC'],
        ['create_time', 'DESC']
      ]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const tag = await Tag.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ]
    })
    if (!tag) throw new AppError('标签不存在', 404)
    return tag
  },

  validateTagForCreate(data: Partial<TagData>, isPreview: boolean = false): TagCategoryComplianceResult {
    const errors: string[] = []
    const warnings: string[] = []
    const allComplianceTags = getAllComplianceTags()

    if (!isPreview || data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('标签名称不能为空')
      } else {
        const nameLen = data.name.trim().length
        if (nameLen < 2) {
          errors.push('标签名称至少2个字符')
        }
        if (nameLen > 20) {
          errors.push('标签名称不能超过20个字符')
        }
      }
    }

    if (!isPreview || data.scenes !== undefined) {
      if (!data.scenes || !Array.isArray(data.scenes) || data.scenes.length === 0) {
        errors.push('适配内容场景不能为空，这是关联合规标签库的前置条件')
      }
    }

    if (!isPreview || data.complianceTags !== undefined) {
      if (!data.complianceTags || !Array.isArray(data.complianceTags) || data.complianceTags.length === 0) {
        errors.push('关联合规标签不能为空，必须从合规标签库中选择')
      } else {
        const invalidTags = data.complianceTags.filter((t) => !allComplianceTags.has(t))
        if (invalidTags.length > 0) {
          errors.push(`关联合规标签无效：${invalidTags.join('、')}，请从合规标签库中选择`)
        }
      }
    }

    if (data.categoryId !== undefined && data.parentId !== undefined) {
      if (data.categoryId !== null && data.parentId !== null && data.categoryId === data.parentId) {
        errors.push('分类ID和上级标签ID不能相同')
      }
    }

    if (data.hotLevel !== undefined && data.hotLevel !== HotLevel.NORMAL && data.hotLevel !== HotLevel.HOT) {
      warnings.push('热度等级值不在预期范围内，将使用默认值')
    }

    return { valid: errors.length === 0, errors, warnings }
  },

  async checkDuplicate(params: { name: string; type?: string; categoryId?: number }): Promise<{ exists: boolean; message?: string }> {
    const { name, type = 'content', categoryId } = params
    if (!name) {
      return { exists: false }
    }

    const where: any = {
      name,
      type
    }
    if (categoryId !== undefined && categoryId !== null) {
      where.categoryId = categoryId
    } else {
      where.categoryId = { [Op.or]: [null, 0] }
    }
    const existing = await Tag.findOne({ where })
    if (existing) {
      return { exists: true, message: `标签名称「${name}」已存在（同类型${categoryId ? '+同分类' : ''}下）` }
    }
    return { exists: false }
  },

  async createTag(data: TagData, userId?: number) {
    const validation = this.validateTagForCreate(data, false)
    if (!validation.valid) {
      throw new AppError(validation.errors.join('; '), 400)
    }

    const dupCheck = await this.checkDuplicate({
      name: data.name,
      type: data.type || 'content',
      categoryId: data.categoryId as number | undefined
    })
    if (dupCheck.exists) {
      throw new AppError(dupCheck.message || '标签名称已存在', 400)
    }

    if (data.categoryId) {
      const category = await Category.findByPk(data.categoryId)
      if (!category) {
        throw new AppError('关联分类不存在', 400)
      }
    }

    if (data.parentId) {
      const parentTag = await Tag.findByPk(data.parentId)
      if (!parentTag) {
        throw new AppError('上级标签不存在', 400)
      }
    }

    const tag = await Tag.create({
      ...data,
      type: data.type || 'content',
      scenes: data.scenes ? JSON.stringify(data.scenes) : '',
      complianceTags: data.complianceTags ? JSON.stringify(data.complianceTags) : '',
      status: data.status ?? TagStatus.ENABLED,
      hotLevel: data.hotLevel ?? HotLevel.NORMAL
    } as any)

    if (data.categoryId) {
      await Category.increment('tagCount', { by: 1, where: { id: data.categoryId } })
    }

    if (userId) {
      await TagUsageLog.create({
        tagId: tag.id,
        tagName: tag.name,
        noteId: 0,
        noteTitle: '创建标签',
        categoryId: tag.categoryId || null,
        userId,
        userName: `user_${userId}`,
        action: TagActionType.CREATE,
        reason: '创建新标签'
      } as any)
    }

    return { id: tag.id }
  },

  async updateTag(id: number, data: Partial<TagData>, userId?: number) {
    const tag = await Tag.findByPk(id)
    if (!tag) throw new AppError('标签不存在', 404)

    const fullData: TagData = {
      name: data.name ?? tag.name,
      type: data.type ?? tag.type,
      categoryId: data.categoryId !== undefined ? data.categoryId : tag.categoryId,
      parentId: data.parentId !== undefined ? data.parentId : tag.parentId,
      description: data.description ?? tag.description,
      coverImage: data.coverImage ?? tag.coverImage,
      sort: data.sort ?? tag.sort,
      status: data.status ?? tag.status,
      hotLevel: data.hotLevel ?? tag.hotLevel,
      weight: data.weight ?? tag.weight,
      isCore: data.isCore ?? tag.isCore,
      complianceTags: data.complianceTags ?? (tag.complianceTags ? JSON.parse(tag.complianceTags) : []),
      scenes: data.scenes ?? (tag.scenes ? JSON.parse(tag.scenes) : []),
      color: data.color ?? tag.color,
      icon: data.icon ?? tag.icon
    }

    const validation = this.validateTagForCreate(fullData, true)
    if (!validation.valid) {
      throw new AppError(validation.errors.join('; '), 400)
    }

    if (data.name && data.name !== tag.name) {
      const existing = await Tag.findOne({
        where: {
          name: data.name,
          type: fullData.type,
          id: { [Op.ne]: id },
          ...(fullData.categoryId !== undefined && fullData.categoryId !== null
            ? { categoryId: fullData.categoryId }
            : { categoryId: { [Op.or]: [null, 0] } })
        }
      })
      if (existing) {
        throw new AppError('标签名称已存在（同类型+同分类下）', 400)
      }
    }

    if (data.categoryId !== undefined && data.categoryId !== tag.categoryId) {
      if (tag.categoryId) {
        await Category.decrement('tagCount', { by: 1, where: { id: tag.categoryId } })
      }
      if (data.categoryId) {
        const category = await Category.findByPk(data.categoryId)
        if (!category) {
          throw new AppError('关联分类不存在', 400)
        }
        await Category.increment('tagCount', { by: 1, where: { id: data.categoryId } })
      }
    }

    if (data.parentId !== undefined && data.parentId !== null && data.parentId !== tag.parentId) {
      if (data.parentId === id) {
        throw new AppError('上级标签不能是自身', 400)
      }
      const parentTag = await Tag.findByPk(data.parentId)
      if (!parentTag) {
        throw new AppError('上级标签不存在', 400)
      }
    }

    const updateData: any = { ...data }
    if (data.scenes) {
      updateData.scenes = JSON.stringify(data.scenes)
    }
    if (data.complianceTags) {
      updateData.complianceTags = JSON.stringify(data.complianceTags)
    }

    await tag.update(updateData)

    if (userId) {
      await TagUsageLog.create({
        tagId: tag.id,
        tagName: tag.name,
        noteId: 0,
        noteTitle: '更新标签',
        categoryId: tag.categoryId || null,
        userId,
        userName: `user_${userId}`,
        action: TagActionType.UPDATE,
        reason: '更新标签属性'
      } as any)
    }

    return { id: tag.id }
  },

  async removeTag(id: number) {
    const tag = await Tag.findByPk(id)
    if (!tag) throw new AppError('标签不存在', 404)

    const boundNotes = await (tag as any).countNotes()
    if (boundNotes > 0) {
      throw new AppError('标签已绑定笔记，无法删除，请先解绑', 400)
    }

    const childTags = await Tag.count({ where: { parentId: id } })
    if (childTags > 0) {
      throw new AppError('存在下级标签，无法删除', 400)
    }

    if (tag.categoryId) {
      await Category.decrement('tagCount', { by: 1, where: { id: tag.categoryId } })
    }

    await tag.destroy()
    return true
  },

  async toggleStatus(id: number, status: number, userId?: number) {
    const tag = await Tag.findByPk(id)
    if (!tag) throw new AppError('标签不存在', 404)

    const oldStatus = tag.status
    await tag.update({ status })

    if (tag.categoryId && oldStatus !== status) {
      const category = await Category.findByPk(tag.categoryId)
      if (category) {
        const activeTagCount = await Tag.count({
          where: { categoryId: tag.categoryId, status: TagStatus.ENABLED }
        })
        await category.update({ tagCount: activeTagCount })
      }
    }

    if (userId) {
      await TagUsageLog.create({
        tagId: tag.id,
        tagName: tag.name,
        noteId: 0,
        noteTitle: '状态切换',
        categoryId: tag.categoryId || null,
        userId,
        userName: `user_${userId}`,
        action: TagActionType.UPDATE,
        reason: `状态从${oldStatus}切换为${status}`
      } as any)
    }

    return { id: tag.id, status, useCount: tag.useCount }
  },

  async batchOperations(userId: number, userRoles: string[], data: BatchTagOpsData) {
    const { ids, action, weight } = data

    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的标签', 400)
    }

    const tags = await Tag.findAll({ where: { id: { [Op.in]: ids } } })
    if (tags.length === 0) {
      throw new AppError('所选标签不存在', 404)
    }

    const coreTags = tags.filter((t) => t.isCore === 1)
    if (coreTags.length > 0 && !hasHighPermission(userRoles)) {
      throw new AppError('无权限操作核心品类标签，需要管理员或高级运维权限', 403)
    }

    let affectedCount = 0
    const categoryIdsAffected = new Set<number>()

    switch (action) {
      case 'enable':
        affectedCount = await Tag.update(
          { status: TagStatus.ENABLED },
          { where: { id: { [Op.in]: ids } } }
        ).then((r) => r[0])
        tags.forEach((t) => t.categoryId && categoryIdsAffected.add(t.categoryId))
        break

      case 'disable':
        affectedCount = await Tag.update(
          { status: TagStatus.DISABLED },
          { where: { id: { [Op.in]: ids } } }
        ).then((r) => r[0])
        tags.forEach((t) => t.categoryId && categoryIdsAffected.add(t.categoryId))
        break

      case 'update_weight':
        if (weight === undefined || weight === null) {
          throw new AppError('权重值不能为空', 400)
        }
        affectedCount = await Tag.update(
          { weight },
          { where: { id: { [Op.in]: ids } } }
        ).then((r) => r[0])
        break

      case 'delete': {
        const deletableIds: number[] = []
        for (const tag of tags) {
          const boundNotes = await (tag as any).countNotes()
          const childCount = await Tag.count({ where: { parentId: tag.id } })
          if (boundNotes === 0 && childCount === 0) {
            deletableIds.push(tag.id)
            if (tag.categoryId) categoryIdsAffected.add(tag.categoryId)
          }
        }
        if (deletableIds.length === 0) {
          throw new AppError('没有可删除的标签（已绑定笔记或有子标签）', 400)
        }
        affectedCount = await Tag.destroy({ where: { id: { [Op.in]: deletableIds } } })
        break
      }

      default:
        throw new AppError('不支持的操作类型', 400)
    }

    for (const catId of categoryIdsAffected) {
      const category = await Category.findByPk(catId)
      if (category) {
        const activeTagCount = await Tag.count({
          where: { categoryId: catId, status: TagStatus.ENABLED }
        })
        await category.update({ tagCount: activeTagCount })
      }
    }

    for (const tag of tags) {
      await TagUsageLog.create({
        tagId: tag.id,
        tagName: tag.name,
        noteId: 0,
        noteTitle: '批量操作',
        categoryId: tag.categoryId || null,
        userId,
        userName: `user_${userId}`,
        action: action === 'delete' ? TagActionType.DELETE : TagActionType.UPDATE,
        reason: `批量操作: ${action}${action === 'update_weight' ? ` (${weight})` : ''}`
      } as any)
    }

    return { affectedCount, totalSelected: tags.length }
  },

  async getUsageLogs(params: {
    page: number
    pageSize: number
    tagId?: number
    noteId?: number
    userId?: number
    action?: string
    startTime?: string
    endTime?: string
  }) {
    const { page, pageSize, tagId, noteId, userId, action, startTime, endTime } = params
    const where: any = {}

    if (tagId !== undefined) where.tagId = tagId
    if (noteId !== undefined) where.noteId = noteId
    if (userId !== undefined) where.userId = userId
    if (action) where.action = action
    if (startTime) where.createTime = { ...where.createTime, [Op.gte]: startTime }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: endTime }

    const { count, rows } = await TagUsageLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async cleanUnused(thresholdDays: number = 90, userId?: number) {
    if (thresholdDays < 7) {
      throw new AppError('清理阈值天数不能小于7天', 400)
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - thresholdDays)

    const where: any = {
      useCount: 0,
      status: TagStatus.ENABLED
    }
    where[Op.or] = [
      { lastUsedTime: { [Op.lt]: cutoffDate } },
      { lastUsedTime: null }
    ]

    const unusedTags = await Tag.findAll({ where, include: [{ model: Note, as: 'notes', attributes: ['id'] }] })

    const reallyUnused = unusedTags.filter((tag: any) => !tag.notes || tag.notes.length === 0)

    const categoryIdsAffected = new Set<number>()
    let deletedCount = 0

    for (const tag of reallyUnused) {
      const childCount = await Tag.count({ where: { parentId: tag.id } })
      if (childCount === 0) {
        if (tag.categoryId) categoryIdsAffected.add(tag.categoryId)
        await tag.destroy()
        deletedCount++
      }
    }

    for (const catId of categoryIdsAffected) {
      const category = await Category.findByPk(catId)
      if (category) {
        const activeTagCount = await Tag.count({
          where: { categoryId: catId, status: TagStatus.ENABLED }
        })
        await category.update({ tagCount: activeTagCount })
      }
    }

    if (userId && deletedCount > 0) {
      await TagUsageLog.create({
        tagId: 0,
        tagName: '系统清理',
        noteId: 0,
        noteTitle: '清理冗余标签',
        categoryId: null,
        userId,
        userName: `user_${userId}`,
        action: TagActionType.DELETE,
        reason: `清理${thresholdDays}天未使用的冗余标签，共删除${deletedCount}个`
      } as any)
    }

    return {
      scanned: unusedTags.length,
      deleted: deletedCount,
      thresholdDays
    }
  },

  async cleanUnusedTags(thresholdDays: number = 90) {
    return this.cleanUnused(thresholdDays)
  },

  async getReviewReport(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const totalTags = await Tag.count()
    const enabledTags = await Tag.count({ where: { status: TagStatus.ENABLED } })
    const disabledTags = await Tag.count({ where: { status: TagStatus.DISABLED } })
    const hotTags = await Tag.count({ where: { hotLevel: HotLevel.HOT } })
    const coreTags = await Tag.count({ where: { isCore: 1 } })
    const totalUsageLogs = await TagUsageLog.count()

    const periodLogs = await TagUsageLog.count({
      where: { createTime: { [Op.gte]: startDate } }
    })

    const tagCreations = await TagUsageLog.count({
      where: { action: TagActionType.CREATE, createTime: { [Op.gte]: startDate } }
    })

    const tagBindings = await TagUsageLog.count({
      where: { action: TagActionType.BIND, createTime: { [Op.gte]: startDate } }
    })

    const tagUnbindings = await TagUsageLog.count({
      where: { action: TagActionType.UNBIND, createTime: { [Op.gte]: startDate } }
    })

    const topUsedTags = await Tag.findAll({
      where: { status: TagStatus.ENABLED },
      attributes: [
        'id',
        'name',
        'type',
        'useCount',
        'hotLevel',
        'isCore',
        [literal('use_count'), 'usageScore']
      ],
      order: [[literal('use_count'), 'DESC']],
      limit: 20
    })

    const unusedTagsCount = await Tag.count({
      where: {
        useCount: 0,
        status: TagStatus.ENABLED,
        createTime: { [Op.lte]: startDate }
      }
    })

    const byType = await Tag.findAll({
      attributes: [
        'type',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('use_count')), 'totalUse']
      ],
      group: ['type'],
      raw: true
    })

    const trendData = await TagUsageLog.findAll({
      where: { createTime: { [Op.gte]: startDate } },
      attributes: [
        [fn('DATE', col('create_time')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE', col('create_time'))],
      order: [[fn('DATE', col('create_time')), 'ASC']],
      raw: true
    })

    return {
      summary: {
        totalTags,
        enabledTags,
        disabledTags,
        hotTags,
        coreTags,
        totalUsageLogs,
        periodLogs,
        tagCreations,
        tagBindings,
        tagUnbindings,
        unusedTagsCount
      },
      topUsedTags,
      byType,
      trendData,
      days
    }
  }
}

export const tagService = tagManagementService
