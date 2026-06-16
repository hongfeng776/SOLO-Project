import { Model, Optional } from 'sequelize';
import { ChannelStatus, ChannelType } from '../constants/enum';
interface ChannelAttributes {
    id: string;
    name: string;
    code: string;
    type: ChannelType;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    commissionRate: number;
    status: ChannelStatus;
    remark?: string;
    sort?: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface ChannelCreationAttributes extends Optional<ChannelAttributes, 'id' | 'type' | 'commissionRate' | 'status' | 'sort' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class Channel extends Model<ChannelAttributes, ChannelCreationAttributes> implements ChannelAttributes {
    id: string;
    name: string;
    code: string;
    type: ChannelType;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    commissionRate: number;
    status: ChannelStatus;
    remark?: string;
    sort?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { Channel, ChannelAttributes, ChannelCreationAttributes };
export default Channel;
//# sourceMappingURL=Channel.model.d.ts.map