import { FindOptions, CreateOptions } from 'sequelize';
import PromoterLevelAdjustRequest, { PromoterLevelAdjustRequestAttributes, PromoterLevelAdjustRequestCreationAttributes } from '../models/PromoterLevelAdjustRequest.model';
import { ManualLevelAdjustStatus, PromoterLevel } from '../constants/enum';
declare class PromoterLevelAdjustRequestDao {
    create(data: PromoterLevelAdjustRequestCreationAttributes, options?: CreateOptions): Promise<PromoterLevelAdjustRequest>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterLevelAdjustRequest | null>;
    findAllPaged(params: {
        page: number;
        pageSize: number;
        promoterId?: string;
        applicantId?: string;
        fromLevel?: PromoterLevel;
        toLevel?: PromoterLevel;
        approveStatus?: ManualLevelAdjustStatus;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        rows: PromoterLevelAdjustRequest[];
        count: number;
    }>;
    findByPromoterId(promoterId: string, options?: FindOptions): Promise<PromoterLevelAdjustRequest[]>;
    findPendingByApproverId(_approverId: string, options?: FindOptions): Promise<PromoterLevelAdjustRequest[]>;
    update(id: string, data: Partial<PromoterLevelAdjustRequestAttributes>): Promise<[number, PromoterLevelAdjustRequest[]]>;
    delete(id: string): Promise<number>;
}
declare const _default: PromoterLevelAdjustRequestDao;
export default _default;
//# sourceMappingURL=PromoterLevelAdjustRequest.dao.d.ts.map