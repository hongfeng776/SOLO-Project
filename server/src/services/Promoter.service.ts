import { promoterDao, channelDao } from '../dao';
import { PromoterAttributes, PromoterCreationAttributes } from '../models/Promoter.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { PromoterStatus, ChannelStatus } from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';

interface PromoterQueryParams extends PaginationParams {
  keyword?: string;
  channelId?: string;
  level?: string;
  status?: number;
}

class PromoterService {
  public async create(data: PromoterCreationAttributes) {
    const code = await this.generateCode();

    if (data.channelId) {
      const channel = await channelDao.findById(data.channelId);
      if (!channel) {
        throw new AppError('渠道不存在', BusinessCode.NOT_FOUND);
      }
      if (channel.status !== ChannelStatus.ENABLED) {
        throw new AppError('渠道未启用，无法绑定', BusinessCode.ERROR);
      }
    }

    const result = await promoterDao.create({
      ...data,
      code,
      registerAt: data.registerAt || new Date(),
      status: PromoterStatus.PENDING as any,
    });
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    return result;
  }

  private async generateCode(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const todayCount = await promoterDao.getTodayCount();
    const seq = String(todayCount + 1).padStart(6, '0');
    const code = `P${dateStr}${seq}`;
    const exists = await promoterDao.existsByCode(code);
    if (exists) {
      return this.generateCode();
    }
    return code;
  }

  public async findById(id: string) {
    const cacheKey = `${CacheKey.PROMOTER_DETAIL}${id}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    await CacheUtils.set(cacheKey, promoter, CacheTTL.MEDIUM);
    return promoter;
  }

  public async findAll(params: PromoterQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const cacheKey = `${CacheKey.PROMOTER_LIST}${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<PaginationResult<any>>(cacheKey);
    if (cached) return cached;

    const { rows, count } = await promoterDao.findAllPaged(params);
    const result: PaginationResult<any> = {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async findByChannelId(channelId: string) {
    return promoterDao.findByChannelId(channelId);
  }

  public async update(id: string, data: Partial<PromoterAttributes>) {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    if (data.code && data.code !== promoter.code) {
      const exists = await promoterDao.existsByCodeAndId(data.code, id);
      if (exists) {
        throw new AppError('推客编号已存在', BusinessCode.ERROR);
      }
    }
    await promoterDao.update(data, { where: { id } });
    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    return promoterDao.findById(id);
  }

  public async delete(id: string): Promise<void> {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    await promoterDao.softDelete(id);
    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async bulkDelete(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的记录', BusinessCode.PARAM_ERROR);
    }
    await promoterDao.bulkSoftDelete(ids);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async updateStatus(id: string, status: number): Promise<void> {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }

    const currentStatus = promoter.status as number;

    if (currentStatus === PromoterStatus.PENDING && status !== PromoterStatus.NORMAL && status !== PromoterStatus.REJECTED) {
      throw new AppError('审核中的推客只能审核通过或拒绝', BusinessCode.ERROR);
    }
    if (currentStatus === PromoterStatus.CANCELLED) {
      throw new AppError('已注销的推客不能修改状态', BusinessCode.ERROR);
    }
    if (currentStatus === PromoterStatus.REJECTED && status !== PromoterStatus.PENDING) {
      throw new AppError('已拒绝的推客只能重新提交审核', BusinessCode.ERROR);
    }
    if (currentStatus === PromoterStatus.FROZEN && status === PromoterStatus.PENDING) {
      throw new AppError('冻结的推客不能设为审核中', BusinessCode.ERROR);
    }

    await promoterDao.update({ status: status as any }, { where: { id } });
    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async batchUpdateStatus(ids: string[], status: number): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的记录', BusinessCode.PARAM_ERROR);
    }
    for (const id of ids) {
      const promoter = await promoterDao.findById(id);
      if (promoter) {
        await promoterDao.update({ status: status as any }, { where: { id } });
      }
    }
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async approve(id: string, auditUserId: string): Promise<void> {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    if ((promoter.status as number) !== PromoterStatus.PENDING) {
      throw new AppError('当前推客状态不是审核中，无法审核通过', BusinessCode.ERROR);
    }
    await promoterDao.update({ status: PromoterStatus.NORMAL as any } as any, { where: { id } });
    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async reject(id: string, auditUserId: string, reason: string): Promise<void> {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    if ((promoter.status as number) !== PromoterStatus.PENDING) {
      throw new AppError('当前推客状态不是审核中，无法拒绝', BusinessCode.ERROR);
    }
    await promoterDao.update(
      { status: PromoterStatus.REJECTED as any, remark: reason } as any,
      { where: { id } }
    );
    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async bindChannel(promoterId: string, channelId: string): Promise<void> {
    const promoter = await promoterDao.findById(promoterId);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    if ((promoter.status as number) !== PromoterStatus.NORMAL) {
      throw new AppError('只有正常状态的推客才能绑定渠道', BusinessCode.ERROR);
    }
    if (promoter.channelId) {
      throw new AppError('推客已绑定渠道，请先解绑', BusinessCode.ERROR);
    }

    const channel = await channelDao.findById(channelId);
    if (!channel) {
      throw new AppError('渠道不存在', BusinessCode.NOT_FOUND);
    }
    if (channel.status !== ChannelStatus.ENABLED) {
      throw new AppError('渠道未启用，无法绑定', BusinessCode.ERROR);
    }

    await promoterDao.update({ channelId } as any, { where: { id: promoterId } });
    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${promoterId}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }
}

export default new PromoterService();
