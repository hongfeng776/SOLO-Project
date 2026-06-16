import { Model, Optional } from 'sequelize';
import { PromoterLevel, PromoterStatus } from '../constants/enum';
interface PromoterAttributes {
    id: string;
    channelId?: string;
    code: string;
    name: string;
    nickname?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    wechatId?: string;
    idCard?: string;
    level: PromoterLevel;
    status: PromoterStatus;
    parentId?: string;
    totalOrders?: number;
    totalAmount?: number;
    totalCommission?: number;
    availableCommission?: number;
    frozenCommission?: number;
    registerAt?: Date;
    lastActiveAt?: Date;
    remark?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface PromoterCreationAttributes extends Optional<PromoterAttributes, 'id' | 'channelId' | 'nickname' | 'avatar' | 'phone' | 'email' | 'wechatId' | 'idCard' | 'level' | 'status' | 'parentId' | 'totalOrders' | 'totalAmount' | 'totalCommission' | 'availableCommission' | 'frozenCommission' | 'registerAt' | 'lastActiveAt' | 'remark' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class Promoter extends Model<PromoterAttributes, PromoterCreationAttributes> implements PromoterAttributes {
    id: string;
    channelId?: string;
    code: string;
    name: string;
    nickname?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    wechatId?: string;
    idCard?: string;
    level: PromoterLevel;
    status: PromoterStatus;
    parentId?: string;
    totalOrders?: number;
    totalAmount?: number;
    totalCommission?: number;
    availableCommission?: number;
    frozenCommission?: number;
    registerAt?: Date;
    lastActiveAt?: Date;
    remark?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { Promoter, PromoterAttributes, PromoterCreationAttributes };
export default Promoter;
//# sourceMappingURL=Promoter.model.d.ts.map