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

async function createSilhouette(req, res, next) {
  try {
    const { name, width, height, scene, category, status } = req.body;
    const cover = req.file ? `/uploads/${path.relative(path.join(__dirname, '..', '..'), req.file.path).replace(/\\/g, '/')}` : null;

    if (!name) {
      return res.status(400).json(businessError(ErrorCode.PARAM_MISSING, '素材名称不能为空'));
    }

    const material = await SilhouetteMaterial.create({
      name,
      cover,
      width: width || null,
      height: height || null,
      scene: scene || null,
      category: category || null,
      status: status !== undefined ? Number(status) : 1
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

    if (name !== undefined) updateData.name = name;
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

    if (material.cover) {
      const filePath = path.join(__dirname, '..', '..', material.cover.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await material.destroy();
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

    for (const material of materials) {
      if (material.cover) {
        const filePath = path.join(__dirname, '..', '..', material.cover.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await SilhouetteMaterial.destroy({ where: { id: { [Op.in]: ids } } });
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
    res.json(success(material, Number(status) === 1 ? '上架成功' : '下架成功'));
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

    res.json(success(null, Number(status) === 1 ? '批量上架成功' : '批量下架成功'));
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

module.exports = {
  getSilhouetteList,
  createSilhouette,
  updateSilhouette,
  deleteSilhouette,
  batchDeleteSilhouette,
  updateStatus,
  batchUpdateStatus,
  getCategoryList
};
