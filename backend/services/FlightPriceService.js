const { sequelize } = require('../config/db');
const FlightPrice = require('../models/FlightPrice');
const FlightPriceLog = require('../models/FlightPriceLog');
const Flight = require('../models/Flight');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');

class FlightPriceService {
  constructor() {
    this.cabinClassConfig = {
      economy: { name: '经济舱', minBasePrice: 100, maxBasePrice: 10000, defaultPremiumLimit: 200, defaultMinDiscount: 70 },
      business: { name: '商务舱', minBasePrice: 500, maxBasePrice: 30000, defaultPremiumLimit: 500, defaultMinDiscount: 60 },
      first: { name: '头等舱', minBasePrice: 1000, maxBasePrice: 100000, defaultPremiumLimit: 1000, defaultMinDiscount: 50 },
      special: { name: '特惠舱', minBasePrice: 50, maxBasePrice: 5000, defaultPremiumLimit: 100, defaultMinDiscount: 30 }
    };

    this.holidayDates = this._getHolidayDates();
    this.peakSeasonDates = this._getPeakSeasonDates();
  }

  _getHolidayDates() {
    return ['2026-01-01', '2026-01-28', '2026-01-29', '2026-01-30', '2026-01-31',
            '2026-02-01', '2026-02-02', '2026-02-03', '2026-04-04', '2026-04-05',
            '2026-04-06', '2026-05-01', '2026-05-02', '2026-05-03', '2026-06-18',
            '2026-06-19', '2026-06-20', '2026-09-15', '2026-09-16', '2026-09-17',
            '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05',
            '2026-10-06', '2026-10-07'];
  }

  _getPeakSeasonDates() {
    return [{ start: '2026-01-20', end: '2026-02-15' },
            { start: '2026-07-01', end: '2026-08-31' },
            { start: '2026-09-25', end: '2026-10-10' }];
  }

  _isHoliday(date) {
    const dateStr = date.toISOString().split('T')[0];
    return this.holidayDates.includes(dateStr);
  }

  _isPeakSeason(date) {
    const dateStr = date.toISOString().split('T')[0];
    return this.peakSeasonDates.some(range => dateStr >= range.start && dateStr <= range.end);
  }

  _getCabinConfig(cabinClass) {
    return this.cabinClassConfig[cabinClass] || this.cabinClassConfig.economy;
  }

  _checkPricePermission(cabinClass, userRoles) {
    if (cabinClass === 'special') {
      if (!userRoles.includes('admin') && !userRoles.includes('price_manager')) {
        return { valid: false, message: '无权限配置特惠舱价格，请联系价格管理员' };
      }
    }
    return { valid: true };
  }

  _validatePriceData(data, isUpdate = false) {
    const errors = [];

    if (!data.flightId) {
      errors.push({ field: 'flightId', message: '请选择航班' });
    }

    if (!data.cabinClass || !this.cabinClassConfig[data.cabinClass]) {
      errors.push({ field: 'cabinClass', message: '请选择有效的舱位类型' });
    }

    const cabinConfig = this._getCabinConfig(data.cabinClass);

    if (data.basePrice !== undefined && data.basePrice !== null) {
      const basePrice = parseFloat(data.basePrice);
      if (isNaN(basePrice) || basePrice < 0) {
        errors.push({ field: 'basePrice', message: '基准票价必须为正数' });
      } else if (basePrice < cabinConfig.minBasePrice) {
        errors.push({ field: 'basePrice', message: `${cabinConfig.name}基准票价不能低于${cabinConfig.minBasePrice}元` });
      } else if (basePrice > cabinConfig.maxBasePrice) {
        errors.push({ field: 'basePrice', message: `${cabinConfig.name}基准票价不能高于${cabinConfig.maxBasePrice}元` });
      }
    }

    if (data.currentPrice !== undefined && data.currentPrice !== null) {
      const currentPrice = parseFloat(data.currentPrice);
      const basePrice = parseFloat(data.basePrice);
      const premiumLimit = parseFloat(data.premiumLimit || cabinConfig.defaultPremiumLimit);
      const minDiscount = parseFloat(data.minDiscount || cabinConfig.defaultMinDiscount);

      if (isNaN(currentPrice) || currentPrice < 0) {
        errors.push({ field: 'currentPrice', message: '当前售价必须为正数' });
      } else {
        const maxAllowedPrice = basePrice + premiumLimit;
        if (currentPrice > maxAllowedPrice) {
          errors.push({ field: 'currentPrice', message: `当前售价超出溢价上限，最高不得超过${maxAllowedPrice.toFixed(2)}元` });
        }

        const minAllowedPrice = basePrice * (minDiscount / 100);
        if (currentPrice < minAllowedPrice) {
          errors.push({ field: 'currentPrice', message: `当前售价低于最低折扣限制，最低不得低于${minAllowedPrice.toFixed(2)}元` });
        }
      }
    }

    if (data.discount !== undefined && data.discount !== null) {
      const discount = parseFloat(data.discount);
      if (isNaN(discount) || discount <= 0 || discount > 100) {
        errors.push({ field: 'discount', message: '折扣比例必须在0-100之间' });
      }
    }

    if (data.taxRate !== undefined && data.taxRate !== null) {
      const taxRate = parseFloat(data.taxRate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        errors.push({ field: 'taxRate', message: '税费比例必须在0-100之间' });
      }
    }

    if (!data.effectiveStartTime) {
      errors.push({ field: 'effectiveStartTime', message: '请选择价格生效开始时间' });
    }

    if (!data.effectiveEndTime) {
      errors.push({ field: 'effectiveEndTime', message: '请选择价格生效结束时间' });
    }

    if (data.effectiveStartTime && data.effectiveEndTime) {
      const startTime = new Date(data.effectiveStartTime);
      const endTime = new Date(data.effectiveEndTime);
      if (startTime >= endTime) {
        errors.push({ field: 'effectiveEndTime', message: '生效结束时间必须晚于开始时间' });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  _checkPriceConflict(flightId, cabinClass, effectiveStartTime, effectiveEndTime, excludeId = null) {
    const where = {
      flightId,
      cabinClass,
      isActive: 1,
      effectiveStartTime: { [Op.lt]: effectiveEndTime },
      effectiveEndTime: { [Op.gt]: effectiveStartTime }
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    return FlightPrice.findOne({ where });
  }

  _validateDynamicRule(data) {
    if (!data.isDynamicPricing) return { valid: true };

    const errors = [];

    if (data.dynamicRuleData) {
      try {
        const ruleData = typeof data.dynamicRuleData === 'string'
          ? JSON.parse(data.dynamicRuleData)
          : data.dynamicRuleData;

        if (ruleData.holidaySurcharge !== undefined) {
          if (ruleData.holidaySurcharge < 0 || ruleData.holidaySurcharge > 100) {
            errors.push({ field: 'dynamicRuleData.holidaySurcharge', message: '节假日上浮比例必须在0-100之间' });
          }
        }

        if (ruleData.peakSeasonSurcharge !== undefined) {
          if (ruleData.peakSeasonSurcharge < 0 || ruleData.peakSeasonSurcharge > 100) {
            errors.push({ field: 'dynamicRuleData.peakSeasonSurcharge', message: '出行高峰上浮比例必须在0-100之间' });
          }
        }

        if (ruleData.weekendSurcharge !== undefined) {
          if (ruleData.weekendSurcharge < 0 || ruleData.weekendSurcharge > 100) {
            errors.push({ field: 'dynamicRuleData.weekendSurcharge', message: '周末上浮比例必须在0-100之间' });
          }
        }

        if (ruleData.earlyBirdDiscount !== undefined) {
          if (ruleData.earlyBirdDiscount < 0 || ruleData.earlyBirdDiscount > 100) {
            errors.push({ field: 'dynamicRuleData.earlyBirdDiscount', message: '早鸟折扣比例必须在0-100之间' });
          }
        }

        if (ruleData.lastMinuteDiscount !== undefined) {
          if (ruleData.lastMinuteDiscount < 0 || ruleData.lastMinuteDiscount > 100) {
            errors.push({ field: 'dynamicRuleData.lastMinuteDiscount', message: '临期折扣比例必须在0-100之间' });
          }
        }
      } catch (e) {
        errors.push({ field: 'dynamicRuleData', message: '动态定价规则数据格式错误' });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async _calculateDynamicPrice(basePrice, cabinClass, effectiveStartTime, ruleData = {}) {
    let dynamicPrice = parseFloat(basePrice);
    const startDate = new Date(effectiveStartTime);
    const now = new Date();
    const daysBeforeDeparture = Math.floor((startDate - now) / (1000 * 60 * 60 * 24));

    if (this._isHoliday(startDate) && ruleData.holidaySurcharge) {
      dynamicPrice *= (1 + ruleData.holidaySurcharge / 100);
    }

    if (this._isPeakSeason(startDate) && ruleData.peakSeasonSurcharge) {
      dynamicPrice *= (1 + ruleData.peakSeasonSurcharge / 100);
    }

    const dayOfWeek = startDate.getDay();
    if ((dayOfWeek === 0 || dayOfWeek === 6) && ruleData.weekendSurcharge) {
      dynamicPrice *= (1 + ruleData.weekendSurcharge / 100);
    }

    if (daysBeforeDeparture >= 30 && ruleData.earlyBirdDiscount) {
      dynamicPrice *= (1 - ruleData.earlyBirdDiscount / 100);
    }

    if (daysBeforeDeparture <= 3 && ruleData.lastMinuteDiscount) {
      dynamicPrice *= (1 - ruleData.lastMinuteDiscount / 100);
    }

    const cabinConfig = this._getCabinConfig(cabinClass);
    const premiumLimit = parseFloat(ruleData.premiumLimit || cabinConfig.defaultPremiumLimit);
    const minDiscount = parseFloat(ruleData.minDiscount || cabinConfig.defaultMinDiscount);
    const maxPrice = parseFloat(basePrice) + premiumLimit;
    const minPrice = parseFloat(basePrice) * (minDiscount / 100);

    dynamicPrice = Math.min(dynamicPrice, maxPrice);
    dynamicPrice = Math.max(dynamicPrice, minPrice);

    return Math.round(dynamicPrice * 100) / 100;
  }

  async validatePriceData(data, userRoles = []) {
    const permissionCheck = this._checkPricePermission(data.cabinClass, userRoles);
    if (!permissionCheck.valid) {
      return { valid: false, errors: [{ field: 'cabinClass', message: permissionCheck.message }] };
    }

    const priceValidation = this._validatePriceData(data);
    if (!priceValidation.valid) {
      return priceValidation;
    }

    const dynamicValidation = this._validateDynamicRule(data);
    if (!dynamicValidation.valid) {
      return dynamicValidation;
    }

    if (data.flightId) {
      const flight = await Flight.findByPk(data.flightId);
      if (!flight) {
        return { valid: false, errors: [{ field: 'flightId', message: '航班不存在' }] };
      }
    }

    return { valid: true, errors: [] };
  }

  async validateField(fieldName, value, params = {}) {
    const result = { valid: true, message: '' };

    switch (fieldName) {
      case 'basePrice':
      case 'currentPrice': {
        const cabinClass = params.cabinClass || 'economy';
        const cabinConfig = this._getCabinConfig(cabinClass);
        const price = parseFloat(value);

        if (isNaN(price) || price < 0) {
          result.valid = false;
          result.message = '价格必须为正数';
        } else if (fieldName === 'basePrice') {
          if (price < cabinConfig.minBasePrice) {
            result.valid = false;
            result.message = `${cabinConfig.name}基准票价不能低于${cabinConfig.minBasePrice}元`;
          } else if (price > cabinConfig.maxBasePrice) {
            result.valid = false;
            result.message = `${cabinConfig.name}基准票价不能高于${cabinConfig.maxBasePrice}元`;
          }
        } else if (fieldName === 'currentPrice') {
          const basePrice = parseFloat(params.basePrice || 0);
          const premiumLimit = parseFloat(params.premiumLimit || cabinConfig.defaultPremiumLimit);
          const minDiscount = parseFloat(params.minDiscount || cabinConfig.defaultMinDiscount);
          const maxAllowed = basePrice + premiumLimit;
          const minAllowed = basePrice * (minDiscount / 100);

          if (price > maxAllowed) {
            result.valid = false;
            result.message = `超出溢价上限，最高不得超过${maxAllowed.toFixed(2)}元`;
          } else if (price < minAllowed) {
            result.valid = false;
            result.message = `低于最低折扣限制，最低不得低于${minAllowed.toFixed(2)}元`;
          }
        }
        break;
      }

      case 'discount': {
        const discount = parseFloat(value);
        if (isNaN(discount) || discount <= 0 || discount > 100) {
          result.valid = false;
          result.message = '折扣比例必须在0-100之间';
        }
        break;
      }

      case 'effectiveTime': {
        if (params.startTime && params.endTime) {
          const startTime = new Date(params.startTime);
          const endTime = new Date(params.endTime);
          if (startTime >= endTime) {
            result.valid = false;
            result.message = '生效结束时间必须晚于开始时间';
          }
        }
        break;
      }
    }

    return result;
  }

  async createPrice(data, operator, userRoles = []) {
    const t = await sequelize.transaction();

    try {
      const permissionCheck = this._checkPricePermission(data.cabinClass, userRoles);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      const validation = this._validatePriceData(data);
      if (!validation.valid) {
        throw new Error(validation.errors[0].message);
      }

      const dynamicValidation = this._validateDynamicRule(data);
      if (!dynamicValidation.valid) {
        throw new Error(dynamicValidation.errors[0].message);
      }

      const conflict = await this._checkPriceConflict(
        data.flightId, data.cabinClass, data.effectiveStartTime, data.effectiveEndTime
      );

      if (conflict) {
        throw new Error('该航班此舱位在该时间段已有生效的价格配置');
      }

      const flight = await Flight.findByPk(data.flightId, { transaction: t });
      if (!flight) {
        throw new Error('航班不存在');
      }

      let currentPrice = parseFloat(data.currentPrice);
      if (data.isDynamicPricing && data.dynamicRuleData) {
        const ruleData = typeof data.dynamicRuleData === 'string'
          ? JSON.parse(data.dynamicRuleData)
          : data.dynamicRuleData;
        currentPrice = await this._calculateDynamicPrice(
          data.basePrice, data.cabinClass, data.effectiveStartTime, ruleData
        );
      }

      const taxAmount = currentPrice * (parseFloat(data.taxRate || 0) / 100) + parseFloat(data.surcharge || 0);

      const priceData = {
        flightId: data.flightId,
        flightNo: flight.flightNo,
        cabinClass: data.cabinClass,
        basePrice: data.basePrice,
        currentPrice: currentPrice,
        discount: data.discount,
        taxRate: data.taxRate || 0,
        taxAmount: Math.round(taxAmount * 100) / 100,
        surcharge: data.surcharge || 0,
        premiumLimit: data.premiumLimit,
        minDiscount: data.minDiscount,
        effectiveStartTime: data.effectiveStartTime,
        effectiveEndTime: data.effectiveEndTime,
        isDynamicPricing: data.isDynamicPricing || 0,
        dynamicRuleId: data.dynamicRuleId,
        dynamicRuleData: data.dynamicRuleData,
        priceSource: data.priceSource || 'manual',
        priceReason: data.priceReason,
        isActive: 1,
        operatorId: operator.id,
        operatorName: operator.username
      };

      const price = await FlightPrice.create(priceData, { transaction: t });

      await FlightPriceLog.create({
        priceId: price.id,
        flightId: price.flightId,
        flightNo: price.flightNo,
        cabinClass: price.cabinClass,
        operationType: 1,
        operationName: '创建价格配置',
        beforePrice: null,
        afterPrice: price.currentPrice,
        beforeDiscount: null,
        afterDiscount: price.discount,
        beforeTax: null,
        afterTax: price.taxAmount,
        priceChangeAmount: price.currentPrice,
        priceChangePercent: 100,
        changeFields: JSON.stringify(Object.keys(priceData)),
        effectScope: `航班${price.flightNo} ${this._getCabinConfig(price.cabinClass).name}`,
        affectedFlightCount: 1,
        operatorId: operator.id,
        operatorName: operator.username,
        operatorRole: userRoles.join(','),
        operationRemark: data.priceReason || '新建价格配置',
        operationStatus: 1
      }, { transaction: t });

      await t.commit();
      return price;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updatePrice(id, data, operator, userRoles = []) {
    const t = await sequelize.transaction();

    try {
      const price = await FlightPrice.findByPk(id, { transaction: t });
      if (!price) {
        throw new Error('价格配置不存在');
      }

      const permissionCheck = this._checkPricePermission(price.cabinClass, userRoles);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      if (data.cabinClass && data.cabinClass !== price.cabinClass) {
        const newPermissionCheck = this._checkPricePermission(data.cabinClass, userRoles);
        if (!newPermissionCheck.valid) {
          throw new Error(newPermissionCheck.message);
        }
      }

      const cabinClass = data.cabinClass || price.cabinClass;
      const basePrice = data.basePrice !== undefined ? data.basePrice : price.basePrice;
      const currentPrice = data.currentPrice !== undefined ? data.currentPrice : price.currentPrice;

      const validationData = {
        ...price.toJSON(),
        ...data,
        cabinClass,
        basePrice,
        currentPrice
      };
      const validation = this._validatePriceData(validationData, true);
      if (!validation.valid) {
        throw new Error(validation.errors[0].message);
      }

      if (data.effectiveStartTime || data.effectiveEndTime) {
        const conflict = await this._checkPriceConflict(
          price.flightId,
          cabinClass,
          data.effectiveStartTime || price.effectiveStartTime,
          data.effectiveEndTime || price.effectiveEndTime,
          id
        );

        if (conflict) {
          throw new Error('该航班此舱位在该时间段已有生效的价格配置');
        }
      }

      const changeFields = [];
      const beforeData = price.toJSON();

      if (data.basePrice !== undefined && data.basePrice !== price.basePrice) {
        changeFields.push('basePrice');
      }
      if (data.currentPrice !== undefined && data.currentPrice !== price.currentPrice) {
        changeFields.push('currentPrice');
      }
      if (data.discount !== undefined && data.discount !== price.discount) {
        changeFields.push('discount');
      }
      if (data.taxRate !== undefined && data.taxRate !== price.taxRate) {
        changeFields.push('taxRate');
      }
      if (data.surcharge !== undefined && data.surcharge !== price.surcharge) {
        changeFields.push('surcharge');
      }
      if (data.effectiveStartTime !== undefined) {
        changeFields.push('effectiveStartTime');
      }
      if (data.effectiveEndTime !== undefined) {
        changeFields.push('effectiveEndTime');
      }
      if (data.isDynamicPricing !== undefined) {
        changeFields.push('isDynamicPricing');
      }
      if (data.priceReason !== undefined) {
        changeFields.push('priceReason');
      }

      let newCurrentPrice = parseFloat(currentPrice);
      if (data.isDynamicPricing && data.dynamicRuleData) {
        const ruleData = typeof data.dynamicRuleData === 'string'
          ? JSON.parse(data.dynamicRuleData)
          : data.dynamicRuleData;
        newCurrentPrice = await this._calculateDynamicPrice(
          basePrice, cabinClass,
          data.effectiveStartTime || price.effectiveStartTime,
          ruleData
        );
        changeFields.push('currentPrice');
      }

      const taxRate = data.taxRate !== undefined ? data.taxRate : price.taxRate;
      const surcharge = data.surcharge !== undefined ? data.surcharge : price.surcharge;
      const newTaxAmount = newCurrentPrice * (parseFloat(taxRate || 0) / 100) + parseFloat(surcharge || 0);

      const updateData = {
        ...data,
        currentPrice: newCurrentPrice,
        taxAmount: Math.round(newTaxAmount * 100) / 100,
        operatorId: operator.id,
        operatorName: operator.username
      };

      await price.update(updateData, { transaction: t });

      const priceChangeAmount = parseFloat(newCurrentPrice) - parseFloat(beforeData.currentPrice);
      const priceChangePercent = beforeData.currentPrice > 0
        ? (priceChangeAmount / parseFloat(beforeData.currentPrice)) * 100
        : 100;

      await FlightPriceLog.create({
        priceId: price.id,
        flightId: price.flightId,
        flightNo: price.flightNo,
        cabinClass: price.cabinClass,
        operationType: 2,
        operationName: '修改价格配置',
        beforePrice: beforeData.currentPrice,
        afterPrice: newCurrentPrice,
        beforeDiscount: beforeData.discount,
        afterDiscount: data.discount !== undefined ? data.discount : beforeData.discount,
        beforeTax: beforeData.taxAmount,
        afterTax: Math.round(newTaxAmount * 100) / 100,
        priceChangeAmount: Math.round(priceChangeAmount * 100) / 100,
        priceChangePercent: Math.round(priceChangePercent * 100) / 100,
        changeFields: JSON.stringify(changeFields),
        effectScope: `航班${price.flightNo} ${this._getCabinConfig(price.cabinClass).name}`,
        affectedFlightCount: 1,
        operatorId: operator.id,
        operatorName: operator.username,
        operatorRole: userRoles.join(','),
        operationRemark: data.priceReason || '修改价格配置',
        operationStatus: 1
      }, { transaction: t });

      const affectedOrders = await this._updateUnpaidOrders(price, t);

      await t.commit();

      if (affectedOrders > 0) {
        setImmediate(() => this._notifyPriceChangeUsers(price.id, beforeData.currentPrice, newCurrentPrice));
      }

      return price;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async _updateUnpaidOrders(price, transaction) {
    const orders = await Order.findAll({
      where: {
        productId: price.flightId,
        category: 'flight',
        status: 0
      },
      transaction
    });

    let affectedCount = 0;
    for (const order of orders) {
      const orderData = JSON.parse(order.productInfo || '{}');
      if (orderData.cabinClass === price.cabinClass) {
        const oldAmount = parseFloat(order.amount);
        const newUnitPrice = parseFloat(price.currentPrice) + parseFloat(price.taxAmount);
        const newAmount = newUnitPrice * parseInt(order.quantity || 1);

        if (Math.abs(newAmount - oldAmount) > 0.01) {
          await order.update({
            unitPrice: newUnitPrice,
            amount: newAmount,
            remainingAmount: newAmount - parseFloat(order.paidAmount || 0)
          }, { transaction });
          affectedCount++;
        }
      }
    }

    return affectedCount;
  }

  async _notifyPriceChangeUsers(priceId, oldPrice, newPrice) {
    try {
      const price = await FlightPrice.findByPk(priceId);
      if (!price) return;

      const orders = await Order.findAll({
        where: {
          productId: price.flightId,
          category: 'flight',
          status: 0
        }
      });

      const userIds = [...new Set(orders.map(o => o.userId))];
      const priceChange = newPrice - oldPrice;
      const direction = priceChange > 0 ? '上涨' : '下降';
      const absChange = Math.abs(priceChange).toFixed(2);
      const cabinName = this._getCabinConfig(price.cabinClass).name;

      for (const userId of userIds) {
        await Notification.create({
          userId,
          title: '航班价格变动通知',
          content: `您预订的${price.flightNo}航班${cabinName}价格${direction}了${absChange}元，当前价格${newPrice.toFixed(2)}元。请及时完成支付。`,
          type: 'price_change',
          relatedId: price.flightId,
          relatedType: 'flight',
          isRead: 0
        });
      }
    } catch (error) {
      console.error('发送价格变动通知失败:', error);
    }
  }

  async batchUpdateTime(flightIds, cabinClass, timeAdjustMinutes, operator, userRoles = []) {
    const t = await sequelize.transaction();

    try {
      if (cabinClass === 'special') {
        const permissionCheck = this._checkPricePermission('special', userRoles);
        if (!permissionCheck.valid) {
          throw new Error(permissionCheck.message);
        }
      }

      const prices = await FlightPrice.findAll({
        where: {
          flightId: { [Op.in]: flightIds },
          cabinClass: cabinClass,
          isActive: 1
        },
        transaction: t
      });

      if (prices.length === 0) {
        throw new Error('未找到符合条件的价格配置');
      }

      const results = [];
      for (const price of prices) {
        const newStartTime = new Date(price.effectiveStartTime.getTime() + timeAdjustMinutes * 60000);
        const newEndTime = new Date(price.effectiveEndTime.getTime() + timeAdjustMinutes * 60000);

        const conflict = await this._checkPriceConflict(
          price.flightId, price.cabinClass, newStartTime, newEndTime, price.id
        );

        if (!conflict) {
          const oldStartTime = price.effectiveStartTime;
          const oldEndTime = price.effectiveEndTime;

          await price.update({
            effectiveStartTime: newStartTime,
            effectiveEndTime: newEndTime,
            operatorId: operator.id,
            operatorName: operator.username
          }, { transaction: t });

          await FlightPriceLog.create({
            priceId: price.id,
            flightId: price.flightId,
            flightNo: price.flightNo,
            cabinClass: price.cabinClass,
            operationType: 3,
            operationName: '批量调整时间段',
            changeFields: JSON.stringify(['effectiveStartTime', 'effectiveEndTime']),
            effectScope: `批量调整${timeAdjustMinutes > 0 ? '延后' : '提前'}${Math.abs(timeAdjustMinutes)}分钟`,
            affectedFlightCount: 1,
            operatorId: operator.id,
            operatorName: operator.username,
            operatorRole: userRoles.join(','),
            operationRemark: `原时间段: ${oldStartTime.toLocaleString()} ~ ${oldEndTime.toLocaleString()}`,
            operationStatus: 1
          }, { transaction: t });

          results.push(price.id);
        }
      }

      await t.commit();
      return { updatedCount: results.length, updatedIds: results };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async batchUpdatePrice(params, operator, userRoles = []) {
    const t = await sequelize.transaction();

    try {
      const { flightIds, cabinClass, operationType, value, priceReason } = params;

      if (cabinClass === 'special') {
        const permissionCheck = this._checkPricePermission('special', userRoles);
        if (!permissionCheck.valid) {
          throw new Error(permissionCheck.message);
        }
      }

      const prices = await FlightPrice.findAll({
        where: {
          flightId: { [Op.in]: flightIds },
          cabinClass: cabinClass,
          isActive: 1
        },
        transaction: t
      });

      if (prices.length === 0) {
        throw new Error('未找到符合条件的价格配置');
      }

      const results = [];
      for (const price of prices) {
        const beforePrice = price.currentPrice;
        const beforeDiscount = price.discount;
        let newPrice, newDiscount, operationName;

        const cabinConfig = this._getCabinConfig(price.cabinClass);
        const minAllowed = price.basePrice * (cabinConfig.defaultMinDiscount / 100);
        const maxAllowed = price.basePrice + cabinConfig.defaultPremiumLimit;

        switch (operationType) {
          case 'discount':
            newDiscount = value;
            newPrice = price.basePrice * (value / 100);
            operationName = `批量统一${value}折`;
            break;
          case 'increase':
            newPrice = price.currentPrice + value;
            newDiscount = (newPrice / price.basePrice) * 100;
            operationName = `批量上浮${value}元`;
            break;
          case 'decrease':
            newPrice = price.currentPrice - value;
            newDiscount = (newPrice / price.basePrice) * 100;
            operationName = `批量下调${value}元`;
            break;
          case 'percentageIncrease':
            newPrice = price.currentPrice * (1 + value / 100);
            newDiscount = (newPrice / price.basePrice) * 100;
            operationName = `批量上浮${value}%`;
            break;
          case 'percentageDecrease':
            newPrice = price.currentPrice * (1 - value / 100);
            newDiscount = (newPrice / price.basePrice) * 100;
            operationName = `批量下调${value}%`;
            break;
          case 'reset':
            newPrice = price.basePrice;
            newDiscount = 100;
            operationName = '批量恢复基准价格';
            break;
          default:
            continue;
        }

        if (newPrice < minAllowed) {
          await FlightPriceLog.create({
            priceId: price.id,
            flightId: price.flightId,
            flightNo: price.flightNo,
            cabinClass: price.cabinClass,
            operationType: 3,
            operationName: operationName,
            operationRemark: `价格低于最低限制${minAllowed.toFixed(2)}元，已跳过`,
            operationStatus: 0,
            failReason: '价格低于最低限制'
          }, { transaction: t });
          continue;
        }

        if (newPrice > maxAllowed) {
          await FlightPriceLog.create({
            priceId: price.id,
            flightId: price.flightId,
            flightNo: price.flightNo,
            cabinClass: price.cabinClass,
            operationType: 3,
            operationName: operationName,
            operationRemark: `价格超出溢价上限${maxAllowed.toFixed(2)}元，已跳过`,
            operationStatus: 0,
            failReason: '价格超出溢价上限'
          }, { transaction: t });
          continue;
        }

        newPrice = Math.round(newPrice * 100) / 100;
        newDiscount = Math.round(newDiscount * 100) / 100;

        const taxAmount = newPrice * (parseFloat(price.taxRate || 0) / 100) + parseFloat(price.surcharge || 0);

        await price.update({
          currentPrice: newPrice,
          discount: newDiscount,
          taxAmount: Math.round(taxAmount * 100) / 100,
          priceReason: priceReason || operationName,
          operatorId: operator.id,
          operatorName: operator.username
        }, { transaction: t });

        const priceChangeAmount = newPrice - beforePrice;
        const priceChangePercent = (priceChangeAmount / beforePrice) * 100;

        await FlightPriceLog.create({
          priceId: price.id,
          flightId: price.flightId,
          flightNo: price.flightNo,
          cabinClass: price.cabinClass,
          operationType: 3,
          operationName: operationName,
          beforePrice: beforePrice,
          afterPrice: newPrice,
          beforeDiscount: beforeDiscount,
          afterDiscount: newDiscount,
          beforeTax: price.taxAmount,
          afterTax: Math.round(taxAmount * 100) / 100,
          priceChangeAmount: Math.round(priceChangeAmount * 100) / 100,
          priceChangePercent: Math.round(priceChangePercent * 100) / 100,
          changeFields: JSON.stringify(['currentPrice', 'discount', 'taxAmount']),
          effectScope: operationName,
          affectedFlightCount: 1,
          operatorId: operator.id,
          operatorName: operator.username,
          operatorRole: userRoles.join(','),
          operationRemark: priceReason || operationName,
          operationStatus: 1
        }, { transaction: t });

        await this._updateUnpaidOrders(price, t);

        results.push(price.id);
      }

      await t.commit();

      return { updatedCount: results.length, totalCount: prices.length, updatedIds: results };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async batchUpdateDisplayStatus(priceIds, isActive, operator, userRoles = []) {
    const t = await sequelize.transaction();

    try {
      const prices = await FlightPrice.findAll({
        where: { id: { [Op.in]: priceIds } },
        transaction: t
      });

      if (prices.length === 0) {
        throw new Error('未找到指定的价格配置');
      }

      for (const price of prices) {
        if (price.cabinClass === 'special' && isActive === 1) {
          const permissionCheck = this._checkPricePermission('special', userRoles);
          if (!permissionCheck.valid) {
            throw new Error(permissionCheck.message);
          }
        }

        await price.update({
          isActive: isActive,
          operatorId: operator.id,
          operatorName: operator.username
        }, { transaction: t });

        await FlightPriceLog.create({
          priceId: price.id,
          flightId: price.flightId,
          flightNo: price.flightNo,
          cabinClass: price.cabinClass,
          operationType: isActive === 1 ? 7 : 6,
          operationName: isActive === 1 ? '启用价格' : '停用价格',
          effectScope: `航班${price.flightNo}`,
          affectedFlightCount: 1,
          operatorId: operator.id,
          operatorName: operator.username,
          operatorRole: userRoles.join(','),
          operationRemark: isActive === 1 ? '启用价格配置' : '停用价格配置',
          operationStatus: 1
        }, { transaction: t });
      }

      await t.commit();
      return { updatedCount: prices.length };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getPriceLogs(priceId, params = {}) {
    const where = { priceId };

    if (params.operationType) {
      where.operationType = params.operationType;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt[Op.gte] = new Date(params.startDate);
      if (params.endDate) where.createdAt[Op.lte] = new Date(params.endDate);
    }

    const { count, rows } = await FlightPriceLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: params.pageSize || 20,
      offset: ((params.page || 1) - 1) * (params.pageSize || 20)
    });

    return { total: count, items: rows };
  }

  async getPriceStats(params = {}) {
    const where = { isActive: 1 };

    if (params.flightNo) {
      where.flightNo = { [Op.like]: `%${params.flightNo}%` };
    }

    if (params.cabinClass) {
      where.cabinClass = params.cabinClass;
    }

    if (params.startDate || params.endDate) {
      where.effectiveStartTime = { [Op.gte]: new Date(params.startDate) };
      where.effectiveEndTime = { [Op.lte]: new Date(params.endDate) };
    }

    const prices = await FlightPrice.findAll({ where });

    const stats = {
      total: prices.length,
      totalAmount: 0,
      avgPrice: 0,
      minPrice: Infinity,
      maxPrice: -Infinity,
      byCabinClass: {}
    };

    for (const price of prices) {
      const currentPrice = parseFloat(price.currentPrice);
      stats.totalAmount += currentPrice;
      stats.minPrice = Math.min(stats.minPrice, currentPrice);
      stats.maxPrice = Math.max(stats.maxPrice, currentPrice);

      if (!stats.byCabinClass[price.cabinClass]) {
        stats.byCabinClass[price.cabinClass] = { count: 0, totalAmount: 0, avgPrice: 0 };
      }
      stats.byCabinClass[price.cabinClass].count++;
      stats.byCabinClass[price.cabinClass].totalAmount += currentPrice;
    }

    if (stats.total > 0) {
      stats.avgPrice = Math.round((stats.totalAmount / stats.total) * 100) / 100;
      stats.minPrice = stats.minPrice === Infinity ? 0 : stats.minPrice;
      stats.maxPrice = stats.maxPrice === -Infinity ? 0 : stats.maxPrice;
      stats.totalAmount = Math.round(stats.totalAmount * 100) / 100;

      for (const key in stats.byCabinClass) {
        stats.byCabinClass[key].avgPrice = Math.round(
          (stats.byCabinClass[key].totalAmount / stats.byCabinClass[key].count) * 100
        ) / 100;
        stats.byCabinClass[key].totalAmount = Math.round(stats.byCabinClass[key].totalAmount * 100) / 100;
      }
    }

    return stats;
  }

  async getPriceList(params = {}) {
    const where = {};

    if (params.flightId) where.flightId = params.flightId;
    if (params.flightNo) where.flightNo = { [Op.like]: `%${params.flightNo}%` };
    if (params.cabinClass) where.cabinClass = params.cabinClass;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    if (params.startDate || params.endDate) {
      where.effectiveStartTime = { [Op.lt]: new Date(params.endDate) };
      where.effectiveEndTime = { [Op.gt]: new Date(params.startDate) };
    }

    const { count, rows } = await FlightPrice.findAndCountAll({
      where,
      include: [{ model: Flight, as: 'flight', attributes: ['flightNo', 'departureAirport', 'arrivalAirport', 'departureTime', 'arrivalTime'] }],
      order: [['createdAt', 'DESC']],
      limit: params.pageSize || 20,
      offset: ((params.page || 1) - 1) * (params.pageSize || 20)
    });

    return { total: count, items: rows };
  }

  async getPriceById(id) {
    return FlightPrice.findByPk(id, {
      include: [{ model: Flight, as: 'flight' }]
    });
  }

  async deletePrice(id, operator, userRoles = []) {
    const t = await sequelize.transaction();

    try {
      const price = await FlightPrice.findByPk(id, { transaction: t });
      if (!price) {
        throw new Error('价格配置不存在');
      }

      const permissionCheck = this._checkPricePermission(price.cabinClass, userRoles);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      await FlightPriceLog.create({
        priceId: price.id,
        flightId: price.flightId,
        flightNo: price.flightNo,
        cabinClass: price.cabinClass,
        operationType: 6,
        operationName: '删除价格配置',
        beforePrice: price.currentPrice,
        effectScope: `航班${price.flightNo} ${this._getCabinConfig(price.cabinClass).name}`,
        operatorId: operator.id,
        operatorName: operator.username,
        operatorRole: userRoles.join(','),
        operationRemark: '删除价格配置',
        operationStatus: 1
      }, { transaction: t });

      await price.destroy({ transaction: t });

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = new FlightPriceService();
