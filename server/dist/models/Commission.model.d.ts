import { Model, Optional } from 'sequelize';
import { CommissionStatus } from '../constants/enum';
interface CommissionAttributes {
    id: string;
    orderId?: string;
    orderNo?: string;
    promoterId: string;
    channelId?: string;
    type: number;
    amount: number;
    rate?: number;
    status: CommissionStatus;
    settleTime?: Date;
    remark?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface CommissionCreationAttributes extends Optional<CommissionAttributes, 'id' | 'type' | 'amount' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class Commission extends Model<CommissionAttributes, CommissionCreationAttributes> implements CommissionAttributes {
    id: string;
    orderId?: string;
    orderNo?: string;
    promoterId: string;
    channelId?: string;
    type: number;
    amount: number;
    rate?: number;
    status: CommissionStatus;
    settleTime?: Date;
    remark?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { Commission, CommissionAttributes, CommissionCreationAttributes };
export default Commission;
//# sourceMappingURL=Commission.model.d.ts.map