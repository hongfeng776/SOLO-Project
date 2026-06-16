import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import Channel, { ChannelAttributes, ChannelCreationAttributes } from '../models/Channel.model';
interface ChannelQueryParams {
    page: number;
    pageSize: number;
    keyword?: string;
    type?: string;
    status?: number;
}
declare class ChannelDao {
    create(data: ChannelCreationAttributes, options?: CreateOptions): Promise<Channel>;
    findByPk(id: string, options?: FindOptions): Promise<Channel | null>;
    findOne(options: FindOptions): Promise<Channel | null>;
    findAll(options?: FindOptions): Promise<Channel[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: Channel[];
        count: number;
    }>;
    update(data: Partial<ChannelAttributes>, options: UpdateOptions): Promise<[number, Channel[]]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: CountOptions): Promise<number>;
    findById(id: string): Promise<Channel | null>;
    findAllPaged(params: ChannelQueryParams): Promise<{
        rows: Channel[];
        count: number;
    }>;
    softDelete(id: string): Promise<number>;
    bulkSoftDelete(ids: string[]): Promise<number>;
    existsByCode(code: string): Promise<boolean>;
    existsByCodeAndId(code: string, excludeId: string): Promise<boolean>;
}
declare const _default: ChannelDao;
export default _default;
//# sourceMappingURL=Channel.dao.d.ts.map