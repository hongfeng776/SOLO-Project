import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import Promoter, { PromoterAttributes, PromoterCreationAttributes } from '../models/Promoter.model';
interface PromoterQueryParams {
    page: number;
    pageSize: number;
    keyword?: string;
    channelId?: string;
    level?: string;
    status?: number;
}
declare class PromoterDao {
    create(data: PromoterCreationAttributes, options?: CreateOptions): Promise<Promoter>;
    findByPk(id: string, options?: FindOptions): Promise<Promoter | null>;
    findOne(options: FindOptions): Promise<Promoter | null>;
    findAll(options?: FindOptions): Promise<Promoter[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: Promoter[];
        count: number;
    }>;
    update(data: Partial<PromoterAttributes>, options: UpdateOptions): Promise<[number, Promoter[]]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: CountOptions): Promise<number>;
    findById(id: string): Promise<Promoter | null>;
    findAllPaged(params: PromoterQueryParams): Promise<{
        rows: Promoter[];
        count: number;
    }>;
    softDelete(id: string): Promise<number>;
    bulkSoftDelete(ids: string[]): Promise<number>;
    existsByCode(code: string): Promise<boolean>;
    existsByCodeAndId(code: string, excludeId: string): Promise<boolean>;
    getTodayCount(): Promise<number>;
}
declare const _default: PromoterDao;
export default _default;
//# sourceMappingURL=Promoter.dao.d.ts.map