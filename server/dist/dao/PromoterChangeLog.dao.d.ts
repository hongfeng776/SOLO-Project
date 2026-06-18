import { FindOptions, CreateOptions } from 'sequelize';
import PromoterChangeLog, { PromoterChangeLogAttributes, PromoterChangeLogCreationAttributes } from '../models/PromoterChangeLog.model';
declare class PromoterChangeLogDao {
    create(data: PromoterChangeLogCreationAttributes, options?: CreateOptions): Promise<PromoterChangeLog>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterChangeLog | null>;
    findOne(options: FindOptions): Promise<PromoterChangeLog | null>;
    findAll(options?: FindOptions): Promise<PromoterChangeLog[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: PromoterChangeLog[];
        count: number;
    }>;
    findByPromoterId(promoterId: string): Promise<PromoterChangeLog[]>;
    findAllPaged(params: {
        page: number;
        pageSize: number;
        promoterId?: string;
        operatorId?: string;
        fieldName?: string;
        changeType?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        rows: PromoterChangeLog[];
        count: number;
    }>;
    update(id: string, data: Partial<PromoterChangeLogAttributes>): Promise<[number, PromoterChangeLog[]]>;
    delete(id: string): Promise<number>;
}
declare const _default: PromoterChangeLogDao;
export default _default;
//# sourceMappingURL=PromoterChangeLog.dao.d.ts.map