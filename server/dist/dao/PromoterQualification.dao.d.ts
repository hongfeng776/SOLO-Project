import { FindOptions, CreateOptions } from 'sequelize';
import PromoterQualification, { PromoterQualificationAttributes, PromoterQualificationCreationAttributes } from '../models/PromoterQualification.model';
import { QualificationType, VerifyStatus } from '../constants/enum';
declare class PromoterQualificationDao {
    create(data: PromoterQualificationCreationAttributes, options?: CreateOptions): Promise<PromoterQualification>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterQualification | null>;
    findOne(options: FindOptions): Promise<PromoterQualification | null>;
    findAll(options?: FindOptions): Promise<PromoterQualification[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: PromoterQualification[];
        count: number;
    }>;
    findByPromoterId(promoterId: string): Promise<PromoterQualification[]>;
    findAllPaged(params: {
        page: number;
        pageSize: number;
        promoterId?: string;
        type?: QualificationType;
        verifyStatus?: VerifyStatus;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        rows: PromoterQualification[];
        count: number;
    }>;
    update(id: string, data: Partial<PromoterQualificationAttributes>): Promise<[number, PromoterQualification[]]>;
    delete(id: string): Promise<number>;
}
declare const _default: PromoterQualificationDao;
export default _default;
//# sourceMappingURL=PromoterQualification.dao.d.ts.map