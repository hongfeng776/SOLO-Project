import User from './User.model';
import Channel from './Channel.model';
import Promoter from './Promoter.model';
import Order from './Order.model';
import Commission from './Commission.model';
import Marketing from './Marketing.model';
import Withdraw from './Withdraw.model';
import Role from './Role.model';
import Permission from './Permission.model';
import RolePermission from './RolePermission.model';
import UserRole from './UserRole.model';
declare const models: {
    User: typeof User;
    Channel: typeof Channel;
    Promoter: typeof Promoter;
    Order: typeof Order;
    Commission: typeof Commission;
    Marketing: typeof Marketing;
    Withdraw: typeof Withdraw;
    Role: typeof Role;
    Permission: typeof Permission;
    RolePermission: typeof RolePermission;
    UserRole: typeof UserRole;
};
declare const associate: () => void;
export { associate };
export { User, Channel, Promoter, Order, Commission, Marketing, Withdraw, Role, Permission, RolePermission, UserRole };
export default models;
//# sourceMappingURL=index.d.ts.map