const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { Work } = require('../models');
const { success, badRequest, notFound, sendSuccess } = require('../utils/response');

const getWorks = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 10, title, author_nickname, status, category } = req.query;
  const offset = (page - 1) * pageSize;

  const where = {};
  if (title) where.title = { [Op.like]: `%${title}%` };
  if (author_nickname) where.author_nickname = { [Op.like]: `%${author_nickname}%` };
  if (status !== undefined && status !== '') where.status = status;
  if (category) where.category = category;

  const { count, rows } = await Work.findAndCountAll({
    where,
    offset,
    limit: parseInt(pageSize),
    order: [['id', 'DESC']]
  });

  sendSuccess(res, {
    list: rows,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  }, '获取作品列表成功');
});

const getWorkById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const work = await Work.findByPk(id);

  if (!work) {
    return res.status(404).json(notFound('作品不存在'));
  }

  sendSuccess(res, work, '获取作品详情成功');
});

const createWork = asyncHandler(async (req, res) => {
  const { title, description, cover_image, author_id, author_nickname, category, status = 1 } = req.body;

  if (!title) {
    return res.status(400).json(badRequest('作品标题不能为空'));
  }

  if (!author_id) {
    return res.status(400).json(badRequest('作者ID不能为空'));
  }

  const work = await Work.create({
    title,
    description: description || '',
    cover_image: cover_image || '',
    author_id,
    author_nickname: author_nickname || '',
    category: category || '',
    status,
    view_count: 0,
    like_count: 0,
    comment_count: 0
  });

  sendSuccess(res, work, '创建作品成功', 201);
});

const updateWork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, cover_image, category, status } = req.body;

  const work = await Work.findByPk(id);
  if (!work) {
    return res.status(404).json(notFound('作品不存在'));
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (cover_image !== undefined) updateData.cover_image = cover_image;
  if (category !== undefined) updateData.category = category;
  if (status !== undefined) updateData.status = status;

  await work.update(updateData);

  sendSuccess(res, work, '更新作品成功');
});

const deleteWork = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const work = await Work.findByPk(id);
  if (!work) {
    return res.status(404).json(notFound('作品不存在'));
  }

  await work.destroy();

  sendSuccess(res, null, '删除作品成功');
});

const batchDeleteWork = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json(badRequest('请选择要删除的作品'));
  }

  await Work.destroy({
    where: {
      id: {
        [Op.in]: ids
      }
    }
  });

  sendSuccess(res, null, `成功删除 ${ids.length} 个作品`);
});

const publishWork = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const work = await Work.findByPk(id);
  if (!work) {
    return res.status(404).json(notFound('作品不存在'));
  }

  await work.update({ status: 1 });

  sendSuccess(res, work, '上架成功');
});

const offlineWork = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const work = await Work.findByPk(id);
  if (!work) {
    return res.status(404).json(notFound('作品不存在'));
  }

  await work.update({ status: 0 });

  sendSuccess(res, work, '下架成功');
});

const batchPublishWork = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json(badRequest('请选择要上架的作品'));
  }

  await Work.update(
    { status: 1 },
    {
      where: {
        id: {
          [Op.in]: ids
        }
      }
    }
  );

  sendSuccess(res, null, `成功上架 ${ids.length} 个作品`);
});

const batchOfflineWork = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json(badRequest('请选择要下架的作品'));
  }

  await Work.update(
    { status: 0 },
    {
      where: {
        id: {
          [Op.in]: ids
        }
      }
    }
  );

  sendSuccess(res, null, `成功下架 ${ids.length} 个作品`);
});

module.exports = {
  getWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
  batchDeleteWork,
  publishWork,
  offlineWork,
  batchPublishWork,
  batchOfflineWork
};
