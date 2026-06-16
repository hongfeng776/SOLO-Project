const { Op } = require('sequelize')
const { MarketingCampaign } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      type,
      status
    } = req.query

    const where = {}

    if (type !== undefined && type !== '') where.type = type
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await MarketingCampaign.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)
    res.json(success(campaign))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    const campaign = await MarketingCampaign.create(data)
    res.json(success(campaign, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)
    await campaign.update(data)
    res.json(success(campaign, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params
    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)
    await campaign.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    const statusMap = { 0: '草稿', 1: '进行中', 2: '已结束', 3: '已暂停' }
    await campaign.update({ status })
    res.json(success(null, `活动已更新为${statusMap[status] || '未知状态'}`))
  } catch (error) {
    next(error)
  }
}

const getStatistics = async (req, res, next) => {
  try {
    const { id } = req.params
    const campaign = await MarketingCampaign.findByPk(id)
    if (!campaign) throw new AppError('活动不存在', 404, 404)

    res.json(success({
      participantCount: campaign.participantCount,
      orderCount: campaign.orderCount,
      subsidyAmount: campaign.usedBudget,
      budgetUsage: campaign.budget > 0
        ? ((campaign.usedBudget / campaign.budget) * 100).toFixed(1)
        : '0.0'
    }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deleteCampaign,
  updateStatus,
  getStatistics
}
