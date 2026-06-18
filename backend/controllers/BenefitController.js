const { success } = require('../utils/response');
const benefitService = require('../services/BenefitService');

class BenefitController {
  async getList(req, res, next) {
    try {
      const params = { ...req.query, ...req.body };
      const data = await benefitService.getBenefitList(params);
      res.json(success(data));
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const data = await benefitService.getBenefitStats(req.query);
      res.json(success(data));
    } catch (error) {
      next(error);
    }
  }

  async validate(req, res, next) {
    try {
      const operator = req.user;
      const result = await benefitService.validateGrantRules(req.body, null, operator);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async grant(req, res, next) {
    try {
      const operator = req.user;
      const data = await benefitService.grantBenefit(req.body, operator);
      res.json(success(data, '权益发放成功'));
    } catch (error) {
      next(error);
    }
  }

  async reissue(req, res, next) {
    try {
      const { id } = req.params;
      const operator = req.user;
      const data = await benefitService.reissueBenefit(id, req.body, operator);
      res.json(success(data, '权益补发成功'));
    } catch (error) {
      next(error);
    }
  }

  async voidBenefit(req, res, next) {
    try {
      const { id } = req.params;
      const operator = req.user;
      const data = await benefitService.voidBenefit(id, req.body, operator);
      res.json(success(data, '权益作废成功'));
    } catch (error) {
      next(error);
    }
  }

  async extend(req, res, next) {
    try {
      const { id } = req.params;
      const operator = req.user;
      const data = await benefitService.extendBenefit(id, req.body, operator);
      res.json(success(data, '权益延期成功'));
    } catch (error) {
      next(error);
    }
  }

  async recycle(req, res, next) {
    try {
      const { id } = req.params;
      const operator = req.user;
      const data = await benefitService.recycleBenefit(id, req.body, operator);
      res.json(success(data, '权益回收成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchGrant(req, res, next) {
    try {
      const operator = req.user;
      const data = await benefitService.batchGrant(req.body, operator);
      res.json(success(data, `批量发放完成：成功${data.success}，失败${data.failed}`));
    } catch (error) {
      next(error);
    }
  }

  async batchExtend(req, res, next) {
    try {
      const operator = req.user;
      const data = await benefitService.batchExtend(req.body, operator);
      res.json(success(data, `批量延期完成：成功${data.success}，失败${data.failed}`));
    } catch (error) {
      next(error);
    }
  }

  async batchRecycle(req, res, next) {
    try {
      const operator = req.user;
      const data = await benefitService.batchRecycle(req.body, operator);
      res.json(success(data, `批量回收完成：成功${data.success}，失败${data.failed}`));
    } catch (error) {
      next(error);
    }
  }

  async trace(req, res, next) {
    try {
      const { userId } = req.params;
      const data = await benefitService.getBenefitTrace(userId, req.query);
      res.json(success(data));
    } catch (error) {
      next(error);
    }
  }

  async checkExpired(req, res, next) {
    try {
      const operator = req.user;
      const data = await benefitService.checkExpiredBenefits(operator);
      res.json(success(data, `过期扫描完成，共处理${data.count}条`));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BenefitController();
