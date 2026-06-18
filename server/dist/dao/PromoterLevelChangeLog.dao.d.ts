import { FindOptions, CreateOptions } from 'sequelize';
import PromoterLevelChangeLog, { PromoterLevelChangeLogCreationAttributes } from '../models/PromoterLevelChangeLog.model';
import { LevelChangeSource, PromoterLevel } from '../constants/enum';
declare class PromoterLevelChangeLogDao {
    create(data: PromoterLevelChangeLogCreationAttributes, options?: CreateOptions): Promise<PromoterLevelChangeLog>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterLevelChangeLog | null>;
    findAllPaged(params: {
        page: number;
        pageSize: number;
        promoterId?: string;
        changeSource?: LevelChangeSource;
        fromLevel?: PromoterLevel;
        toLevel?: PromoterLevel;
        anomalyFlagged?: boolean;
        operatorId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        rows: PromoterLevelChangeLog[];
        count: number;
    }>;
    findByPromoterId(promoterId: string, options?: FindOptions): Promise<PromoterLevelChangeLog[]>;
    countByPromoterId(promoterId: string): Promise<number>;
    findAnomalies(options?: FindOptions): Promise<PromoterLevelChangeLog[]>;
    getIterationStats(options?: FindOptions): Promise<{
        promoterId: string;
        totalChanges: number;
        lastChangeAt: Date | null;
    }[]>;
}
declare const _default: PromoterLevelChangeLogDao;
export default _default;
//# sourceMappingURL=PromoterLevelChangeLog.dao.d.ts.map