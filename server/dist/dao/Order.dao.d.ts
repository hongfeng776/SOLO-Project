import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import Order, { OrderAttributes, OrderCreationAttributes } from '../models/Order.model';
interface OrderQueryParams {
    page: number;
    pageSize: number;
    keyword?: string;
    orderNo?: string;
    channelId?: string;
    promoterId?: string;
    status?: number;
    startTime?: string;
    endTime?: string;
}
declare class OrderDao {
    create(data: OrderCreationAttributes, options?: CreateOptions): Promise<Order>;
    findByPk(id: string, options?: FindOptions): Promise<Order | null>;
    findOne(options: FindOptions): Promise<Order | null>;
    findAll(options?: FindOptions): Promise<Order[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: Order[];
        count: number;
    }>;
    update(data: Partial<OrderAttributes>, options: UpdateOptions): Promise<[number, Order[]]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: CountOptions): Promise<number>;
    findById(id: string): Promise<Order | null>;
    findAllPaged(params: OrderQueryParams): Promise<{
        rows: Order[];
        count: number;
    }>;
    findByOrderNo(orderNo: string): Promise<Order | null>;
    existsByOrderNo(orderNo: string): Promise<boolean>;
    softDelete(id: string): Promise<number>;
    bulkSoftDelete(ids: string[]): Promise<number>;
    bulkUpdate(ids: string[], data: Partial<OrderAttributes>): Promise<[number, Order[]]>;
}
declare const _default: OrderDao;
export default _default;
//# sourceMappingURL=Order.dao.d.ts.map