import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import Marketing, { MarketingAttributes, MarketingCreationAttributes } from '../models/Marketing.model';
interface MarketingQueryParams {
    page: number;
    pageSize: number;
    keyword?: string;
    type?: string;
    status?: number;
}
declare class MarketingDao {
    create(data: MarketingCreationAttributes, options?: CreateOptions): Promise<Marketing>;
    findByPk(id: string, options?: FindOptions): Promise<Marketing | null>;
    findOne(options: FindOptions): Promise<Marketing | null>;
    findAll(options?: FindOptions): Promise<Marketing[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: Marketing[];
        count: number;
    }>;
    update(data: Partial<MarketingAttributes>, options: UpdateOptions): Promise<[number, Marketing[]]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: CountOptions): Promise<number>;
    findById(id: string): Promise<Marketing | null>;
    findAllPaged(params: MarketingQueryParams): Promise<{
        rows: Marketing[];
        count: number;
    }>;
    softDelete(id: string): Promise<number>;
    bulkSoftDelete(ids: string[]): Promise<number>;
    existsByCode(code: string): Promise<boolean>;
    existsByCodeAndId(code: string, excludeId: string): Promise<boolean>;
}
declare const _default: MarketingDao;
export default _default;
//# sourceMappingURL=Marketing.dao.d.ts.map