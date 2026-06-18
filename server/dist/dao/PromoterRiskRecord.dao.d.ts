import { FindOptions, CreateOptions, CountOptions } from 'sequelize';
import PromoterRiskRecord, { PromoterRiskRecordAttributes, PromoterRiskRecordCreationAttributes } from '../models/PromoterRiskRecord.model';
declare class PromoterRiskRecordDao {
    create(data: PromoterRiskRecordCreationAttributes, options?: CreateOptions): Promise<PromoterRiskRecord>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterRiskRecord | null>;
    findOne(options: FindOptions): Promise<PromoterRiskRecord | null>;
    findAll(options?: FindOptions): Promise<PromoterRiskRecord[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: PromoterRiskRecord[];
        count: number;
    }>;
    count(options?: CountOptions): Promise<number>;
    findByPromoterId(promoterId: string): Promise<PromoterRiskRecord[]>;
    findAllPaged(params: {
        page: number;
        pageSize: number;
        promoterId?: string;
        riskLevel?: string;
        riskType?: string;
        isActive?: boolean;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        rows: PromoterRiskRecord[];
        count: number;
    }>;
    update(id: string, data: Partial<PromoterRiskRecordAttributes>): Promise<[number, PromoterRiskRecord[]]>;
    delete(id: string): Promise<number>;
}
declare const _default: PromoterRiskRecordDao;
export default _default;
//# sourceMappingURL=PromoterRiskRecord.dao.d.ts.map