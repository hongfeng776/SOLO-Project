import { FindOptions, CreateOptions, CountOptions } from 'sequelize';
import PromoterRiskRelease, { PromoterRiskReleaseAttributes, PromoterRiskReleaseCreationAttributes } from '../models/PromoterRiskRelease.model';
declare class PromoterRiskReleaseDao {
    create(data: PromoterRiskReleaseCreationAttributes, options?: CreateOptions): Promise<PromoterRiskRelease>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterRiskRelease | null>;
    findOne(options: FindOptions): Promise<PromoterRiskRelease | null>;
    findAll(options?: FindOptions): Promise<PromoterRiskRelease[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: PromoterRiskRelease[];
        count: number;
    }>;
    count(options?: CountOptions): Promise<number>;
    findByPromoterId(promoterId: string): Promise<PromoterRiskRelease[]>;
    findAllPaged(params: {
        page: number;
        pageSize: number;
        promoterId?: string;
        verifyStatus?: number;
        riskRecordId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        rows: PromoterRiskRelease[];
        count: number;
    }>;
    update(id: string, data: Partial<PromoterRiskReleaseAttributes>): Promise<[number, PromoterRiskRelease[]]>;
    delete(id: string): Promise<number>;
}
declare const _default: PromoterRiskReleaseDao;
export default _default;
//# sourceMappingURL=PromoterRiskRelease.dao.d.ts.map