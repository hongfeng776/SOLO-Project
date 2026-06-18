import { FindOptions, CreateOptions } from 'sequelize';
import PromoterAuditLog, { PromoterAuditLogCreationAttributes } from '../models/PromoterAuditLog.model';
import { AuditAction } from '../constants/enum';
declare class PromoterAuditLogDao {
    create(data: PromoterAuditLogCreationAttributes, options?: CreateOptions): Promise<PromoterAuditLog>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterAuditLog | null>;
    findOne(options: FindOptions): Promise<PromoterAuditLog | null>;
    findAll(options?: FindOptions): Promise<PromoterAuditLog[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: PromoterAuditLog[];
        count: number;
    }>;
    findByPromoterId(promoterId: string): Promise<PromoterAuditLog[]>;
    findAllPaged(params: {
        page: number;
        pageSize: number;
        promoterId?: string;
        operatorId?: string;
        action?: AuditAction;
        phone?: string;
        idCard?: string;
        keyword?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        rows: PromoterAuditLog[];
        count: number;
    }>;
    checkDuplicateApply(phone?: string, idCard?: string): Promise<boolean>;
}
declare const _default: PromoterAuditLogDao;
export default _default;
//# sourceMappingURL=PromoterAuditLog.dao.d.ts.map