const userService = require('../services/userService')
const accountService = require('../services/accountService')
const riskControlService = require('../services/riskControlService')
const memberLevelService = require('../services/memberLevelService')
const memberTagService = require('../services/memberTagService')
const loginService = require('../services/loginService')
const ApiResponse = require('../utils/response')

class UserController {
  async getList(req, res, next) {
    try {
      const result = await userService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const user = await userService.getDetail(parseInt(id))
      res.json(ApiResponse.success(user))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        ip: req.ip
      }
      const user = await accountService.createAccount(req.body, operatorInfo)
      res.json(ApiResponse.success(user, '创建成功'))
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        ip: req.ip
      }
      const result = await accountService.editWithVerification(
        parseInt(id),
        req.body,
        operatorInfo,
        req.body.verifyPassword
      )
      res.json(ApiResponse.success(result, '更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      await userService.delete(parseInt(id))
      res.json(ApiResponse.success(null, '删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchDelete(req, res, next) {
    try {
      const { ids } = req.body
      await userService.batchDelete(ids)
      res.json(ApiResponse.success(null, '批量删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      const result = await riskControlService.changeStatus(
        parseInt(id),
        {
          newStatus: req.body.status,
          reason: req.body.reason,
          statusExpireAt: req.body.statusExpireAt,
          linkedViolationId: req.body.linkedViolationId,
          linkedAppealId: req.body.linkedAppealId,
          force: req.body.force
        },
        operatorInfo
      )
      res.json(ApiResponse.success(result, '状态变更成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchChangeStatus(req, res, next) {
    try {
      const { ids, ...rest } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      const result = await riskControlService.batchChangeStatus(
        ids,
        rest,
        operatorInfo
      )
      res.json(ApiResponse.success(result, '批量状态变更完成'))
    } catch (error) {
      next(error)
    }
  }

  async getRiskPreview(req, res, next) {
    try {
      const { id } = req.params
      const { newStatus } = req.query
      const result = await riskControlService.getRiskPreview(
        parseInt(id),
        newStatus,
        req.user?.role
      )
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getStatusLogs(req, res, next) {
    try {
      const { userId } = req.params
      const result = await riskControlService.getStatusLogs(parseInt(userId), req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getChangeStats(req, res, next) {
    try {
      const { userId } = req.params
      const result = await riskControlService.getChangeStats(parseInt(userId))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async validateAccount(req, res, next) {
    try {
      const { phone, nickname, uid, excludeUserId } = req.query
      const result = await accountService.validateAccount(
        { phone, nickname, uid },
        excludeUserId ? parseInt(excludeUserId) : null
      )
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getEditLogs(req, res, next) {
    try {
      const { userId } = req.params
      const result = await accountService.getEditLogs(parseInt(userId), req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async batchUpdate(req, res, next) {
    try {
      const { ids, ...data } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        ip: req.ip
      }
      const result = await accountService.batchUpdate(ids, data, operatorInfo)
      res.json(ApiResponse.success(result, '批量更新完成'))
    } catch (error) {
      next(error)
    }
  }

  async traceAccount(req, res, next) {
    try {
      const operatorInfo = {
        operatorId: req.user?.id,
        operatorName: req.user?.username
      }
      const result = await accountService.traceAccount({ ...req.query, ...operatorInfo })
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getComplianceLogs(req, res, next) {
    try {
      const result = await accountService.getComplianceLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  // ================= 层级管理 =================
  async getLevelCriteriaMeta(req, res, next) {
    try {
      const result = await memberLevelService.getCriteriaMeta()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getLevelPreview(req, res, next) {
    try {
      const { userId } = req.params
      const { targetLevel, force } = req.query
      const result = await memberLevelService.getLevelPreview(
        parseInt(userId),
        targetLevel,
        force === 'true' || force === true
      )
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async changeLevel(req, res, next) {
    try {
      const { userId } = req.params
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const result = await memberLevelService.changeLevel(
        parseInt(userId),
        req.body.targetLevel,
        { force: req.body.force, reason: req.body.reason },
        operatorInfo
      )
      res.json(ApiResponse.success(result, '层级变更成功'))
    } catch (error) {
      next(error)
    }
  }

  async getLevelLogs(req, res, next) {
    try {
      const { userId } = req.params
      const result = await memberLevelService.getLevelLogs(parseInt(userId), req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  // ================= 标签管理 =================
  async getTagMeta(req, res, next) {
    try {
      const result = await memberTagService.getTagMeta()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async validateTagName(req, res, next) {
    try {
      const { name, excludeId } = req.query
      const result = await memberTagService.validateTagName(name, excludeId ? parseInt(excludeId) : null)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async listTagDefinitions(req, res, next) {
    try {
      const result = await memberTagService.listTagDefinitions(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async createTagDefinition(req, res, next) {
    try {
      const operatorInfo = { id: req.user?.id, username: req.user?.username }
      const result = await memberTagService.createTagDefinition(req.body, operatorInfo)
      res.json(ApiResponse.success(result, '标签定义创建成功'))
    } catch (error) {
      next(error)
    }
  }

  async updateTagDefinition(req, res, next) {
    try {
      const { id } = req.params
      const operatorInfo = { id: req.user?.id, username: req.user?.username }
      const result = await memberTagService.updateTagDefinition(parseInt(id), req.body, operatorInfo)
      res.json(ApiResponse.success(result, '标签定义更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async checkUserTagMatch(req, res, next) {
    try {
      const { userId } = req.params
      const { tagName } = req.query
      const result = await memberTagService.checkUserTagMatch(parseInt(userId), tagName)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async addUserTags(req, res, next) {
    try {
      const { userId } = req.params
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const result = await memberTagService.addTagsToUser(
        parseInt(userId),
        req.body.tagNames || [],
        operatorInfo,
        req.body.reason || ''
      )
      res.json(ApiResponse.success(result, '标签添加完成'))
    } catch (error) {
      next(error)
    }
  }

  async removeUserTags(req, res, next) {
    try {
      const { userId } = req.params
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const result = await memberTagService.removeTagsFromUser(
        parseInt(userId),
        req.body.tagNames || [],
        operatorInfo,
        req.body.reason || ''
      )
      res.json(ApiResponse.success(result, '标签移除完成'))
    } catch (error) {
      next(error)
    }
  }

  async batchApplyTags(req, res, next) {
    try {
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const result = await memberTagService.batchApplyTags(req.body, operatorInfo)
      res.json(ApiResponse.success(result, '批量标签配置完成'))
    } catch (error) {
      next(error)
    }
  }

  async getTagLogs(req, res, next) {
    try {
      const { userId } = req.params
      const result = await memberTagService.getTagLogs(parseInt(userId), req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getTagTrace(req, res, next) {
    try {
      const { userId } = req.params
      const result = await memberTagService.getTagTrace(parseInt(userId))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async cleanRedundantTags(req, res, next) {
    try {
      const { userId } = req.params
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const result = await memberTagService.cleanRedundantTags(parseInt(userId), operatorInfo)
      res.json(ApiResponse.success(result, '冗余标签清理完成'))
    } catch (error) {
      next(error)
    }
  }

  // ================= 登录行为管控 =================
  async getLoginThresholdsMeta(req, res, next) {
    try { res.json(ApiResponse.success(await loginService.getThresholdsMeta())) }
    catch (e) { next(e) }
  }

  async queryLoginLogs(req, res, next) {
    try {
      const result = await loginService.queryLoginLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (e) { next(e) }
  }

  async getLoginDetail(req, res, next) {
    try {
      const { loginId } = req.params
      const result = await loginService.getLoginDetail(parseInt(loginId))
      res.json(ApiResponse.success(result))
    } catch (e) { next(e) }
  }

  async markRiskLog(req, res, next) {
    try {
      const { loginId } = req.params
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const result = await loginService.markRiskLog(parseInt(loginId), req.body.reason || '人工标记风险', operatorInfo)
      res.json(ApiResponse.success(result, '标记风险成功'))
    } catch (e) { next(e) }
  }

  async clearRiskLog(req, res, next) {
    try {
      const { loginId } = req.params
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const result = await loginService.clearRiskLog(parseInt(loginId), req.body.reason || '人工清除标记', operatorInfo)
      res.json(ApiResponse.success(result, '清除标记成功'))
    } catch (e) { next(e) }
  }

  async batchProcessLoginLogs(req, res, next) {
    try {
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const result = await loginService.batchProcessLoginLogs(req.body, operatorInfo)
      res.json(ApiResponse.success(result, `批量处理完成：成功${result.successCount}，失败${result.failedCount}`))
    } catch (e) { next(e) }
  }

  async listLoginDevices(req, res, next) {
    try {
      const { userId } = req.params
      const result = await loginService.listDevices(parseInt(userId), req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (e) { next(e) }
  }

  async lockLoginDevice(req, res, next) {
    try {
      const { userId, deviceId } = req.params
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const result = await loginService.lockDevice(parseInt(userId), decodeURIComponent(deviceId), req.body, operatorInfo)
      res.json(ApiResponse.success(result, '设备锁定成功'))
    } catch (e) { next(e) }
  }

  async unlockLoginDevice(req, res, next) {
    try {
      const { userId, deviceId } = req.params
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const result = await loginService.unlockDevice(parseInt(userId), decodeURIComponent(deviceId), operatorInfo)
      res.json(ApiResponse.success(result, '设备解锁成功'))
    } catch (e) { next(e) }
  }

  async getLoginRiskSummary(req, res, next) {
    try {
      const { userId } = req.params
      const result = await loginService.getRiskSummary(parseInt(userId), req.query)
      res.json(ApiResponse.success(result))
    } catch (e) { next(e) }
  }

  async verifyLoginRecord(req, res, next) {
    try {
      const { loginId } = req.params
      const operatorInfo = { id: req.user?.id, username: req.user?.username, role: req.user?.role, ip: req.ip }
      const log = await require('../models').LoginLog.findByPk(parseInt(loginId))
      if (!log) throw new Error('记录不存在')
      await log.update({ status: 'verified', twoFaPassed: true, captchaPassed: true })
      if (log.userId) {
        const user = await require('../models').User.findByPk(log.userId)
        if (user) await user.update({ isOnline: true, lastLoginAt: new Date(), lastLoginIp: log.ip })
      }
      await require('../models').OperationLog.create({
        userId: operatorInfo.id, username: operatorInfo.username, module: 'login', action: 'verify_log',
        target: `Login#${loginId}`, targetId: parseInt(loginId),
        detail: JSON.stringify({ manualVerify: true }), ip: operatorInfo.ip, result: 'success'
      })
      res.json(ApiResponse.success({ log }, '人工验证登录记录成功'))
    } catch (e) { next(e) }
  }
}

module.exports = new UserController()
