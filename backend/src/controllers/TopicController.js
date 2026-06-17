const TopicService = require('../services/TopicService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

const contentListSchema = Joi.array().items(Joi.object({
  contentId: Joi.number().integer().required(),
  sortOrder: Joi.number().integer().min(0),
  weightScore: Joi.number().min(0).max(100),
  isRecommended: Joi.number().integer().valid(0, 1),
})).min(1);

const orderListSchema = Joi.array().items(Joi.object({
  id: Joi.number().integer().required(),
  sortOrder: Joi.number().integer().min(0).required(),
})).min(1);

class TopicController {
  getList = [
    validate(paginationSchema.keys({
      topicType: Joi.number().integer().valid(0, 1, 2, 3, 4).allow(null, ''),
      status: Joi.number().integer().valid(0, 1, 2, 3, 4).allow(null, ''),
      isCore: Joi.number().integer().valid(0, 1).allow(null, ''),
      operationBatch: Joi.string().trim().allow(null, ''),
      creatorId: Joi.number().integer().allow(null, ''),
      hotScoreMin: Joi.number().allow(null, ''),
      dateRange: Joi.array().items(Joi.date()).length(2).allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await TopicService.getTopicList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getDetail = [
    async (req, res, next) => {
      try {
        const result = await TopicService.getTopicDetail(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  create = [
    validate(Joi.object({
      title: Joi.string().required().max(200),
      subtitle: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      topicType: Joi.number().integer().required().valid(0, 1, 2, 3, 4),
      coverImage: Joi.string().allow(null, ''),
      coverTemplate: Joi.string().allow(null, ''),
      bannerImage: Joi.string().allow(null, ''),
      iconImage: Joi.string().allow(null, ''),
      backgroundColor: Joi.string().allow(null, ''),
      sortRule: Joi.number().integer().valid(0, 1, 2, 3, 4),
      weightScore: Joi.number().min(0).max(100),
      hotScore: Joi.number(),
      isCore: Joi.number().integer().valid(0, 1),
      operationBatch: Joi.string().allow(null, ''),
      operationStartTime: Joi.date().allow(null, ''),
      operationEndTime: Joi.date().allow(null, ''),
      tags: Joi.array().items(Joi.string()).allow(null, ''),
      remark: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        const result = await TopicService.createTopic(
          req.body,
          req.user?.userId,
          req.user?.username,
          ip
        );
        return created(res, result, '专题创建成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  update = [
    validate(Joi.object({
      title: Joi.string().max(200),
      subtitle: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      topicType: Joi.number().integer().valid(0, 1, 2, 3, 4),
      coverImage: Joi.string().allow(null, ''),
      coverTemplate: Joi.string().allow(null, ''),
      bannerImage: Joi.string().allow(null, ''),
      iconImage: Joi.string().allow(null, ''),
      backgroundColor: Joi.string().allow(null, ''),
      sortRule: Joi.number().integer().valid(0, 1, 2, 3, 4),
      weightScore: Joi.number().min(0).max(100),
      hotScore: Joi.number(),
      isCore: Joi.number().integer().valid(0, 1),
      operationBatch: Joi.string().allow(null, ''),
      operationStartTime: Joi.date().allow(null, ''),
      operationEndTime: Joi.date().allow(null, ''),
      tags: Joi.array().items(Joi.string()).allow(null, ''),
      remark: Joi.string().allow(null, ''),
      status: Joi.number().integer().valid(0, 1, 2, 3, 4),
    })),
    async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        const result = await TopicService.updateTopic(
          parseInt(req.params.id),
          req.body,
          req.user?.userId,
          req.user?.username,
          ip
        );
        return success(res, result, '专题更新成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  changeStatus = [
    validate(Joi.object({
      toStatus: Joi.number().integer().required().valid(0, 1, 2, 3, 4),
      reason: Joi.string().allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        await TopicService.changeTopicStatus(
          parseInt(req.params.id),
          req.body.toStatus,
          req.body.reason,
          req.user?.userId,
          req.user?.username,
          ip
        );
        return success(res, null, '状态变更成功');
      } catch (error) {
        next(error);
      }
    }
  ];

  mountContent = [
    validate(Joi.object({
      contentList: contentListSchema.required(),
    })),
    async (req, res, next) => {
      try {
        const result = await TopicService.mountContent(
          parseInt(req.params.id),
          req.body.contentList,
          req.user?.userId,
          req.user?.username
        );
        return success(res, result, `内容挂载成功：挂载${result.mountedCount}条，当前共${result.totalCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  unmountContent = [
    validate(Joi.object({
      contentIds: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await TopicService.unmountContent(
          parseInt(req.params.id),
          req.body.contentIds,
          req.user?.userId,
          req.user?.username
        );
        return success(res, result, `内容卸载成功：卸载${result.unmountedCount}条，当前共${result.totalCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  reorderContents = [
    validate(Joi.object({
      orderList: orderListSchema.required(),
    })),
    async (req, res, next) => {
      try {
        const result = await TopicService.reorderContents(
          parseInt(req.params.id),
          req.body.orderList,
          req.user?.userId
        );
        return success(res, result, `内容排序完成：调整${result.reorderedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchEnable = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await TopicService.batchEnableTopics(
          req.body.ids,
          req.user?.userId
        );
        return success(res, result, `批量上线完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchDisable = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      reason: Joi.string().required(),
    })),
    async (req, res, next) => {
      try {
        const result = await TopicService.batchDisableTopics(
          req.body.ids,
          req.body.reason,
          req.user?.userId
        );
        return success(res, result, `批量停用完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchSupplement = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      contentIds: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await TopicService.batchSupplementContents(
          req.body.ids,
          req.body.contentIds,
          req.user?.userId
        );
        return success(res, result, `批量补充内容完成：新增${result.totalAdded}条，跳过${result.totalSkipped}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  batchUpdateWeight = [
    validate(Joi.object({
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
      weightScore: Joi.number().min(0).max(100).required(),
    })),
    async (req, res, next) => {
      try {
        const result = await TopicService.batchUpdateTopicWeight(
          req.body.ids,
          req.body.weightScore,
          req.user?.userId
        );
        return success(res, result, `批量修改权重完成：成功${result.successCount}条，跳过${result.skippedCount}条`);
      } catch (error) {
        next(error);
      }
    }
  ];

  checkTitleUnique = [
    validate(Joi.object({
      title: Joi.string().required().max(200),
      topicType: Joi.number().integer().required().valid(0, 1, 2, 3, 4),
      excludeId: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await TopicService.checkTopicTitleUnique(
          req.query.title,
          parseInt(req.query.topicType, 10),
          req.query.excludeId ? parseInt(req.query.excludeId, 10) : null
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  checkTimeOverlap = [
    validate(Joi.object({
      topicType: Joi.number().integer().required().valid(0, 1, 2, 3, 4),
      startTime: Joi.date().required(),
      endTime: Joi.date().required(),
      excludeId: Joi.number().integer().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await TopicService.checkTimeOverlap(
          parseInt(req.query.topicType, 10),
          req.query.startTime,
          req.query.endTime,
          req.query.excludeId ? parseInt(req.query.excludeId, 10) : null
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  checkContentMounted = [
    validate(Joi.object({
      topicId: Joi.number().integer().required(),
      contentIds: Joi.array().items(Joi.number().integer()).min(1).required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const contentIds = Array.isArray(req.query.contentIds)
          ? req.query.contentIds
          : String(req.query.contentIds).split(',').map(Number);
        const result = await TopicService.checkContentMounted(
          parseInt(req.query.topicId, 10),
          contentIds
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new TopicController();
