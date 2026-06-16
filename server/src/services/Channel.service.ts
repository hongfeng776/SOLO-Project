import { channelDao } from '../dao';
import { ChannelAttributes, ChannelCreationAttributes } from '../models/Channel.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';

interface ChannelQueryParams extends PaginationParams {
  keyword?: string;
  type?: string;
  status?: number;
}

class ChannelService {
  public async create(data: ChannelCreationAttributes) {
    const exists = await channelDao.existsByCode(data.code);
    if (exists) {
      throw new AppError('渠道编码已存在', BusinessCode.ERROR);
    }
    const result = await channelDao.create(data);
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);
    return result;
  }

  public async findById(id: string) {
    const cacheKey = `${CacheKey.CHANNEL_DETAIL}${id}`;
    const cached = await CacheUtils.get<ChannelAttributes>(cacheKey);
    if (cached) {
      return cached;
    }

    const channel = await channelDao.findById(id);
    if (!channel) {
      throw new AppError('渠道不存在', BusinessCode.NOT_FOUND);
    }

    await CacheUtils.set(cacheKey, channel, CacheTTL.LONG);
    return channel;
  }

  public async findAll(params: ChannelQueryParams): Promise<PaginationResult<any>> {
    const cacheKey = `${CacheKey.CHANNEL_LIST}:${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<PaginationResult<any>>(cacheKey);
    if (cached) {
      return cached;
    }

    const { page, pageSize } = params;
    const { rows, count } = await channelDao.findAllPaged(params);
    const result = {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async update(id: string, data: Partial<ChannelAttributes>) {
    const channel = await channelDao.findById(id);
    if (!channel) {
      throw new AppError('渠道不存在', BusinessCode.NOT_FOUND);
    }
    if (data.code && data.code !== channel.code) {
      const exists = await channelDao.existsByCodeAndId(data.code, id);
      if (exists) {
        throw new AppError('渠道编码已存在', BusinessCode.ERROR);
      }
    }
    await channelDao.update(data, { where: { id } });
    const result = await channelDao.findById(id);

    await CacheUtils.del(`${CacheKey.CHANNEL_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);

    return result;
  }

  public async delete(id: string): Promise<void> {
    const channel = await channelDao.findById(id);
    if (!channel) {
      throw new AppError('渠道不存在', BusinessCode.NOT_FOUND);
    }
    await channelDao.softDelete(id);

    await CacheUtils.del(`${CacheKey.CHANNEL_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);
  }

  public async bulkDelete(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的记录', BusinessCode.PARAM_ERROR);
    }
    await channelDao.bulkSoftDelete(ids);

    for (const id of ids) {
      await CacheUtils.del(`${CacheKey.CHANNEL_DETAIL}${id}`);
    }
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);
  }

  public async updateStatus(id: string, status: number): Promise<void> {
    const channel = await channelDao.findById(id);
    if (!channel) {
      throw new AppError('渠道不存在', BusinessCode.NOT_FOUND);
    }
    await channelDao.update({ status: status as any }, { where: { id } });

    await CacheUtils.del(`${CacheKey.CHANNEL_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);
  }
}

export default new ChannelService();
