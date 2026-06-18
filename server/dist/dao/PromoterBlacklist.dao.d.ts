import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions } from 'sequelize';
import PromoterBlacklist, { PromoterBlacklistAttributes, PromoterBlacklistCreationAttributes } from '../models/PromoterBlacklist.model';
import { BlacklistType } from '../constants/enum';
interface BlacklistMatchResult {
    matched: boolean;
    items: PromoterBlacklist[];
}
declare class PromoterBlacklistDao {
    create(data: PromoterBlacklistCreationAttributes, options?: CreateOptions): Promise<PromoterBlacklist>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterBlacklist | null>;
    findOne(options: FindOptions): Promise<PromoterBlacklist | null>;
    findAll(options?: FindOptions): Promise<PromoterBlacklist[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: PromoterBlacklist[];
        count: number;
    }>;
    update(data: Partial<PromoterBlacklistAttributes>, options: UpdateOptions): Promise<[number, PromoterBlacklist[]]>;
    destroy(options: DestroyOptions): Promise<number>;
    findById(id: string): Promise<PromoterBlacklist | null>;
    findAllPaged(params: {
        page: number;
        pageSize: number;
        type?: BlacklistType;
        keyword?: string;
        isActive?: boolean;
    }): Promise<{
        rows: PromoterBlacklist[];
        count: number;
    }>;
    checkMatch(params: {
        phone?: string;
        idCard?: string;
        name?: string;
        wechatId?: string;
    }): Promise<BlacklistMatchResult>;
    existsByTypeAndValue(type: BlacklistType, value: string, excludeId?: string): Promise<boolean>;
    softDelete(id: string): Promise<number>;
    setInactive(id: string): Promise<[number, PromoterBlacklist[]]>;
}
declare const _default: PromoterBlacklistDao;
export default _default;
//# sourceMappingURL=PromoterBlacklist.dao.d.ts.map