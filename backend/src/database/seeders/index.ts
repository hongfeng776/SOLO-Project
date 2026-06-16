import { Organization, Role, Permission, User, UserRole, RolePermission, AuditRule } from '../../models';
import { hashPasswordSync } from '../../utils/password';
import { sequelize, syncDatabase } from '../../config/database';

async function bulkCreateInBatches(model: any, records: any[], batchSize: number = 10): Promise<void> {
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await model.bulkCreate(batch);
  }
}

export async function seedOrganizations(): Promise<void> {
  console.log('[Seeder] Seeding organizations...');

  const existing = await Organization.count();
  if (existing > 0) {
    console.log('[Seeder] Organizations already exist, skipping...');
    return;
  }

  await bulkCreateInBatches(Organization, [
    {
      id: 'org0000000000000000000000000000001',
      parent_id: null,
      name: '中国建设银行总行',
      code: 'CCB_HEAD',
      org_type: 1,
      leader: '张行长',
      phone: '010-12345678',
      email: 'head@ccb.com',
      address: '北京市西城区金融大街25号',
      sort: 1,
      status: 1
    },
    {
      id: 'org0000000000000000000000000000002',
      parent_id: 'org0000000000000000000000000000001',
      name: '上海分行',
      code: 'CCB_SH',
      org_type: 2,
      leader: '李行长',
      phone: '021-12345678',
      email: 'sh@ccb.com',
      address: '上海市浦东新区陆家嘴环路900号',
      sort: 1,
      status: 1
    },
    {
      id: 'org0000000000000000000000000000003',
      parent_id: 'org0000000000000000000000000000001',
      name: '北京分行',
      code: 'CCB_BJ',
      org_type: 2,
      leader: '王行长',
      phone: '010-87654321',
      email: 'bj@ccb.com',
      address: '北京市朝阳区建国路88号',
      sort: 2,
      status: 1
    },
    {
      id: 'org0000000000000000000000000000004',
      parent_id: 'org0000000000000000000000000000002',
      name: '浦东支行',
      code: 'CCB_SH_PD',
      org_type: 3,
      leader: '赵经理',
      phone: '021-88888888',
      email: 'shpd@ccb.com',
      address: '上海市浦东新区世纪大道100号',
      sort: 1,
      status: 1
    },
    {
      id: 'org0000000000000000000000000000005',
      parent_id: 'org0000000000000000000000000000003',
      name: '朝阳支行',
      code: 'CCB_BJ_CY',
      org_type: 3,
      leader: '孙经理',
      phone: '010-66666666',
      email: 'bjcy@ccb.com',
      address: '北京市朝阳区朝阳门外大街16号',
      sort: 1,
      status: 1
    }
  ] as any);

  console.log('[Seeder] Organizations seeded successfully.');
}

export async function seedRoles(): Promise<void> {
  console.log('[Seeder] Seeding roles...');

  const existing = await Role.count();
  if (existing > 0) {
    console.log('[Seeder] Roles already exist, skipping...');
    return;
  }

  await bulkCreateInBatches(Role, [
    {
      id: 'role000000000000000000000000000001',
      name: '超级管理员',
      code: 'admin',
      description: '拥有所有权限',
      sort: 1,
      status: 1,
      data_scope: 1
    },
    {
      id: 'role000000000000000000000000000002',
      name: '机构管理员',
      code: 'manager',
      description: '管理本机构及下属机构',
      sort: 2,
      status: 1,
      data_scope: 3
    },
    {
      id: 'role000000000000000000000000000003',
      name: '业务操作员',
      code: 'operator',
      description: '经办业务操作',
      sort: 3,
      status: 1,
      data_scope: 2
    },
    {
      id: 'role000000000000000000000000000004',
      name: '审核员',
      code: 'auditor',
      description: '审核业务操作',
      sort: 4,
      status: 1,
      data_scope: 2
    }
  ] as any);

  console.log('[Seeder] Roles seeded successfully.');
}

export async function seedPermissions(): Promise<void> {
  console.log('[Seeder] Seeding permissions...');

  const existing = await Permission.count();
  if (existing > 0) {
    console.log('[Seeder] Permissions already exist, skipping...');
    return;
  }

  const permissions = [
    { id: 'perm001', parent_id: null, name: '系统管理', code: 'system', type: 1, path: '/system', component: 'Layout', icon: 'Setting', sort: 1, visible: 1, status: 1 },
    { id: 'perm002', parent_id: 'perm001', name: '用户管理', code: 'system:user', type: 2, path: 'user', component: 'system/user/index', icon: 'User', sort: 1, visible: 1, status: 1, perms: '' },
    { id: 'perm003', parent_id: 'perm002', name: '用户查询', code: 'system:user:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'system:user:query' },
    { id: 'perm004', parent_id: 'perm002', name: '用户新增', code: 'system:user:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'system:user:create' },
    { id: 'perm005', parent_id: 'perm002', name: '用户修改', code: 'system:user:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'system:user:update' },
    { id: 'perm006', parent_id: 'perm002', name: '用户删除', code: 'system:user:delete', type: 3, sort: 4, visible: 1, status: 1, perms: 'system:user:delete' },
    { id: 'perm007', parent_id: 'perm002', name: '重置密码', code: 'system:user:reset', type: 3, sort: 5, visible: 1, status: 1, perms: 'system:user:reset' },

    { id: 'perm008', parent_id: 'perm001', name: '角色管理', code: 'system:role', type: 2, path: 'role', component: 'system/role/index', icon: 'Avatar', sort: 2, visible: 1, status: 1, perms: '' },
    { id: 'perm009', parent_id: 'perm008', name: '角色查询', code: 'system:role:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'system:role:query' },
    { id: 'perm010', parent_id: 'perm008', name: '角色新增', code: 'system:role:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'system:role:create' },
    { id: 'perm011', parent_id: 'perm008', name: '角色修改', code: 'system:role:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'system:role:update' },
    { id: 'perm012', parent_id: 'perm008', name: '角色删除', code: 'system:role:delete', type: 3, sort: 4, visible: 1, status: 1, perms: 'system:role:delete' },

    { id: 'perm013', parent_id: 'perm001', name: '权限管理', code: 'system:permission', type: 2, path: 'permission', component: 'system/permission/index', icon: 'Key', sort: 3, visible: 1, status: 1, perms: '' },
    { id: 'perm014', parent_id: 'perm013', name: '权限查询', code: 'system:permission:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'system:permission:query' },
    { id: 'perm015', parent_id: 'perm013', name: '权限新增', code: 'system:permission:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'system:permission:create' },
    { id: 'perm016', parent_id: 'perm013', name: '权限修改', code: 'system:permission:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'system:permission:update' },
    { id: 'perm017', parent_id: 'perm013', name: '权限删除', code: 'system:permission:delete', type: 3, sort: 4, visible: 1, status: 1, perms: 'system:permission:delete' },

    { id: 'perm018', parent_id: 'perm001', name: '机构管理', code: 'system:org', type: 2, path: 'org', component: 'system/org/index', icon: 'OfficeBuilding', sort: 4, visible: 1, status: 1, perms: '' },
    { id: 'perm019', parent_id: 'perm018', name: '机构查询', code: 'system:org:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'system:org:query' },
    { id: 'perm020', parent_id: 'perm018', name: '机构新增', code: 'system:org:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'system:org:create' },
    { id: 'perm021', parent_id: 'perm018', name: '机构修改', code: 'system:org:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'system:org:update' },
    { id: 'perm022', parent_id: 'perm018', name: '机构删除', code: 'system:org:delete', type: 3, sort: 4, visible: 1, status: 1, perms: 'system:org:delete' },

    { id: 'perm023', parent_id: null, name: '业务管理', code: 'business', type: 1, path: '/business', component: 'Layout', icon: 'DataAnalysis', sort: 2, visible: 1, status: 1 },
    { id: 'perm024', parent_id: 'perm023', name: '交易管理', code: 'business:transaction', type: 2, path: 'transaction', component: 'business/transaction/index', icon: 'Money', sort: 1, visible: 1, status: 1, perms: '' },
    { id: 'perm025', parent_id: 'perm024', name: '交易查询', code: 'business:transaction:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:transaction:query' },
    { id: 'perm026', parent_id: 'perm024', name: '交易新增', code: 'business:transaction:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'business:transaction:create' },
    { id: 'perm027', parent_id: 'perm024', name: '交易修改', code: 'business:transaction:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'business:transaction:update' },

    { id: 'perm028', parent_id: 'perm023', name: '产品管理', code: 'business:product', type: 2, path: 'product', component: 'business/product/index', icon: 'Goods', sort: 2, visible: 1, status: 1, perms: '' },
    { id: 'perm029', parent_id: 'perm028', name: '产品新增', code: 'business:product:create', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:product:create' },
    { id: 'perm030', parent_id: 'perm028', name: '产品修改', code: 'business:product:update', type: 3, sort: 2, visible: 1, status: 1, perms: 'business:product:update' },
    { id: 'perm031', parent_id: 'perm028', name: '产品删除', code: 'business:product:delete', type: 3, sort: 3, visible: 1, status: 1, perms: 'business:product:delete' },

    { id: 'perm032', parent_id: null, name: '审核管理', code: 'audit', type: 1, path: '/audit', component: 'Layout', icon: 'Stamp', sort: 3, visible: 1, status: 1 },
    { id: 'perm033', parent_id: 'perm032', name: '待审核列表', code: 'audit:pending', type: 2, path: 'pending', component: 'audit/pending/index', icon: 'Tickets', sort: 1, visible: 1, status: 1, perms: '' },
    { id: 'perm034', parent_id: 'perm032', name: '审核记录', code: 'audit:record', type: 2, path: 'record', component: 'audit/record/index', icon: 'Document', sort: 2, visible: 1, status: 1, perms: '' },
    { id: 'perm035', parent_id: 'perm034', name: '审核查询', code: 'audit:record:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'audit:record:query' },
    { id: 'perm036', parent_id: 'perm034', name: '提交审核', code: 'audit:record:submit', type: 3, sort: 2, visible: 1, status: 1, perms: 'audit:record:submit' },
    { id: 'perm037', parent_id: 'perm034', name: '审核操作', code: 'audit:record:audit', type: 3, sort: 3, visible: 1, status: 1, perms: 'audit:record:audit' },
    { id: 'perm038', parent_id: 'perm034', name: '取消审核', code: 'audit:record:cancel', type: 3, sort: 4, visible: 1, status: 1, perms: 'audit:record:cancel' },

    { id: 'perm039', parent_id: 'perm032', name: '审核规则', code: 'audit:rule', type: 2, path: 'rule', component: 'audit/rule/index', icon: 'SetUp', sort: 3, visible: 1, status: 1, perms: '' },
    { id: 'perm040', parent_id: 'perm039', name: '规则查询', code: 'audit:rule:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'audit:rule:query' },
    { id: 'perm041', parent_id: 'perm039', name: '规则新增', code: 'audit:rule:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'audit:rule:create' },
    { id: 'perm042', parent_id: 'perm039', name: '规则修改', code: 'audit:rule:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'audit:rule:update' },
    { id: 'perm043', parent_id: 'perm039', name: '规则删除', code: 'audit:rule:delete', type: 3, sort: 4, visible: 1, status: 1, perms: 'audit:rule:delete' },

    { id: 'perm044', parent_id: null, name: '日志管理', code: 'log', type: 1, path: '/log', component: 'Layout', icon: 'Notebook', sort: 4, visible: 1, status: 1 },
    { id: 'perm045', parent_id: 'perm044', name: '操作日志', code: 'log:operation', type: 2, path: 'operation', component: 'log/operation/index', icon: 'Document', sort: 1, visible: 1, status: 1, perms: '' },
    { id: 'perm046', parent_id: 'perm045', name: '日志查询', code: 'log:operation:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'log:operation:query' },
    { id: 'perm047', parent_id: 'perm045', name: '日志导出', code: 'log:operation:export', type: 3, sort: 2, visible: 1, status: 1, perms: 'log:operation:export' },
    { id: 'perm048', parent_id: 'perm045', name: '日志删除', code: 'log:operation:delete', type: 3, sort: 3, visible: 1, status: 1, perms: 'log:operation:delete' }
  ];

  await bulkCreateInBatches(Permission, permissions as any);
  console.log('[Seeder] Permissions seeded successfully.');
}

export async function seedRolePermissions(): Promise<void> {
  console.log('[Seeder] Seeding role permissions...');

  const existing = await RolePermission.count();
  if (existing > 0) {
    console.log('[Seeder] Role permissions already exist, skipping...');
    return;
  }

  const adminRole = await Role.findOne({ where: { code: 'admin' } });
  const managerRole = await Role.findOne({ where: { code: 'manager' } });
  const operatorRole = await Role.findOne({ where: { code: 'operator' } });
  const auditorRole = await Role.findOne({ where: { code: 'auditor' } });

  const allPermissions = await Permission.findAll();
  const allPermIds = allPermissions.map(p => p.id);

  if (adminRole) {
    const adminRPs = allPermIds.map(pid => ({
      id: `rp_${adminRole.id}_${pid}`,
      role_id: adminRole.id,
      permission_id: pid
    }));
    await bulkCreateInBatches(RolePermission, adminRPs as any);
  }

  if (managerRole) {
    const managerCodes = [
      'system:user:query', 'system:user:create', 'system:user:update',
      'system:role:query',
      'system:permission:query',
      'system:org:query',
      'business:transaction:query', 'business:transaction:create', 'business:transaction:update',
      'business:product:create', 'business:product:update',
      'audit:record:query', 'audit:record:submit', 'audit:record:cancel',
      'log:operation:query'
    ];
    const perms = allPermissions.filter(p => managerCodes.includes(p.code) || p.type !== 3);
    const managerRPs = perms.map(p => ({
      id: `rp_${managerRole.id}_${p.id}`,
      role_id: managerRole.id,
      permission_id: p.id
    }));
    await bulkCreateInBatches(RolePermission, managerRPs as any);
  }

  if (operatorRole) {
    const operatorCodes = [
      'business:transaction:query', 'business:transaction:create', 'business:transaction:update',
      'audit:record:query', 'audit:record:submit', 'audit:record:cancel',
      'log:operation:query'
    ];
    const perms = allPermissions.filter(p => operatorCodes.includes(p.code) || (p.type !== 3 && (p.code === 'business' || p.code === 'audit' || p.code === 'log' || p.code === 'business:transaction' || p.code === 'audit:record' || p.code === 'audit:pending' || p.code === 'log:operation')));
    const operatorRPs = perms.map(p => ({
      id: `rp_${operatorRole.id}_${p.id}`,
      role_id: operatorRole.id,
      permission_id: p.id
    }));
    await bulkCreateInBatches(RolePermission, operatorRPs as any);
  }

  if (auditorRole) {
    const auditorCodes = [
      'business:transaction:query',
      'audit:record:query', 'audit:record:audit',
      'log:operation:query'
    ];
    const perms = allPermissions.filter(p => auditorCodes.includes(p.code) || (p.type !== 3 && (p.code === 'business' || p.code === 'audit' || p.code === 'log' || p.code === 'business:transaction' || p.code === 'audit:record' || p.code === 'audit:pending' || p.code === 'log:operation')));
    const auditorRPs = perms.map(p => ({
      id: `rp_${auditorRole.id}_${p.id}`,
      role_id: auditorRole.id,
      permission_id: p.id
    }));
    await bulkCreateInBatches(RolePermission, auditorRPs as any);
  }

  console.log('[Seeder] Role permissions seeded successfully.');
}

export async function seedUsers(): Promise<void> {
  console.log('[Seeder] Seeding users...');

  const existing = await User.count();
  if (existing > 0) {
    console.log('[Seeder] Users already exist, skipping...');
    return;
  }

  const hashedPassword = hashPasswordSync('123456');

  await bulkCreateInBatches(User, [
    {
      id: 'user000000000000000000000000000001',
      username: 'admin',
      password: hashedPassword,
      real_name: '系统管理员',
      email: 'admin@ccb.com',
      phone: '13800000000',
      gender: 1,
      org_id: 'org0000000000000000000000000000001',
      status: 1
    },
    {
      id: 'user000000000000000000000000000002',
      username: 'manager',
      password: hashedPassword,
      real_name: '机构管理员',
      email: 'manager@ccb.com',
      phone: '13800000001',
      gender: 1,
      org_id: 'org0000000000000000000000000000002',
      status: 1
    },
    {
      id: 'user000000000000000000000000000003',
      username: 'operator',
      password: hashedPassword,
      real_name: '业务操作员',
      email: 'operator@ccb.com',
      phone: '13800000002',
      gender: 2,
      org_id: 'org0000000000000000000000000000004',
      status: 1
    },
    {
      id: 'user000000000000000000000000000004',
      username: 'auditor',
      password: hashedPassword,
      real_name: '审核员',
      email: 'auditor@ccb.com',
      phone: '13800000003',
      gender: 1,
      org_id: 'org0000000000000000000000000000001',
      status: 1
    }
  ] as any);

  console.log('[Seeder] Users seeded successfully.');
}

export async function seedUserRoles(): Promise<void> {
  console.log('[Seeder] Seeding user roles...');

  const existing = await UserRole.count();
  if (existing > 0) {
    console.log('[Seeder] User roles already exist, skipping...');
    return;
  }

  const userRoleMap: Record<string, string> = {
    'admin': 'admin',
    'manager': 'manager',
    'operator': 'operator',
    'auditor': 'auditor'
  };

  for (const [username, roleCode] of Object.entries(userRoleMap)) {
    const user = await User.findOne({ where: { username } });
    const role = await Role.findOne({ where: { code: roleCode } });
    if (user && role) {
      await UserRole.create({
        id: `ur_${user.id}_${role.id}`,
        user_id: user.id,
        role_id: role.id
      } as any);
    }
  }

  console.log('[Seeder] User roles seeded successfully.');
}

export async function seedAuditRules(): Promise<void> {
  console.log('[Seeder] Seeding audit rules...');

  const existing = await AuditRule.count();
  if (existing > 0) {
    console.log('[Seeder] Audit rules already exist, skipping...');
    return;
  }

  await bulkCreateInBatches(AuditRule, [
    {
      id: 'rule000000000000000000000000000001',
      name: '大额交易审核',
      code: 'AUDIT_BIG_AMOUNT',
      biz_type: 'transaction',
      rule_type: 1,
      min_amount: 100000,
      max_amount: 1000000,
      audit_level: 1,
      auditor_ids: '',
      description: '10万-100万交易一级审核',
      sort: 1,
      status: 1
    },
    {
      id: 'rule000000000000000000000000000002',
      name: '特大额交易审核',
      code: 'AUDIT_HUGE_AMOUNT',
      biz_type: 'transaction',
      rule_type: 1,
      min_amount: 1000000,
      max_amount: 0,
      audit_level: 2,
      auditor_ids: '',
      description: '100万以上交易二级审核',
      sort: 2,
      status: 1
    },
    {
      id: 'rule000000000000000000000000000003',
      name: '理财交易审核',
      code: 'AUDIT_FINANCIAL',
      biz_type: 'transaction',
      rule_type: 1,
      min_amount: 50000,
      max_amount: 0,
      audit_level: 1,
      auditor_ids: '',
      description: '5万以上理财交易审核',
      sort: 3,
      status: 1
    }
  ] as any);

  console.log('[Seeder] Audit rules seeded successfully.');
}

export async function runAllSeeders(): Promise<void> {
  console.log('========================================');
  console.log('[Seeder] Starting database seeding...');
  console.log('========================================');

  try {
    await syncDatabase(true);

    await seedOrganizations();
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedUsers();
    await seedUserRoles();
    await seedAuditRules();

    console.log('========================================');
    console.log('[Seeder] All seeders completed successfully!');
    console.log('[Seeder] Default accounts:');
    console.log('  - admin / 123456 (超级管理员)');
    console.log('  - manager / 123456 (机构管理员)');
    console.log('  - operator / 123456 (业务操作员)');
    console.log('  - auditor / 123456 (审核员)');
    console.log('========================================');

    await sequelize.close();
  } catch (error) {
    console.error('[Seeder] Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllSeeders();
}