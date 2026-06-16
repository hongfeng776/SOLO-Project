import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import Withdraw, { WithdrawAttributes, WithdrawCreationAttributes } from '../models/Withdraw.model';
interface WithdrawQueryParams {
    page: number;
    pageSize: number;
    promoterId?: string;
    status?: number;
}
declare class WithdrawDao {
    create(data: WithdrawCreationAttributes, options?: CreateOptions): Promise<Withdraw>;
    findByPk(id: string, options?: FindOptions): Promise<Withdraw | null>;
    findOne(options: FindOptions): Promise<Withdraw | null>;
    findAll(options?: FindOptions): Promise<Withdraw[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: Withdraw[];
        count: number;
    }>;
    update(data: Partial<WithdrawAttributes>, options: UpdateOptions): Promise<[number, Withdraw[]]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: CountOptions): Promise<number>;
    findById(id: string): Promise<Withdraw | null>;
    findAllPaged(params: WithdrawQueryParams): Promise<{
        rows: Withdraw[];
        count: number;
    }>;
    softDelete(id: string): Promise<number>;
    bulkSoftDelete(ids: string[]): Promise<number>;
    findByWithdrawNo(withdrawNo: string): Promise<Withdraw | null>;
    existsByWithdrawNo(withdrawNo: string): Promise<boolean>;
}
declare const _default: WithdrawDao;
export default _default;
//# sourceMappingURL=Withdraw.dao.d.ts.map