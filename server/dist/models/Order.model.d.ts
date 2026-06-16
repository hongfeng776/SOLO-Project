import { Model, Optional } from 'sequelize';
import { OrderStatus } from '../constants/enum';
interface OrderAttributes {
    id: string;
    orderNo: string;
    channelId?: string;
    promoterId?: string;
    userId?: string;
    productName: string;
    productSku?: string;
    productImage?: string;
    unitPrice: number;
    quantity: number;
    totalAmount: number;
    discountAmount?: number;
    payAmount: number;
    commissionRate?: number;
    commissionAmount?: number;
    status: OrderStatus;
    payTime?: Date;
    shipTime?: Date;
    completeTime?: Date;
    cancelTime?: Date;
    cancelReason?: string;
    refundAmount?: number;
    remark?: string;
    receiverName?: string;
    receiverPhone?: string;
    receiverAddress?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'discountAmount' | 'commissionRate' | 'commissionAmount' | 'status' | 'refundAmount' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
    id: string;
    orderNo: string;
    channelId?: string;
    promoterId?: string;
    userId?: string;
    productName: string;
    productSku?: string;
    productImage?: string;
    unitPrice: number;
    quantity: number;
    totalAmount: number;
    discountAmount?: number;
    payAmount: number;
    commissionRate?: number;
    commissionAmount?: number;
    status: OrderStatus;
    payTime?: Date;
    shipTime?: Date;
    completeTime?: Date;
    cancelTime?: Date;
    cancelReason?: string;
    refundAmount?: number;
    remark?: string;
    receiverName?: string;
    receiverPhone?: string;
    receiverAddress?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { Order, OrderAttributes, OrderCreationAttributes };
export default Order;
//# sourceMappingURL=Order.model.d.ts.map