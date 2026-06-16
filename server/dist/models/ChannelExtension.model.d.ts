import { Model, Optional } from 'sequelize';
interface ChannelExtensionAttributes {
    id: string;
    channelId: string;
    extensionType: string;
    config: any;
    commissionRules?: any;
    settlementRules?: any;
    status: number;
    createdAt: Date;
    updatedAt: Date;
}
interface ChannelExtensionCreationAttributes extends Optional<ChannelExtensionAttributes, 'id' | 'commissionRules' | 'settlementRules' | 'status' | 'createdAt' | 'updatedAt'> {
}
declare class ChannelExtension extends Model<ChannelExtensionAttributes, ChannelExtensionCreationAttributes> implements ChannelExtensionAttributes {
    id: string;
    channelId: string;
    extensionType: string;
    config: any;
    commissionRules?: any;
    settlementRules?: any;
    status: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { ChannelExtension, ChannelExtensionAttributes, ChannelExtensionCreationAttributes };
export default ChannelExtension;
//# sourceMappingURL=ChannelExtension.model.d.ts.map