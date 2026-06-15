const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const VisualTemplate = require('../models/VisualTemplate');
const { success, businessError } = require('../utils/response');
const { ErrorCode, ErrorMessage } = require('../constants/errorCode');

async function getTemplateList(req, res, next) {
  try {
    const {
      page = 1,
      pageSize = 20,
      name,
      style_type,
      scene,
      status,
      start_time,
      end_time,
      use_count_min,
      use_count_max
    } = req.query;

    const where = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    if (style_type) {
      where.style_type = style_type;
    }
    if (scene) {
      where.scene = { [Op.like]: `%${scene}%` };
    }
    if (status !== undefined && status !== '') {
      where.status = Number(status);
    }
    if (start_time) {
      where.created_at = { [Op.gte]: start_time };
    }
    if (end_time) {
      where.created_at = where.created_at || {};
      where.created_at[Op.lte] = end_time;
    }
    if (use_count_min !== undefined && use_count_min !== '') {
      where.use_count = { [Op.gte]: Number(use_count_min) };
    }
    if (use_count_max !== undefined && use_count_max !== '') {
      where.use_count = where.use_count || {};
      where.use_count[Op.lte] = Number(use_count_max);
    }

    const { count, rows } = await VisualTemplate.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });

    res.json(success({
      list: rows.map(r => r.toJSON()),
      total: count,
      page: Number(page),
      pageSize: Number(pageSize)
    }));
  } catch (err) {
    next(err);
  }
}

async function getTemplateDetail(req, res, next) {
  try {
    const { id } = req.params;
    const template = await VisualTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        code: ErrorCode.DATA_NOT_EXIST,
        message: ErrorMessage[ErrorCode.DATA_NOT_EXIST],
        data: null
      });
    }
    res.json(success(template.toJSON()));
  } catch (err) {
    next(err);
  }
}

async function checkNameUnique(req, res, next) {
  try {
    const { name, excludeId } = req.query;
    if (!name) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '模板名称不能为空'));
    }

    const where = { name };
    if (excludeId) {
      where.id = { [Op.ne]: Number(excludeId) };
    }

    const count = await VisualTemplate.count({ where });
    res.json(success({ unique: count === 0 }));
  } catch (err) {
    next(err);
  }
}

async function createTemplate(req, res, next) {
  try {
    const { name, style_type, scene, status } = req.body;
    const cover = req.file ? `/uploads/${path.relative(path.join(__dirname, '..', '..'), req.file.path).replace(/\\/g, '/')}` : null;

    if (!name) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '模板名称不能为空'));
    }

    const existing = await VisualTemplate.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json(businessError(ErrorCode.DATA_ALREADY_EXIST, '模板名称已存在'));
    }

    const template = await VisualTemplate.create({
      name,
      cover,
      style_type: style_type || null,
      scene: scene || null,
      status: status !== undefined ? Number(status) : 1
    });

    res.json(success(template.toJSON(), '创建成功'));
  } catch (err) {
    next(err);
  }
}

async function updateTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const template = await VisualTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        code: ErrorCode.DATA_NOT_EXIST,
        message: ErrorMessage[ErrorCode.DATA_NOT_EXIST],
        data: null
      });
    }

    const { name, style_type, scene, status, cover: bodyCover } = req.body;
    const updateData = {};
    const oldStyleType = template.style_type;

    if (name !== undefined) {
      const existing = await VisualTemplate.findOne({
        where: { name, id: { [Op.ne]: id } }
      });
      if (existing) {
        return res.status(400).json(businessError(ErrorCode.DATA_ALREADY_EXIST, '模板名称已存在'));
      }
      updateData.name = name;
    }
    if (style_type !== undefined) updateData.style_type = style_type || null;
    if (scene !== undefined) updateData.scene = scene;
    if (status !== undefined) updateData.status = Number(status);

    if (req.file) {
      if (template.cover) {
        const oldPath = path.join(__dirname, '..', '..', template.cover.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateData.cover = `/uploads/${path.relative(path.join(__dirname, '..', '..'), req.file.path).replace(/\\/g, '/')}`;
    } else if (bodyCover !== undefined && bodyCover !== '') {
      updateData.cover = bodyCover;
    }

    await template.update(updateData);

    // 风格类型变更后，检查旧风格类型是否还有模板使用
    if (style_type !== undefined && oldStyleType && oldStyleType !== style_type) {
      await cleanupEmptyStyleType(oldStyleType);
    }

    res.json(success(template.toJSON(), '更新成功'));
  } catch (err) {
    next(err);
  }
}

async function cleanupEmptyStyleType(styleType) {
  if (!styleType) return;
  const count = await VisualTemplate.count({ where: { style_type: styleType } });
  if (count === 0) {
    // 该风格类型下已无模板，自然从列表中消失（无需额外表）
  }
}

async function deleteTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const template = await VisualTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        code: ErrorCode.DATA_NOT_EXIST,
        message: ErrorMessage[ErrorCode.DATA_NOT_EXIST],
        data: null
      });
    }

    const deletedStyleType = template.style_type;

    if (template.cover) {
      const filePath = path.join(__dirname, '..', '..', template.cover.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await template.destroy();
    await cleanupEmptyStyleType(deletedStyleType);
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
}

async function batchDeleteTemplate(req, res, next) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '请选择要删除的模板'));
    }

    const templates = await VisualTemplate.findAll({ where: { id: { [Op.in]: ids } } });
    const styleTypes = templates.map(t => t.style_type).filter(Boolean);

    for (const template of templates) {
      if (template.cover) {
        const filePath = path.join(__dirname, '..', '..', template.cover.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await VisualTemplate.destroy({ where: { id: { [Op.in]: ids } } });

    for (const st of [...new Set(styleTypes)]) {
      await cleanupEmptyStyleType(st);
    }

    res.json(success(null, '批量删除成功'));
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '状态值不能为空'));
    }

    const template = await VisualTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        code: ErrorCode.DATA_NOT_EXIST,
        message: ErrorMessage[ErrorCode.DATA_NOT_EXIST],
        data: null
      });
    }

    await template.update({ status: Number(status) });
    const statusMap = { 0: '停用成功', 1: '启用成功' };
    res.json(success(template.toJSON(), statusMap[status] || '状态更新成功'));
  } catch (err) {
    next(err);
  }
}

async function batchUpdateStatus(req, res, next) {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '请选择要操作的模板'));
    }
    if (status === undefined) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '状态值不能为空'));
    }

    await VisualTemplate.update(
      { status: Number(status) },
      { where: { id: { [Op.in]: ids } } }
    );

    const statusMap = { 0: '批量停用成功', 1: '批量启用成功' };
    res.json(success(null, statusMap[status] || '批量状态更新成功'));
  } catch (err) {
    next(err);
  }
}

async function getStyleTypeList(req, res, next) {
  try {
    const styleTypes = await VisualTemplate.findAll({
      attributes: ['style_type'],
      group: 'style_type',
      where: {
        style_type: { [Op.ne]: null }
      },
      order: [['style_type', 'ASC']],
      raw: true
    });
    const list = styleTypes.map(s => s.style_type).filter(Boolean);
    res.json(success(list));
  } catch (err) {
    next(err);
  }
}

async function exportTemplate(req, res, next) {
  try {
    const {
      name,
      style_type,
      scene,
      status,
      start_time,
      end_time,
      use_count_min,
      use_count_max
    } = req.query;

    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (style_type) where.style_type = style_type;
    if (scene) where.scene = { [Op.like]: `%${scene}%` };
    if (status !== undefined && status !== '') where.status = Number(status);
    if (start_time) where.created_at = { [Op.gte]: start_time };
    if (end_time) {
      where.created_at = where.created_at || {};
      where.created_at[Op.lte] = end_time;
    }
    if (use_count_min !== undefined && use_count_min !== '') {
      where.use_count = { [Op.gte]: Number(use_count_min) };
    }
    if (use_count_max !== undefined && use_count_max !== '') {
      where.use_count = where.use_count || {};
      where.use_count[Op.lte] = Number(use_count_max);
    }

    const list = await VisualTemplate.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json(success(list.map(r => r.toJSON())));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTemplateList,
  getTemplateDetail,
  checkNameUnique,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  batchDeleteTemplate,
  updateStatus,
  batchUpdateStatus,
  getStyleTypeList,
  exportTemplate
};
