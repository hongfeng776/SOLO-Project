import { FindOptions, CreateOptions, CountOptions } from 'sequelize';
import PromoterRiskWarning, { PromoterRiskWarningAttributes, PromoterRiskWarningCreationAttributes } from '../models/PromoterRiskWarning.model';
declare class PromoterRiskWarningDao {
    create(data: PromoterRiskWarningCreationAttributes, options?: CreateOptions): Promise<PromoterRiskWarning>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterRiskWarning | null>;
    findOne(options: FindOptions): Promise<PromoterRiskWarning | null>;
    findAll(options?: FindOptions): Promise<PromoterRiskWarning[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: PromoterRiskWarning[];
        count: number;
    }>;
    count(options?: CountOptions): Promise<number>;
    findByPromoterId(promoterId: string): Promise<PromoterRiskWarning[]>;
    findAllPaged(params: {
        page: number;
        pageSize: number;
        promoterId?: string;
        warningLevel?: string;
        warningType?: string;
        isHandled?: boolean;
        ruleCode?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        rows: PromoterRiskWarning[];
        count: number;
    }>;
    update(id: string, data: Partial<PromoterRiskWarningAttributes>): Promise<[number, PromoterRiskWarning[]]>;
    delete(id: string): Promise<number>;
}
declare const _default: PromoterRiskWarningDao;
export default _default;
//# sourceMappingURL=PromoterRiskWarning.dao.d.ts.map