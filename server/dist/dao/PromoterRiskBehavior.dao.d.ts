import { FindOptions, CreateOptions, CountOptions } from 'sequelize';
import PromoterRiskBehavior, { PromoterRiskBehaviorAttributes, PromoterRiskBehaviorCreationAttributes } from '../models/PromoterRiskBehavior.model';
declare class PromoterRiskBehaviorDao {
    create(data: PromoterRiskBehaviorCreationAttributes, options?: CreateOptions): Promise<PromoterRiskBehavior>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterRiskBehavior | null>;
    findOne(options: FindOptions): Promise<PromoterRiskBehavior | null>;
    findAll(options?: FindOptions): Promise<PromoterRiskBehavior[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: PromoterRiskBehavior[];
        count: number;
    }>;
    count(options?: CountOptions): Promise<number>;
    findByPromoterId(promoterId: string): Promise<PromoterRiskBehavior[]>;
    findAllPaged(params: {
        page: number;
        pageSize: number;
        promoterId?: string;
        behaviorType?: string;
        riskFlagged?: boolean;
        riskType?: string;
        orderId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        rows: PromoterRiskBehavior[];
        count: number;
    }>;
    update(id: string, data: Partial<PromoterRiskBehaviorAttributes>): Promise<[number, PromoterRiskBehavior[]]>;
    delete(id: string): Promise<number>;
}
declare const _default: PromoterRiskBehaviorDao;
export default _default;
//# sourceMappingURL=PromoterRiskBehavior.dao.d.ts.map