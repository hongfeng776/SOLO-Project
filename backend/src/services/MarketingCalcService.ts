import { Op } from 'sequelize';
import { daos } from '../dao';
import { MarketingUser } from '../models/MarketingUser';
import { AppError } from '../middlewares/errorHandler';

const { marketingDao, marketingUserDao } = daos;

export const MarketingType = {
  DISCOUNT: 1,
  FULL_REDUCTION: 2,
  COUPON: 3,
  FLASH_SALE: 4,
} as const;

export const ConflictStrategy = {
  EXCLUSIVE: 'exclusive',
  STACKABLE: 'stackable',
  CHOOSE_BEST: 'choose_best',
} as const;

export interface MarketingItem {
  id: number;
  type: number;
  name: string;
  discount: number;
  threshold?: number;
  start_time?: Date;
  end_time?: Date;
  priority?: number;
  conflict_strategy?: string;
}

export interface OrderItem {
  goods_id: number;
  goods_name?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CalcContext {
  user_id: number;
  order_items: OrderItem[];
  selected_coupon_ids?: number[];
  marketing_ids?: number[];
}

export interface AppliedMarketing {
  id: number;
  name: string;
  type: number;
  discount_amount: number;
  description: string;
}

export interface CalcResult {
  original_amount: number;
  total_discount: number;
  final_amount: number;
  applied_marketings: AppliedMarketing[];
  conflict_warnings: string[];
  details: {
    subtotal_amount: number;
    flash_sale_discount: number;
    discount_amount: number;
    full_reduction_amount: number;
    coupon_amount: number;
  };
}

export interface BestCombination {
  calc_result: CalcResult;
  combination: number[];
  total_savings: number;
}

class MarketingCalcService {
  private readonly MAX_MARKETINGS_STACK = 3;
  private readonly MAX_COUPONS_STACK = 1;

  async calculate(ctx: CalcContext): Promise<CalcResult> {
    const { user_id, order_items, selected_coupon_ids = [], marketing_ids = [] } = ctx;

    if (!order_items || order_items.length === 0) {
      throw new AppError('订单项不能为空', 400);
    }

    const subtotal_amount = this.calcSubtotal(order_items);

    const allActiveMarketings = await this.getActiveMarketings(marketing_ids);
    const userCoupons = await this.getUserAvailableCoupons(user_id, selected_coupon_ids);

    const flashSaleItems = allActiveMarketings.filter(m => m.type === MarketingType.FLASH_SALE);
    const discountItems = allActiveMarketings.filter(m => m.type === MarketingType.DISCOUNT);
    const fullReductionItems = allActiveMarketings.filter(m => m.type === MarketingType.FULL_REDUCTION);
    const couponItems = userCoupons;

    const conflict_warnings: string[] = [];
    const applied_marketings: AppliedMarketing[] = [];

    let flash_sale_discount = 0;
    if (flashSaleItems.length > 0) {
      const flashResult = this.applyFlashSale(order_items, flashSaleItems);
      flash_sale_discount = flashResult.discount;
      applied_marketings.push(...flashResult.applied);
    }

    let amount_after_flash = subtotal_amount - flash_sale_discount;

    let discount_amount = 0;
    if (discountItems.length > 0) {
      const discountResult = this.applyDiscount(amount_after_flash, discountItems);
      discount_amount = discountResult.discount;
      applied_marketings.push(...discountResult.applied);
    }

    let amount_after_discount = amount_after_flash - discount_amount;

    let full_reduction_amount = 0;
    if (fullReductionItems.length > 0) {
      const frResult = this.applyFullReduction(amount_after_discount, fullReductionItems);
      full_reduction_amount = frResult.discount;
      applied_marketings.push(...frResult.applied);
    }

    let amount_after_fr = amount_after_discount - full_reduction_amount;

    let coupon_amount = 0;
    if (couponItems.length > 0) {
      const couponResult = this.applyCoupons(amount_after_fr, couponItems, conflict_warnings);
      coupon_amount = couponResult.discount;
      applied_marketings.push(...couponResult.applied);
    }

    this.detectConflicts(applied_marketings, conflict_warnings);

    if (applied_marketings.length > this.MAX_MARKETINGS_STACK) {
      conflict_warnings.push(`同时叠加${applied_marketings.length}个活动，超出建议上限${this.MAX_MARKETINGS_STACK}个`);
    }

    const total_discount = flash_sale_discount + discount_amount + full_reduction_amount + coupon_amount;
    const final_amount = Math.max(0, this.round(subtotal_amount - total_discount));

    if (final_amount <= 0 && total_discount > 0) {
      conflict_warnings.push('优惠后金额为0，请确认活动组合是否合理');
    }

    return {
      original_amount: this.round(subtotal_amount),
      total_discount: this.round(total_discount),
      final_amount,
      applied_marketings,
      conflict_warnings,
      details: {
        subtotal_amount: this.round(subtotal_amount),
        flash_sale_discount: this.round(flash_sale_discount),
        discount_amount: this.round(discount_amount),
        full_reduction_amount: this.round(full_reduction_amount),
        coupon_amount: this.round(coupon_amount),
      },
    };
  }

  async findBestCombination(ctx: CalcContext): Promise<BestCombination> {
    const { user_id, order_items, marketing_ids = [] } = ctx;

    if (!order_items || order_items.length === 0) {
      throw new AppError('订单项不能为空', 400);
    }

    const allActiveMarketings = await this.getActiveMarketings(marketing_ids);
    const userCoupons = await this.getUserAvailableCoupons(user_id);

    const flashSaleCombos = this.generateCombinations(
      allActiveMarketings.filter(m => m.type === MarketingType.FLASH_SALE),
      1
    );
    const discountCombos = this.generateCombinations(
      allActiveMarketings.filter(m => m.type === MarketingType.DISCOUNT),
      1
    );
    const frCombos = this.generateCombinations(
      allActiveMarketings.filter(m => m.type === MarketingType.FULL_REDUCTION),
      2
    );
    const couponCombos = this.generateCombinations(userCoupons, this.MAX_COUPONS_STACK);

    let best: BestCombination | null = null;

    for (const flashCombo of flashSaleCombos) {
      for (const discCombo of discountCombos) {
        for (const frCombo of frCombos) {
          for (const coupCombo of couponCombos) {
            const combined = [...flashCombo, ...discCombo, ...frCombo, ...coupCombo];
            const selectedCouponIds = coupCombo.map(c => c.id);
            const selectedMarketingIds = [...flashCombo, ...discCombo, ...frCombo].map(m => m.id);

            const result = await this.calculate({
              ...ctx,
              selected_coupon_ids: selectedCouponIds,
              marketing_ids: selectedMarketingIds,
            });

            const savings = result.total_discount;

            if (!best || savings > best.total_savings) {
              best = {
                calc_result: result,
                combination: combined.map(c => c.id),
                total_savings: savings,
              };
            }
          }
        }
      }
    }

    if (!best) {
      const baseResult = await this.calculate(ctx);
      best = {
        calc_result: baseResult,
        combination: [],
        total_savings: baseResult.total_discount,
      };
    }

    return best;
  }

  async claimCoupon(user_id: number, marketing_id: number): Promise<MarketingUser> {
    const marketing = await marketingDao.findById(marketing_id);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    if (marketing.type !== MarketingType.COUPON) {
      throw new AppError('该活动不是优惠券类型', 400);
    }

    if (marketing.status !== 1) {
      throw new AppError('活动未进行中', 400);
    }

    const now = new Date();
    if (marketing.start_time && marketing.start_time > now) {
      throw new AppError('活动尚未开始', 400);
    }
    if (marketing.end_time && marketing.end_time < now) {
      throw new AppError('活动已结束', 400);
    }

    const existing = await marketingUserDao.findByUserAndMarketing(user_id, marketing_id);
    if (existing) {
      throw new AppError('您已领取过该优惠券', 400);
    }

    const expire_days = 30;
    const expire_time = new Date(now.getTime() + expire_days * 24 * 60 * 60 * 1000);

    return marketingUserDao.create({
      marketing_id,
      user_id,
      status: 0,
      expire_time,
    });
  }

  async useCoupons(user_id: number, coupon_ids: number[]): Promise<void> {
    if (!coupon_ids || coupon_ids.length === 0) {
      return;
    }

    const now = new Date();

    for (const coupon_id of coupon_ids) {
      const record = await marketingUserDao.findById(coupon_id);
      if (!record) {
        throw new AppError(`优惠券记录不存在: ${coupon_id}`, 404);
      }

      if (record.user_id !== user_id) {
        throw new AppError('无权使用该优惠券', 403);
      }

      if (record.status !== 0) {
        const statusText = record.status === 1 ? '已使用' : '已过期';
        throw new AppError(`优惠券${statusText}`, 400);
      }

      if (record.expire_time && record.expire_time < now) {
        throw new AppError('优惠券已过期', 400);
      }

      await marketingUserDao.updateStatus(coupon_id, 1, now);
    }
  }

  async processExpiredCoupons(): Promise<number> {
    const now = new Date();
    const expired = await marketingUserDao.findAll({
      where: {
        status: 0,
        expire_time: {
          [Op.lt]: now,
        },
      },
    });

    const ids = expired.map(e => e.id);
    return marketingUserDao.markExpired(ids);
  }

  private calcSubtotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  private async getActiveMarketings(ids: number[] = []): Promise<MarketingItem[]> {
    const now = new Date();
    const where: any = {
      status: 1,
      start_time: { [Op.lte]: now },
      end_time: { [Op.gte]: now },
    };

    if (ids.length > 0) {
      where.id = ids;
    }

    const marketings = await marketingDao.findAll({ where });

    return marketings.map(m => ({
      id: m.id,
      type: m.type || 1,
      name: m.name,
      discount: Number(m.discount) || 0,
      priority: 0,
      conflict_strategy: ConflictStrategy.STACKABLE,
    }));
  }

  private async getUserAvailableCoupons(user_id: number, selected_ids: number[] = []): Promise<MarketingItem[]> {
    const records = await marketingUserDao.findAvailableByUser(user_id);
    const marketing_ids = records
      .filter(r => selected_ids.length === 0 || selected_ids.includes(r.id))
      .map(r => r.marketing_id);

    if (marketing_ids.length === 0) {
      return [];
    }

    const marketings = await marketingDao.findAll({
      where: {
        id: marketing_ids,
        type: MarketingType.COUPON,
        status: 1,
      },
    });

    return marketings.map(m => ({
      id: m.id,
      type: m.type || 3,
      name: m.name,
      discount: Number(m.discount) || 0,
      threshold: 0,
    }));
  }

  private applyFlashSale(
    items: OrderItem[],
    flashSales: MarketingItem[]
  ): { discount: number; applied: AppliedMarketing[] } {
    let discount = 0;
    const applied: AppliedMarketing[] = [];

    if (flashSales.length === 0) {
      return { discount, applied };
    }

    const bestFlashSale = flashSales.reduce((best, current) =>
      (current.discount > best.discount ? current : best)
    );

    const rate = bestFlashSale.discount / 10;
    const originalSubtotal = this.calcSubtotal(items);
    const discounted = originalSubtotal * rate;
    discount = originalSubtotal - discounted;

    applied.push({
      id: bestFlashSale.id,
      name: bestFlashSale.name,
      type: MarketingType.FLASH_SALE,
      discount_amount: this.round(discount),
      description: `秒杀价 ${(rate * 10).toFixed(1)}折，优惠 ¥${this.round(discount)}`,
    });

    return { discount, applied };
  }

  private applyDiscount(
    amount: number,
    discounts: MarketingItem[]
  ): { discount: number; applied: AppliedMarketing[] } {
    let discount = 0;
    const applied: AppliedMarketing[] = [];

    if (discounts.length === 0 || amount <= 0) {
      return { discount, applied };
    }

    const bestDiscount = discounts.reduce((best, current) =>
      (current.discount < best.discount ? current : best)
    );

    const rate = bestDiscount.discount / 10;
    const discounted = amount * rate;
    discount = amount - discounted;

    applied.push({
      id: bestDiscount.id,
      name: bestDiscount.name,
      type: MarketingType.DISCOUNT,
      discount_amount: this.round(discount),
      description: `折扣 ${(rate * 10).toFixed(1)}折，优惠 ¥${this.round(discount)}`,
    });

    return { discount, applied };
  }

  private applyFullReduction(
    amount: number,
    reductions: MarketingItem[]
  ): { discount: number; applied: AppliedMarketing[] } {
    let discount = 0;
    const applied: AppliedMarketing[] = [];

    if (reductions.length === 0 || amount <= 0) {
      return { discount, applied };
    }

    let currentAmount = amount;
    const sortedReductions = [...reductions].sort((a, b) =>
      (b.threshold || 0) - (a.threshold || 0)
    );

    for (const fr of sortedReductions) {
      const threshold = fr.threshold || 0;
      if (currentAmount >= threshold) {
        const times = Math.floor(currentAmount / threshold);
        const reductionAmount = times * fr.discount;
        discount += reductionAmount;
        currentAmount -= reductionAmount;

        applied.push({
          id: fr.id,
          name: fr.name,
          type: MarketingType.FULL_REDUCTION,
          discount_amount: this.round(reductionAmount),
          description: threshold > 0
            ? `满${threshold}减${fr.discount}，共${times}次，减 ¥${this.round(reductionAmount)}`
            : `直减 ¥${this.round(reductionAmount)}`,
        });
      }
    }

    return { discount, applied };
  }

  private applyCoupons(
    amount: number,
    coupons: MarketingItem[],
    warnings: string[]
  ): { discount: number; applied: AppliedMarketing[] } {
    let discount = 0;
    const applied: AppliedMarketing[] = [];

    if (coupons.length === 0 || amount <= 0) {
      return { discount, applied };
    }

    if (coupons.length > this.MAX_COUPONS_STACK) {
      warnings.push(`最多使用${this.MAX_COUPONS_STACK}张优惠券，已自动选择最优`);
    }

    const sortedCoupons = [...coupons].sort((a, b) => b.discount - a.discount);
    const usable = sortedCoupons.slice(0, this.MAX_COUPONS_STACK);

    let currentAmount = amount;
    for (const coupon of usable) {
      if (currentAmount > coupon.discount) {
        discount += coupon.discount;
        currentAmount -= coupon.discount;

        applied.push({
          id: coupon.id,
          name: coupon.name,
          type: MarketingType.COUPON,
          discount_amount: this.round(coupon.discount),
          description: `优惠券抵扣 ¥${this.round(coupon.discount)}`,
        });
      }
    }

    return { discount, applied };
  }

  private detectConflicts(applied: AppliedMarketing[], warnings: string[]): void {
    const types = applied.map(a => a.type);
    const typeSet = new Set(types);

    if (
      typeSet.has(MarketingType.FLASH_SALE) &&
      (typeSet.has(MarketingType.DISCOUNT))
    ) {
      warnings.push('秒杀活动与折扣活动同时生效，请确认活动规则');
    }

    if (
      typeSet.has(MarketingType.FLASH_SALE) &&
      typeSet.has(MarketingType.FULL_REDUCTION)
    ) {
      warnings.push('秒杀活动叠加了满减活动，请确认是否符合预期');
    }
  }

  private generateCombinations<T>(items: T[], maxSize: number): T[][] {
    const results: T[][] = [[]];
    const limit = Math.min(items.length, maxSize);

    for (let size = 1; size <= limit; size++) {
      this.backtrack(items, size, 0, [], results);
    }

    return results;
  }

  private backtrack<T>(
    items: T[],
    size: number,
    start: number,
    current: T[],
    results: T[][]
  ): void {
    if (current.length === size) {
      results.push([...current]);
      return;
    }

    for (let i = start; i < items.length; i++) {
      current.push(items[i]);
      this.backtrack(items, size, i + 1, current, results);
      current.pop();
    }
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

export const marketingCalcService = new MarketingCalcService();
export default MarketingCalcService;
