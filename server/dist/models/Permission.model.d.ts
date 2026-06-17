import { Model, Optional } from 'sequelize';
import { PermissionType, CommonStatus } from '../constants/enum';
interface PermissionAttributes {
    id: string;
    parentId?: string;
    name: string;
    code: string;
    type: PermissionType;
    path?: string;
    icon?: string;
    component?: string;
    method?: string;
    sort?: number;
    status: CommonStatus;
    remark?: string;
    module?: string;
    level?: number;
    createdBy?: string;
    createdByName?: string;
    isSystem?: boolean;
    visibleRange?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'parentId' | 'type' | 'path' | 'icon' | 'component' | 'method' | 'sort' | 'status' | 'remark' | 'module' | 'level' | 'createdBy' | 'createdByName' | 'isSystem' | 'visibleRange' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    id: string;
    parentId?: string;
    name: string;
    code: string;
    type: PermissionType;
    path?: string;
    icon?: string;
    component?: string;
    method?: string;
    sort?: number;
    status: CommonStatus;
    remark?: string;
    module?: string;
    level?: number;
    createdBy?: string;
    createdByName?: string;
    isSystem?: boolean;
    visibleRange?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { Permission, PermissionAttributes, PermissionCreationAttributes };
export default Permission;
//# sourceMappingURL=Permission.model.d.ts.map