const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const SilhouetteMaterial = require('../models/SilhouetteMaterial');
const { success, businessError } = require('../utils/response');
const { ErrorCode, ErrorMessage } = require('../constants/errorCode');

async function getSilhouetteList(req, res, next) {
  try {
    const {
      page = 1,
      pageSize = 20,
      name,
      category,
      status,
      scene
    } = req.query;

    const where = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    if (category) {
      where.category = category;
    }
    if (scene) {
      where.scene = { [Op.like]: `%${scene}%` };
    }
    if (status !== undefined && status !== '') {
      where.status = Number(status);
    }

    const { count, rows } = await SilhouetteMaterial.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });

    res.json(success({
      list: rows,
      total: count,
      page: Number(page),
      pageSize: Number(pageSize)
    }));
  } catch (err) {
    next(err);
  }
}

async function getSilhouetteDetail(req, res, next) {
  try {
    const { id } = req.params;
    const material = await SilhouetteMaterial.findByPk(id);
    if (!material) {
      return res.status(404).json({
        code: ErrorCode.DATA_NOT_EXIST,
        message: ErrorMessage[ErrorCode.DATA_NOT_EXIST],
        data: null
      });
    }
    res.json(success(material));
  } catch (err) {
    next(err);
  }
}

async function checkNameUnique(req, res, next) {
  try {
    const { name, excludeId } = req.query;
    if (!name) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '名称不能为空'));
    }

    const where = { name };
    if (excludeId) {
      where.id = { [Op.ne]: Number(excludeId) };
    }

    const count = await SilhouetteMaterial.count({ where });
    res.json(success({ unique: count === 0 }));
  } catch (err) {
    next(err);
  }
}

async function createSilhouette(req, res, next) {
  try {
    const { name, width, height, scene, category, status } = req.body;
    const cover = req.file ? `/uploads/${path.relative(path.join(__dirname, '..', '..'), req.file.path).replace(/\\/g, '/')}` : null;

    if (!name) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '素材名称不能为空'));
    }

    const existing = await SilhouetteMaterial.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json(businessError(ErrorCode.DATA_ALREADY_EXIST, '素材名称已存在'));
    }

    const material = await SilhouetteMaterial.create({
      name,
      cover,
      width: width || null,
      height: height || null,
      scene: scene || null,
      category: category || null,
      status: status !== undefined ? Number(status) : 2
    });

    res.json(success(material, '创建成功'));
  } catch (err) {
    next(err);
  }
}

async function updateSilhouette(req, res, next) {
  try {
    const { id } = req.params;
    const material = await SilhouetteMaterial.findByPk(id);
    if (!material) {
      return res.status(404).json({
        code: ErrorCode.DATA_NOT_EXIST,
        message: ErrorMessage[ErrorCode.DATA_NOT_EXIST],
        data: null
      });
    }

    const { name, width, height, scene, category, status } = req.body;
    const updateData = {};

    if (name !== undefined) {
      const existing = await SilhouetteMaterial.findOne({
        where: { name, id: { [Op.ne]: id } }
      });
      if (existing) {
        return res.status(400).json(businessError(ErrorCode.DATA_ALREADY_EXIST, '素材名称已存在'));
      }
      updateData.name = name;
    }
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;
    if (scene !== undefined) updateData.scene = scene;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = Number(status);

    if (req.file) {
      if (material.cover) {
        const oldPath = path.join(__dirname, '..', '..', material.cover.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateData.cover = `/uploads/${path.relative(path.join(__dirname, '..', '..'), req.file.path).replace(/\\/g, '/')}`;
    }

    await material.update(updateData);
    res.json(success(material, '更新成功'));
  } catch (err) {
    next(err);
  }
}

async function cleanupEmptyCategories(excludeCategory) {
  if (!excludeCategory) return;
  const count = await SilhouetteMaterial.count({ where: { category: excludeCategory } });
  if (count === 0) {
    // 分类下已无素材，分类自然消失（无需额外表）
  }
}

async function deleteSilhouette(req, res, next) {
  try {
    const { id } = req.params;
    const material = await SilhouetteMaterial.findByPk(id);
    if (!material) {
      return res.status(404).json({
        code: ErrorCode.DATA_NOT_EXIST,
        message: ErrorMessage[ErrorCode.DATA_NOT_EXIST],
        data: null
      });
    }

    const deletedCategory = material.category;

    if (material.cover) {
      const filePath = path.join(__dirname, '..', '..', material.cover.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await material.destroy();
    await cleanupEmptyCategories(deletedCategory);
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
}

async function batchDeleteSilhouette(req, res, next) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '请选择要删除的素材'));
    }

    const materials = await SilhouetteMaterial.findAll({ where: { id: { [Op.in]: ids } } });
    const categories = materials.map(m => m.category).filter(Boolean);

    for (const material of materials) {
      if (material.cover) {
        const filePath = path.join(__dirname, '..', '..', material.cover.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await SilhouetteMaterial.destroy({ where: { id: { [Op.in]: ids } } });

    for (const cat of [...new Set(categories)]) {
      await cleanupEmptyCategories(cat);
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

    const material = await SilhouetteMaterial.findByPk(id);
    if (!material) {
      return res.status(404).json({
        code: ErrorCode.DATA_NOT_EXIST,
        message: ErrorMessage[ErrorCode.DATA_NOT_EXIST],
        data: null
      });
    }

    await material.update({ status: Number(status) });
    const statusMap = { 0: '下架成功', 1: '上架成功', 2: '设为待审核成功' };
    res.json(success(material, statusMap[status] || '状态更新成功'));
  } catch (err) {
    next(err);
  }
}

async function batchUpdateStatus(req, res, next) {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '请选择要操作的素材'));
    }
    if (status === undefined) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '状态值不能为空'));
    }

    await SilhouetteMaterial.update(
      { status: Number(status) },
      { where: { id: { [Op.in]: ids } } }
    );

    const statusMap = { 0: '批量下架成功', 1: '批量上架成功', 2: '批量设为待审核成功' };
    res.json(success(null, statusMap[status] || '批量状态更新成功'));
  } catch (err) {
    next(err);
  }
}

async function getCategoryList(req, res, next) {
  try {
    const categories = await SilhouetteMaterial.findAll({
      attributes: ['category'],
      group: 'category',
      where: {
        category: { [Op.ne]: null }
      },
      order: [['category', 'ASC']],
      raw: true
    });
    const list = categories.map(c => c.category).filter(Boolean);
    res.json(success(list));
  } catch (err) {
    next(err);
  }
}

async function exportSilhouette(req, res, next) {
  try {
    const { name, category, status, scene } = req.query;

    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (category) where.category = category;
    if (scene) where.scene = { [Op.like]: `%${scene}%` };
    if (status !== undefined && status !== '') where.status = Number(status);

    const list = await SilhouetteMaterial.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json(success(list));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSilhouetteList,
  getSilhouetteDetail,
  checkNameUnique,
  createSilhouette,
  updateSilhouette,
  deleteSilhouette,
  batchDeleteSilhouette,
  updateStatus,
  batchUpdateStatus,
  getCategoryList,
  exportSilhouette
};
