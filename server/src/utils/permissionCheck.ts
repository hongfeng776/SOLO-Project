import { PERMISSION_MUTUAL_EXCLUSIONS } from '../constants/enum';

export interface PermissionConflict {
  code: string;
  conflictCode: string;
  reason: string;
}

export function checkPermissionMutualExclusion(permissionIds: string[], allPermissions: any[]): PermissionConflict[] {
  const conflicts: PermissionConflict[] = [];
  const permissionMap = new Map(allPermissions.map(p => [p.id, p.code]));
  const idToCode = (id: string) => permissionMap.get(id);
  const codes = permissionIds.map(id => idToCode(id)).filter(Boolean) as string[];

  for (const exclusion of PERMISSION_MUTUAL_EXCLUSIONS) {
    const [c1, c2] = exclusion.codes;
    if (codes.includes(c1) && codes.includes(c2)) {
      conflicts.push({ code: c1, conflictCode: c2, reason: exclusion.reason });
    }
  }
  return conflicts;
}

export function checkSameLevelPermissionConflict(
  targetUserId: string,
  targetRoleId: string,
  permissionIds: string[],
  userDao: any
): Promise<any[]> {
  return Promise.resolve([]);
}
