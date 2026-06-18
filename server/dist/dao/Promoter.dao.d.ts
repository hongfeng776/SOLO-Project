import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import Promoter, { PromoterAttributes, PromoterCreationAttributes } from '../models/Promoter.model';
import { AuditStage, AuditStatus } from '../constants/enum';
interface PromoterQueryParams {
    page: number;
    pageSize: number;
    keyword?: string;
    channelId?: string;
    level?: string;
    status?: number;
    auditStage?: AuditStage;
    auditStatus?: AuditStatus;
    phone?: string;
    idCard?: string;
    riskFlagged?: boolean;
    startDate?: string;
    endDate?: string;
}
interface AuditListQueryParams extends PromoterQueryParams {
    auditStageList?: AuditStage[];
    auditStatusList?: AuditStatus[];
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
    findAuditListPaged(params: AuditListQueryParams): Promise<{
        rows: Promoter[];
        count: number;
    }>;
    softDelete(id: string): Promise<number>;
    bulkSoftDelete(ids: string[]): Promise<number>;
    existsByCode(code: string): Promise<boolean>;
    existsByCodeAndId(code: string, excludeId: string): Promise<boolean>;
    findByChannelId(channelId: string): Promise<Promoter[]>;
    updateCommission(promoterId: string, totalDelta: number, availableDelta: number): Promise<[number, Promoter[]]>;
    getTodayCount(): Promise<number>;
    existsByPhone(phone: string, excludeId?: string): Promise<boolean>;
    existsByIdCard(idCard: string, excludeId?: string): Promise<boolean>;
    findByPhone(phone: string): Promise<Promoter | null>;
    findByIdCard(idCard: string): Promise<Promoter | null>;
    findByIdWithAuditLogs(id: string): Promise<Promoter | null>;
    checkLockStatus(phone?: string, idCard?: string): Promise<{
        locked: boolean;
        lockUntil?: Date;
        promoterId?: string;
    }>;
}
declare const _default: PromoterDao;
export default _default;
//# sourceMappingURL=Promoter.dao.d.ts.map