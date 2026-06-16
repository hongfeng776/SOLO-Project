import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import Commission, { CommissionAttributes, CommissionCreationAttributes } from '../models/Commission.model';
interface CommissionQueryParams {
    page: number;
    pageSize: number;
    promoterId?: string;
    status?: number;
    type?: number;
    startTime?: string;
    endTime?: string;
}
export interface CommissionSummary {
    totalAmount: number;
    pendingAmount: number;
    settledAmount: number;
    withdrawnAmount: number;
    deductedAmount: number;
    totalCount: number;
}
declare class CommissionDao {
    create(data: CommissionCreationAttributes, options?: CreateOptions): Promise<Commission>;
    findByPk(id: string, options?: FindOptions): Promise<Commission | null>;
    findOne(options: FindOptions): Promise<Commission | null>;
    findAll(options?: FindOptions): Promise<Commission[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: Commission[];
        count: number;
    }>;
    update(data: Partial<CommissionAttributes>, options: UpdateOptions): Promise<[number, Commission[]]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: CountOptions): Promise<number>;
    findById(id: string): Promise<Commission | null>;
    findAllPaged(params: CommissionQueryParams): Promise<{
        rows: Commission[];
        count: number;
    }>;
    softDelete(id: string): Promise<number>;
    bulkSoftDelete(ids: string[]): Promise<number>;
    summary(params: Partial<CommissionQueryParams>): Promise<CommissionSummary>;
    findByOrderId(orderId: string): Promise<Commission[]>;
    findByOrderIds(orderIds: string[]): Promise<Commission[]>;
    bulkUpdate(ids: string[], data: Partial<CommissionAttributes>): Promise<[number, Commission[]]>;
}
declare const _default: CommissionDao;
export default _default;
//# sourceMappingURL=Commission.dao.d.ts.map