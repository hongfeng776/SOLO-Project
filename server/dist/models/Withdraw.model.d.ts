import { Model, Optional } from 'sequelize';
import { WithdrawStatus } from '../constants/enum';
interface WithdrawAttributes {
    id: string;
    withdrawNo: string;
    promoterId: string;
    amount: number;
    fee?: number;
    actualAmount: number;
    status: WithdrawStatus;
    payMethod: number;
    accountInfo?: any;
    auditRemark?: string;
    auditAt?: Date;
    auditUserId?: string;
    payTime?: Date;
    payRemark?: string;
    remark?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface WithdrawCreationAttributes extends Optional<WithdrawAttributes, 'id' | 'fee' | 'actualAmount' | 'status' | 'payMethod' | 'accountInfo' | 'auditRemark' | 'auditAt' | 'auditUserId' | 'payTime' | 'payRemark' | 'remark' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class Withdraw extends Model<WithdrawAttributes, WithdrawCreationAttributes> implements WithdrawAttributes {
    id: string;
    withdrawNo: string;
    promoterId: string;
    amount: number;
    fee?: number;
    actualAmount: number;
    status: WithdrawStatus;
    payMethod: number;
    accountInfo?: any;
    auditRemark?: string;
    auditAt?: Date;
    auditUserId?: string;
    payTime?: Date;
    payRemark?: string;
    remark?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { Withdraw, WithdrawAttributes, WithdrawCreationAttributes };
export default Withdraw;
//# sourceMappingURL=Withdraw.model.d.ts.map