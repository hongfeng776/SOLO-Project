import { Organization, Role, Permission, User, UserRole, RolePermission, AuditRule, Product, Customer, ViolationRecord, Transaction, Account, AccountOpening, CorporateAccountOpening, OpeningReviewLog, StatusChangeLog, LoanApprovalFlow, LoanApprovalLog } from '../../models';
import { hashPasswordSync } from '../../utils/password';
import { sequelize, syncDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

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

    { id: 'perm049', parent_id: 'perm023', name: '个人开户', code: 'business:opening', type: 2, path: 'opening', component: 'business/opening/index', icon: 'CreditCard', sort: 4, visible: 1, status: 1, perms: '' },
    { id: 'perm050', parent_id: 'perm049', name: '开户查询', code: 'business:opening:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:opening:query' },
    { id: 'perm051', parent_id: 'perm049', name: '开户创建', code: 'business:opening:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'business:opening:create' },
    { id: 'perm052', parent_id: 'perm049', name: '开户修改', code: 'business:opening:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'business:opening:update' },
    { id: 'perm053', parent_id: 'perm049', name: '开户审核', code: 'business:opening:review', type: 3, sort: 4, visible: 1, status: 1, perms: 'business:opening:review' },
    { id: 'perm054', parent_id: 'perm049', name: '开户执行', code: 'business:opening:open', type: 3, sort: 5, visible: 1, status: 1, perms: 'business:opening:open' },

    { id: 'perm055', parent_id: 'perm023', name: '批量开户预审', code: 'business:opening:batch', type: 2, path: 'opening/batch', component: 'business/opening/batch', icon: 'Files', sort: 5, visible: 1, status: 1, perms: '' },
    { id: 'perm056', parent_id: 'perm023', name: '开户溯源查询', code: 'business:opening:trace', type: 2, path: 'opening/trace', component: 'business/opening/trace', icon: 'Search', sort: 6, visible: 1, status: 1, perms: '' },

    { id: 'perm057', parent_id: 'perm023', name: '账户管理', code: 'business:account', type: 2, path: 'account', component: 'business/account/index', icon: 'Wallet', sort: 7, visible: 1, status: 1, perms: '' },
    { id: 'perm058', parent_id: 'perm057', name: '账户查询', code: 'business:account:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:account:query' },
    { id: 'perm059', parent_id: 'perm057', name: '账户更新', code: 'business:account:update', type: 3, sort: 2, visible: 1, status: 1, perms: 'business:account:update' },

    { id: 'perm060', parent_id: 'perm023', name: '对公开户申请', code: 'business:corporate', type: 2, path: 'corporate/index', component: 'business/corporate/index', icon: 'OfficeBuilding', sort: 8, visible: 1, status: 1, perms: '' },
    { id: 'perm061', parent_id: 'perm060', name: '对公查询', code: 'business:corporate:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:corporate:query' },
    { id: 'perm062', parent_id: 'perm060', name: '对公创建', code: 'business:corporate:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'business:corporate:create' },
    { id: 'perm063', parent_id: 'perm060', name: '对公修改', code: 'business:corporate:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'business:corporate:update' },
    { id: 'perm064', parent_id: 'perm060', name: '对公审核', code: 'business:corporate:review', type: 3, sort: 4, visible: 1, status: 1, perms: 'business:corporate:review' },
    { id: 'perm065', parent_id: 'perm060', name: '对公开户', code: 'business:corporate:open', type: 3, sort: 5, visible: 1, status: 1, perms: 'business:corporate:open' },
    { id: 'perm066', parent_id: 'perm023', name: '对公批量材料', code: 'business:corporate:batch', type: 2, path: 'corporate/batch', component: 'business/corporate/batch', icon: 'Folder', sort: 9, visible: 1, status: 1, perms: '' },
    { id: 'perm067', parent_id: 'perm023', name: '企业开户溯源', code: 'business:corporate:trace', type: 2, path: 'corporate/trace', component: 'business/corporate/trace', icon: 'Connection', sort: 10, visible: 1, status: 1, perms: '' },
    { id: 'perm068', parent_id: 'perm023', name: '开户审核查询', code: 'opening:review:query', type: 3, sort: 11, visible: 1, status: 1, perms: 'opening:review:query' },
    { id: 'perm069', parent_id: 'perm023', name: '开户审核提交', code: 'opening:review:submit', type: 3, sort: 12, visible: 1, status: 1, perms: 'opening:review:submit' },
    { id: 'perm070', parent_id: 'perm023', name: '开户批量审核', code: 'opening:review:batch', type: 3, sort: 13, visible: 1, status: 1, perms: 'opening:review:batch' },
    { id: 'perm071', parent_id: 'perm023', name: '初审权限', code: 'opening:review:first', type: 3, sort: 14, visible: 1, status: 1, perms: 'opening:review:first' },
    { id: 'perm072', parent_id: 'perm023', name: '复审权限', code: 'opening:review:second', type: 3, sort: 15, visible: 1, status: 1, perms: 'opening:review:second' },
    { id: 'perm073', parent_id: 'perm023', name: '终审权限', code: 'opening:review:final', type: 3, sort: 16, visible: 1, status: 1, perms: 'opening:review:final' },
    { id: 'perm074', parent_id: 'perm023', name: '审核取消', code: 'opening:review:cancel', type: 3, sort: 17, visible: 1, status: 1, perms: 'opening:review:cancel' },
    { id: 'perm075', parent_id: 'perm023', name: '审核溯源', code: 'opening:review:trace', type: 3, sort: 18, visible: 1, status: 1, perms: 'opening:review:trace' },

    { id: 'perm076', parent_id: 'perm023', name: '状态流转管控', code: 'status:flow', type: 2, path: 'status-flow', component: 'business/status-flow/index', icon: 'Switch', sort: 19, visible: 1, status: 1, perms: '' },
    { id: 'perm077', parent_id: 'perm076', name: '状态流转查询', code: 'status:flow:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'status:flow:query' },
    { id: 'perm078', parent_id: 'perm076', name: '状态流转操作', code: 'status:flow:operate', type: 3, sort: 2, visible: 1, status: 1, perms: 'status:flow:operate' },
    { id: 'perm079', parent_id: 'perm076', name: '批量状态操作', code: 'status:flow:batch', type: 3, sort: 3, visible: 1, status: 1, perms: 'status:flow:batch' },
    { id: 'perm080', parent_id: 'perm076', name: '状态流转溯源', code: 'status:flow:trace', type: 3, sort: 4, visible: 1, status: 1, perms: 'status:flow:trace' },

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
    { id: 'perm048', parent_id: 'perm045', name: '日志删除', code: 'log:operation:delete', type: 3, sort: 3, visible: 1, status: 1, perms: 'log:operation:delete' },

    // ========== 存款业务权限 ==========
    { id: 'perm049', parent_id: null, name: '存款业务', code: 'business:deposit', type: 1, path: '/deposit', component: 'Layout', icon: 'Money', sort: 5, visible: 1, status: 1 },
    { id: 'perm050', parent_id: 'perm049', name: '存款办理', code: 'business:deposit:handle', type: 2, path: 'handle', component: 'deposit/index', icon: 'Wallet', sort: 1, visible: 1, status: 1, perms: '' },
    { id: 'perm051', parent_id: 'perm050', name: '存款查询', code: 'business:deposit:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:deposit:query' },
    { id: 'perm052', parent_id: 'perm050', name: '存款办理', code: 'business:deposit:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'business:deposit:create' },
    { id: 'perm053', parent_id: 'perm050', name: '存款更新', code: 'business:deposit:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'business:deposit:update' },
    { id: 'perm054', parent_id: 'perm050', name: '存款入账', code: 'business:deposit:confirm', type: 3, sort: 4, visible: 1, status: 1, perms: 'business:deposit:confirm' },
    { id: 'perm055', parent_id: 'perm049', name: '批量存款', code: 'business:deposit:batch', type: 2, path: 'batch', component: 'deposit/batch', icon: 'Files', sort: 2, visible: 1, status: 1, perms: '' },
    { id: 'perm056', parent_id: 'perm055', name: '批量录入', code: 'business:deposit:batch', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:deposit:batch' },
    { id: 'perm057', parent_id: 'perm055', name: '批量审核', code: 'business:deposit:review', type: 3, sort: 2, visible: 1, status: 1, perms: 'business:deposit:review' },
    { id: 'perm058', parent_id: 'perm049', name: '存款溯源', code: 'business:deposit:trace', type: 2, path: 'trace', component: 'deposit/trace', icon: 'Search', sort: 3, visible: 1, status: 1, perms: '' },
    { id: 'perm059', parent_id: 'perm058', name: '溯源查询', code: 'business:deposit:trace', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:deposit:trace' },

    // ========== 贷款业务权限 ==========
    { id: 'perm060', parent_id: null, name: '贷款业务', code: 'business:loan', type: 1, path: '/loan', component: 'Layout', icon: 'CreditCard', sort: 6, visible: 1, status: 1 },
    { id: 'perm061', parent_id: 'perm060', name: '贷款申请', code: 'business:loan:apply', type: 2, path: 'apply', component: 'loan/index', icon: 'EditPen', sort: 1, visible: 1, status: 1, perms: '' },
    { id: 'perm062', parent_id: 'perm061', name: '贷款查询', code: 'business:loan:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:loan:query' },
    { id: 'perm063', parent_id: 'perm061', name: '贷款申请', code: 'business:loan:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'business:loan:create' },
    { id: 'perm064', parent_id: 'perm061', name: '贷款更新', code: 'business:loan:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'business:loan:update' },
    { id: 'perm065', parent_id: 'perm061', name: '贷款预审', code: 'business:loan:preapprove', type: 3, sort: 4, visible: 1, status: 1, perms: 'business:loan:preapprove' },
    { id: 'perm066', parent_id: 'perm061', name: '贷款终审', code: 'business:loan:finalapprove', type: 3, sort: 5, visible: 1, status: 1, perms: 'business:loan:finalapprove' },
    { id: 'perm067', parent_id: 'perm060', name: '批量贷款', code: 'business:loan:batch', type: 2, path: 'batch', component: 'loan/batch', icon: 'Files', sort: 2, visible: 1, status: 1, perms: '' },
    { id: 'perm068', parent_id: 'perm067', name: '批量录入', code: 'business:loan:batch', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:loan:batch' },
    { id: 'perm069', parent_id: 'perm067', name: '批量复核', code: 'business:loan:review', type: 3, sort: 2, visible: 1, status: 1, perms: 'business:loan:review' },
    { id: 'perm070', parent_id: 'perm060', name: '贷款溯源', code: 'business:loan:trace', type: 2, path: 'trace', component: 'loan/trace', icon: 'Search', sort: 3, visible: 1, status: 1, perms: '' },
    { id: 'perm071', parent_id: 'perm070', name: '溯源查询', code: 'business:loan:trace', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:loan:trace' },

    // ========== 贷款审批权限 ==========
    { id: 'perm072', parent_id: 'perm060', name: '贷款审批', code: 'loan:approval', type: 2, path: 'approval', component: 'loan-approval/index', icon: 'Stamp', sort: 4, visible: 1, status: 1, perms: '' },
    { id: 'perm073', parent_id: 'perm072', name: '审批查询', code: 'loan:approval:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'loan:approval:query' },
    { id: 'perm074', parent_id: 'perm072', name: '审批前置校验', code: 'loan:approval:precheck', type: 3, sort: 2, visible: 1, status: 1, perms: 'loan:approval:precheck' },
    { id: 'perm075', parent_id: 'perm072', name: '提交审批', code: 'loan:approval:submit', type: 3, sort: 3, visible: 1, status: 1, perms: 'loan:approval:submit' },
    { id: 'perm076', parent_id: 'perm072', name: '一级审批', code: 'loan:approval:level1', type: 3, sort: 4, visible: 1, status: 1, perms: 'loan:approval:level1' },
    { id: 'perm077', parent_id: 'perm072', name: '二级审批', code: 'loan:approval:level2', type: 3, sort: 5, visible: 1, status: 1, perms: 'loan:approval:level2' },
    { id: 'perm078', parent_id: 'perm072', name: '三级审批', code: 'loan:approval:level3', type: 3, sort: 6, visible: 1, status: 1, perms: 'loan:approval:level3' },
    { id: 'perm079', parent_id: 'perm072', name: '四级审批', code: 'loan:approval:level4', type: 3, sort: 7, visible: 1, status: 1, perms: 'loan:approval:level4' },
    { id: 'perm080', parent_id: 'perm072', name: '五级审批', code: 'loan:approval:level5', type: 3, sort: 8, visible: 1, status: 1, perms: 'loan:approval:level5' },
    { id: 'perm081', parent_id: 'perm072', name: '生成合同', code: 'loan:approval:contract', type: 3, sort: 9, visible: 1, status: 1, perms: 'loan:approval:contract' },
    { id: 'perm082', parent_id: 'perm060', name: '批量审批', code: 'loan:approval:batch', type: 2, path: 'approval/batch', component: 'loan-approval/batch', icon: 'Files', sort: 5, visible: 1, status: 1, perms: '' },
    { id: 'perm083', parent_id: 'perm082', name: '批量审批操作', code: 'loan:approval:batch', type: 3, sort: 1, visible: 1, status: 1, perms: 'loan:approval:batch' },
    { id: 'perm084', parent_id: 'perm060', name: '审批溯源', code: 'loan:approval:trace', type: 2, path: 'approval/trace', component: 'loan-approval/trace', icon: 'Search', sort: 6, visible: 1, status: 1, perms: '' },
    { id: 'perm085', parent_id: 'perm084', name: '审批溯源查询', code: 'loan:approval:trace', type: 3, sort: 1, visible: 1, status: 1, perms: 'loan:approval:trace' },
    { id: 'perm086', parent_id: 'perm060', name: '贷后还款', code: 'loan:repayment', type: 2, path: 'repayment/index', component: 'loan-repayment/index', icon: 'Wallet', sort: 7, visible: 1, status: 1, perms: '' },
    { id: 'perm087', parent_id: 'perm086', name: '还款查询', code: 'loan:repayment:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'loan:repayment:query' },
    { id: 'perm088', parent_id: 'perm086', name: '还款前置校验', code: 'loan:repayment:precheck', type: 3, sort: 2, visible: 1, status: 1, perms: 'loan:repayment:precheck' },
    { id: 'perm089', parent_id: 'perm086', name: '提交还款', code: 'loan:repayment:submit', type: 3, sort: 3, visible: 1, status: 1, perms: 'loan:repayment:submit' },
    { id: 'perm090', parent_id: 'perm086', name: '代扣管理', code: 'loan:repayment:withhold', type: 3, sort: 4, visible: 1, status: 1, perms: 'loan:repayment:withhold' },
    { id: 'perm091', parent_id: 'perm086', name: '还款管理', code: 'loan:repayment:manage', type: 3, sort: 5, visible: 1, status: 1, perms: 'loan:repayment:manage' },
    { id: 'perm092', parent_id: 'perm060', name: '批量代扣', code: 'loan:repayment:batch', type: 2, path: 'repayment/batch', component: 'loan-repayment/batch', icon: 'Files', sort: 8, visible: 1, status: 1, perms: '' },
    { id: 'perm093', parent_id: 'perm092', name: '批量代扣操作', code: 'loan:repayment:batch', type: 3, sort: 1, visible: 1, status: 1, perms: 'loan:repayment:batch' },
    { id: 'perm094', parent_id: 'perm060', name: '还款溯源', code: 'loan:repayment:trace', type: 2, path: 'repayment/trace', component: 'loan-repayment/trace', icon: 'Search', sort: 9, visible: 1, status: 1, perms: '' },
    { id: 'perm095', parent_id: 'perm094', name: '还款溯源查询', code: 'loan:repayment:trace', type: 3, sort: 1, visible: 1, status: 1, perms: 'loan:repayment:trace' },

    // ========== 支付结算管理权限 ==========
    { id: 'perm100', parent_id: 'perm023', name: '转账结算', code: 'business:settlement', type: 2, path: 'settlement/index', component: 'business/settlement/index', icon: 'Money', sort: 20, visible: 1, status: 1, perms: '' },
    { id: 'perm101', parent_id: 'perm100', name: '结算查询', code: 'business:settlement:query', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:settlement:query' },
    { id: 'perm102', parent_id: 'perm100', name: '转账创建', code: 'business:settlement:create', type: 3, sort: 2, visible: 1, status: 1, perms: 'business:settlement:create' },
    { id: 'perm103', parent_id: 'perm100', name: '转账更新', code: 'business:settlement:update', type: 3, sort: 3, visible: 1, status: 1, perms: 'business:settlement:update' },
    { id: 'perm104', parent_id: 'perm100', name: '转账复核', code: 'business:settlement:review', type: 3, sort: 4, visible: 1, status: 1, perms: 'business:settlement:review' },
    { id: 'perm105', parent_id: 'perm023', name: '批量转账', code: 'business:settlement:batch', type: 2, path: 'settlement/batch', component: 'business/settlement/batch', icon: 'Files', sort: 21, visible: 1, status: 1, perms: '' },
    { id: 'perm106', parent_id: 'perm105', name: '批量操作', code: 'business:settlement:batch', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:settlement:batch' },
    { id: 'perm107', parent_id: 'perm023', name: '结算溯源', code: 'business:settlement:trace', type: 2, path: 'settlement/trace', component: 'business/settlement/trace', icon: 'Search', sort: 22, visible: 1, status: 1, perms: '' },
    { id: 'perm108', parent_id: 'perm107', name: '溯源查询', code: 'business:settlement:trace', type: 3, sort: 1, visible: 1, status: 1, perms: 'business:settlement:trace' }
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
      'business:opening:query', 'business:opening:create', 'business:opening:update', 'business:opening:open',
      'business:corporate:query', 'business:corporate:create', 'business:corporate:update', 'business:corporate:open',
      'business:account:query', 'business:account:update',
      'audit:record:query', 'audit:record:submit', 'audit:record:cancel',
      'log:operation:query',
      'opening:review:query', 'opening:review:submit', 'opening:review:batch',
      'opening:review:first', 'opening:review:second', 'opening:review:cancel', 'opening:review:trace',
      'status:flow:query', 'status:flow:operate', 'status:flow:batch', 'status:flow:trace',
      'business:deposit:query', 'business:deposit:create', 'business:deposit:update', 'business:deposit:confirm',
      'business:deposit:batch', 'business:deposit:review', 'business:deposit:trace',
      'business:loan:query', 'business:loan:create', 'business:loan:update',
      'business:loan:preapprove', 'business:loan:finalapprove',
      'business:loan:batch', 'business:loan:review', 'business:loan:trace',
      'loan:approval:query', 'loan:approval:precheck', 'loan:approval:submit',
      'loan:approval:level1', 'loan:approval:level2', 'loan:approval:level3',
      'loan:approval:batch', 'loan:approval:contract', 'loan:approval:trace',
      'loan:repayment:query', 'loan:repayment:precheck', 'loan:repayment:submit',
      'loan:repayment:withhold', 'loan:repayment:manage',
      'loan:repayment:batch', 'loan:repayment:trace',
      'business:settlement:query', 'business:settlement:create', 'business:settlement:update', 'business:settlement:review',
      'business:settlement:batch', 'business:settlement:trace'
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
      'business:opening:query', 'business:opening:create', 'business:opening:update',
      'business:corporate:query', 'business:corporate:create', 'business:corporate:update',
      'business:account:query',
      'audit:record:query', 'audit:record:submit', 'audit:record:cancel',
      'log:operation:query',
      'opening:review:query', 'opening:review:submit', 'opening:review:first',
      'status:flow:query', 'status:flow:operate',
      'business:deposit:query', 'business:deposit:create', 'business:deposit:update',
      'business:deposit:batch',
      'business:loan:query', 'business:loan:create', 'business:loan:update',
      'business:loan:batch',
      'loan:approval:query', 'loan:approval:precheck', 'loan:approval:submit',
      'loan:approval:level1',
      'loan:repayment:query', 'loan:repayment:precheck', 'loan:repayment:submit',
      'loan:repayment:withhold',
      'business:settlement:query', 'business:settlement:create', 'business:settlement:update',
      'business:settlement:batch'
    ];
    const perms = allPermissions.filter(p => operatorCodes.includes(p.code) || (p.type !== 3 && (p.code === 'business' || p.code === 'audit' || p.code === 'log' || p.code === 'business:transaction' || p.code === 'business:opening' || p.code === 'business:corporate' || p.code === 'business:account' || p.code === 'audit:record' || p.code === 'audit:pending' || p.code === 'log:operation' || p.code === 'business:deposit' || p.code === 'business:deposit:handle' || p.code === 'business:deposit:batch' || p.code === 'business:deposit:trace' || p.code === 'business:loan' || p.code === 'business:loan:apply' || p.code === 'business:loan:batch' || p.code === 'business:loan:trace' || p.code === 'loan:approval' || p.code === 'loan:approval:apply' || p.code === 'loan:approval:batch' || p.code === 'loan:approval:trace' || p.code === 'loan:repayment' || p.code === 'loan:repayment:batch' || p.code === 'loan:repayment:trace' || p.code === 'business:settlement' || p.code === 'business:settlement:batch' || p.code === 'business:settlement:trace')));
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
      'business:opening:query',
      'business:corporate:query',
      'business:account:query',
      'audit:record:query', 'audit:record:audit',
      'log:operation:query',
      'opening:review:query', 'opening:review:trace',
      'status:flow:query', 'status:flow:trace',
      'business:deposit:query', 'business:deposit:trace',
      'business:loan:query', 'business:loan:trace',
      'loan:approval:query', 'loan:approval:level4', 'loan:approval:trace',
      'loan:repayment:query', 'loan:repayment:trace',
      'business:settlement:query', 'business:settlement:review', 'business:settlement:trace'
    ];
    const perms = allPermissions.filter(p => auditorCodes.includes(p.code) || (p.type !== 3 && (p.code === 'business' || p.code === 'audit' || p.code === 'log' || p.code === 'business:transaction' || p.code === 'business:opening' || p.code === 'business:corporate' || p.code === 'business:account' || p.code === 'audit:record' || p.code === 'audit:pending' || p.code === 'log:operation' || p.code === 'business:deposit' || p.code === 'business:deposit:handle' || p.code === 'business:deposit:trace' || p.code === 'business:loan' || p.code === 'business:loan:apply' || p.code === 'business:loan:trace' || p.code === 'loan:approval' || p.code === 'loan:approval:apply' || p.code === 'loan:approval:trace' || p.code === 'loan:repayment' || p.code === 'loan:repayment:trace' || p.code === 'business:settlement' || p.code === 'business:settlement:batch' || p.code === 'business:settlement:trace')));
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

export async function seedProducts(): Promise<void> {
  console.log('[Seeder] Seeding products...');

  const existing = await Product.count();
  if (existing > 0) {
    console.log('[Seeder] Products already exist, skipping...');
    return;
  }

  await bulkCreateInBatches(Product, [
    {
      id: 'prod000000000000000000000000000001',
      name: '活期存款账户',
      code: 'DEMAND_DEPOSIT',
      category: '存款',
      type: 'retail',
      description: '个人活期存款产品',
      risk_level: 1,
      min_amount: 0,
      max_amount: 5000000,
      interest_rate: 0.3,
      term_days: 0,
      sort: 1,
      status: 1,
      deposit_type: 1
    },
    {
      id: 'prod000000000000000000000000000002',
      name: '一年定期存款',
      code: 'TIME_DEPOSIT_1Y',
      category: '存款',
      type: 'retail',
      description: '一年期定期存款',
      risk_level: 1,
      min_amount: 50,
      max_amount: 5000000,
      interest_rate: 1.65,
      term_days: 365,
      sort: 2,
      status: 1,
      deposit_type: 1
    },
    {
      id: 'prod000000000000000000000000000003',
      name: '稳健型理财',
      code: 'FIN_WEALTH_STABLE',
      category: '理财',
      type: 'retail',
      description: '稳健型理财产品，中低风险',
      risk_level: 2,
      min_amount: 10000,
      max_amount: 0,
      interest_rate: 3.85,
      term_days: 180,
      sort: 3,
      status: 1
    },
    {
      id: 'prod000000000000000000000000000004',
      name: '个人经营性贷款',
      code: 'LOAN_PERSONAL_BIZ',
      category: '贷款',
      type: 'retail',
      description: '个人经营性贷款产品',
      risk_level: 4,
      min_amount: 100000,
      max_amount: 5000000,
      interest_rate: 4.85,
      term_days: 1095,
      sort: 4,
      status: 1
    },
    {
      id: 'prod000000000000000000000000000005',
      name: '对公活期存款',
      code: 'CORP_DEMAND_DEPOSIT',
      category: '存款',
      type: 'corporate',
      description: '对公活期存款产品',
      risk_level: 1,
      min_amount: 0,
      max_amount: 0,
      interest_rate: 0.25,
      term_days: 0,
      sort: 5,
      status: 1
    },
    {
      id: 'prod000000000000000000000000000006',
      name: '大额存单一年期',
      code: 'LARGE_CD_1Y',
      category: '存款',
      type: 'retail',
      description: '大额存单产品，一年期，利率上浮',
      risk_level: 1,
      min_amount: 200000,
      max_amount: 10000000,
      interest_rate: 2.1,
      term_days: 365,
      sort: 6,
      status: 1,
      deposit_type: 2
    },
    {
      id: 'prod000000000000000000000000000007',
      name: '大额存单三年期',
      code: 'LARGE_CD_3Y',
      category: '存款',
      type: 'retail',
      description: '大额存单产品，三年期，利率上浮',
      risk_level: 1,
      min_amount: 200000,
      max_amount: 10000000,
      interest_rate: 2.65,
      term_days: 1095,
      sort: 7,
      status: 1,
      deposit_type: 2
    },
    {
      id: 'prod000000000000000000000000000008',
      name: '智能存款灵活宝',
      code: 'SMART_DEPOSIT_FLEX',
      category: '存款',
      type: 'retail',
      description: '智能存款产品，按存期阶梯计息',
      risk_level: 1,
      min_amount: 1000,
      max_amount: 500000,
      interest_rate: 1.2,
      term_days: 0,
      sort: 8,
      status: 1,
      deposit_type: 3
    },
    {
      id: 'prod000000000000000000000000000009',
      name: '三个月定期存款',
      code: 'TIME_DEPOSIT_3M',
      category: '存款',
      type: 'retail',
      description: '三个月期定期存款',
      risk_level: 1,
      min_amount: 50,
      max_amount: 5000000,
      interest_rate: 1.1,
      term_days: 90,
      sort: 9,
      status: 1,
      deposit_type: 1
    },
    {
      id: 'prod000000000000000000000000000010',
      name: '六个月定期存款',
      code: 'TIME_DEPOSIT_6M',
      category: '存款',
      type: 'retail',
      description: '六个月期定期存款',
      risk_level: 1,
      min_amount: 50,
      max_amount: 5000000,
      interest_rate: 1.3,
      term_days: 180,
      sort: 10,
      status: 1,
      deposit_type: 1
    },
    {
      id: 'prod000000000000000000000000000011',
      name: '二年定期存款',
      code: 'TIME_DEPOSIT_2Y',
      category: '存款',
      type: 'retail',
      description: '二年期定期存款',
      risk_level: 1,
      min_amount: 50,
      max_amount: 5000000,
      interest_rate: 1.95,
      term_days: 730,
      sort: 11,
      status: 1,
      deposit_type: 1
    },
    {
      id: 'prod000000000000000000000000000012',
      name: '三年定期存款',
      code: 'TIME_DEPOSIT_3Y',
      category: '存款',
      type: 'retail',
      description: '三年期定期存款',
      risk_level: 1,
      min_amount: 50,
      max_amount: 5000000,
      interest_rate: 2.4,
      term_days: 1095,
      sort: 12,
      status: 1,
      deposit_type: 1
    },
    {
      id: 'prod000000000000000000000000000013',
      name: '五年定期存款',
      code: 'TIME_DEPOSIT_5Y',
      category: '存款',
      type: 'retail',
      description: '五年期定期存款',
      risk_level: 1,
      min_amount: 50,
      max_amount: 5000000,
      interest_rate: 2.55,
      term_days: 1825,
      sort: 13,
      status: 1,
      deposit_type: 1
    },
    {
      id: 'prod000000000000000000000000000014',
      name: '大额存单五年期',
      code: 'LARGE_CD_5Y',
      category: '存款',
      type: 'retail',
      description: '大额存单产品，五年期，利率上浮',
      risk_level: 1,
      min_amount: 200000,
      max_amount: 10000000,
      interest_rate: 2.8,
      term_days: 1825,
      sort: 14,
      status: 1,
      deposit_type: 2
    },
    {
      id: 'prod000000000000000000000000000015',
      name: '个人消费贷-灵活用',
      code: 'LOAN_CONSUMPTION_FLEX',
      category: '贷款',
      type: 'retail',
      description: '个人消费贷款，随借随还',
      risk_level: 3,
      min_amount: 10000,
      max_amount: 500000,
      interest_rate: 5.6,
      term_days: 1095,
      sort: 15,
      status: 1,
      loan_type: 1
    },
    {
      id: 'prod000000000000000000000000000016',
      name: '经营贷-助业通',
      code: 'LOAN_BUSINESS_HELP',
      category: '贷款',
      type: 'retail',
      description: '小微企业主经营周转贷款',
      risk_level: 4,
      min_amount: 100000,
      max_amount: 5000000,
      interest_rate: 4.8,
      term_days: 1825,
      sort: 16,
      status: 1,
      loan_type: 2
    },
    {
      id: 'prod000000000000000000000000000017',
      name: '个人住房贷款',
      code: 'LOAN_HOUSE_PERSONAL',
      category: '贷款',
      type: 'retail',
      description: '个人住房按揭贷款',
      risk_level: 2,
      min_amount: 100000,
      max_amount: 10000000,
      interest_rate: 3.45,
      term_days: 10950,
      sort: 17,
      status: 1,
      loan_type: 3
    },
    {
      id: 'prod000000000000000000000000000018',
      name: '个人汽车贷款',
      code: 'LOAN_CAR_PERSONAL',
      category: '贷款',
      type: 'retail',
      description: '个人购车消费贷款',
      risk_level: 3,
      min_amount: 50000,
      max_amount: 2000000,
      interest_rate: 4.5,
      term_days: 1825,
      sort: 18,
      status: 1,
      loan_type: 4
    }
  ] as any);

  console.log('[Seeder] Products seeded successfully.');
}

export async function seedCustomers(): Promise<void> {
  console.log('[Seeder] Seeding customers...');

  const existing = await Customer.count();
  if (existing > 0) {
    console.log('[Seeder] Customers already exist, skipping...');
    return;
  }

  const orgIds = [
    'org0000000000000000000000000000001',
    'org0000000000000000000000000000002',
    'org0000000000000000000000000000003',
    'org0000000000000000000000000000004',
    'org0000000000000000000000000000005'
  ];

  const customers = [
    {
      customer_no: 'CUST202400000001',
      customer_name: '张伟',
      id_card_no: '110101199001011234',
      id_type: 1,
      customer_type: 1,
      customer_level: 1,
      mobile: '13800000001',
      address: '北京市西城区金融街1号',
      risk_level: 0,
      risk_tags: '',
      status: 1,
      org_id: orgIds[2],
      open_date: new Date('2020-03-15')
    },
    {
      customer_no: 'CUST202400000002',
      customer_name: '李娜',
      id_card_no: '310101199205052345',
      id_type: 1,
      customer_type: 1,
      customer_level: 2,
      mobile: '13800000002',
      address: '上海市浦东新区陆家嘴88号',
      risk_level: 1,
      risk_tags: '',
      status: 1,
      org_id: orgIds[3],
      open_date: new Date('2021-06-20')
    },
    {
      customer_no: 'CUST202400000003',
      customer_name: '王强',
      id_card_no: '110108198503033456',
      id_type: 1,
      customer_type: 1,
      customer_level: 3,
      mobile: '13800000003',
      address: '北京市朝阳区建国路88号',
      risk_level: 2,
      risk_tags: '异常金额',
      status: 1,
      org_id: orgIds[4],
      open_date: new Date('2019-11-10')
    },
    {
      customer_no: 'CUST202400000004',
      customer_name: '赵敏',
      id_card_no: '440101198808084567',
      id_type: 1,
      customer_type: 1,
      customer_level: 4,
      mobile: '13800000004',
      address: '广东省深圳市南山区科技园1号',
      risk_level: 3,
      risk_tags: '频繁交易',
      status: 1,
      org_id: orgIds[1],
      open_date: new Date('2018-05-25')
    },
    {
      customer_no: 'CUST202400000005',
      customer_name: '陈建国',
      id_card_no: '110101197007075678',
      id_type: 1,
      customer_type: 1,
      customer_level: 5,
      mobile: '13800000005',
      address: '北京市东城区王府井大街1号',
      risk_level: 4,
      risk_tags: '跨境交易,异常金额',
      status: 1,
      org_id: orgIds[0],
      open_date: new Date('2015-01-08')
    },
    {
      customer_no: 'CUST202400000006',
      customer_name: '北京星辰科技有限公司',
      id_card_no: '91110108MA01ABC123',
      id_type: 4,
      customer_type: 2,
      customer_level: 3,
      mobile: '010-88888888',
      address: '北京市海淀区中关村大街1号',
      risk_level: 1,
      risk_tags: '',
      status: 1,
      org_id: orgIds[2],
      open_date: new Date('2020-09-01')
    },
    {
      customer_no: 'CUST202400000007',
      customer_name: '上海瑞通贸易有限公司',
      id_card_no: '91310115MA1HDEF456',
      id_type: 4,
      customer_type: 2,
      customer_level: 4,
      mobile: '021-66666666',
      address: '上海市浦东新区张江高科技园区',
      risk_level: 2,
      risk_tags: '跨境交易',
      status: 1,
      org_id: orgIds[1],
      open_date: new Date('2019-04-15')
    },
    {
      customer_no: 'CUST202400000008',
      customer_name: '北京华信金融投资集团',
      id_card_no: '91110105MA02GHI789',
      id_type: 4,
      customer_type: 2,
      customer_level: 5,
      mobile: '010-66669999',
      address: '北京市朝阳区国贸中心',
      risk_level: 5,
      risk_tags: '跨境交易,夜间交易,异常金额',
      status: 1,
      org_id: orgIds[0],
      open_date: new Date('2016-12-20')
    },
    {
      customer_no: 'CUST202400000009',
      customer_name: '孙丽华',
      id_card_no: '320102199512126789',
      id_type: 1,
      customer_type: 1,
      customer_level: 2,
      mobile: '13800000006',
      address: '江苏省南京市鼓楼区中山路100号',
      risk_level: 0,
      risk_tags: '',
      status: 1,
      org_id: orgIds[1],
      open_date: new Date('2022-02-28')
    },
    {
      customer_no: 'CUST202400000010',
      customer_name: '上海浦东智能制造有限公司',
      id_card_no: '91310115MA1KJKL012',
      id_type: 4,
      customer_type: 2,
      customer_level: 2,
      mobile: '021-55556666',
      address: '上海市浦东新区川沙经济园区',
      risk_level: 3,
      risk_tags: '频繁交易',
      status: 1,
      org_id: orgIds[3],
      open_date: new Date('2021-08-11')
    }
  ];

  const records = customers.map(c => ({
    id: uuidv4().replace(/-/g, ''),
    ...c
  }));

  await bulkCreateInBatches(Customer, records as any);
  console.log('[Seeder] Customers seeded successfully.');
}

export async function seedViolationRecords(): Promise<void> {
  console.log('[Seeder] Seeding violation records...');

  const existing = await ViolationRecord.count();
  if (existing > 0) {
    console.log('[Seeder] Violation records already exist, skipping...');
    return;
  }

  const customers = await Customer.findAll();
  const customerMap = customers.reduce((acc: Record<string, Customer>, c) => {
    acc[c.customer_no] = c;
    return acc;
  }, {});

  const violationRecords = [
    {
      violation_no: 'VIO202406160001',
      customer_no: 'CUST202400000004',
      customer_id: customerMap['CUST202400000004']?.id,
      biz_type: 'transaction',
      violation_type: 1,
      violation_level: 2,
      description: '交易金额异常，单笔转账50万元超过客户日常交易水平',
      rule_ref: 'RULE_AMOUNT_001',
      status: 0,
      discoverer_id: 'user000000000000000000000000000004',
      discoverer_org_id: 'org0000000000000000000000000000001',
      discover_time: new Date('2024-06-15T09:30:00')
    },
    {
      violation_no: 'VIO202406160002',
      customer_no: 'CUST202400000008',
      customer_id: customerMap['CUST202400000008']?.id,
      biz_type: 'customer',
      violation_type: 5,
      violation_level: 4,
      description: '涉嫌反洗钱可疑交易，短期内多笔跨境大额资金往来',
      rule_ref: 'RULE_AML_005',
      status: 2,
      discoverer_id: 'user000000000000000000000000000004',
      discoverer_org_id: 'org0000000000000000000000000000001',
      handler_id: 'user000000000000000000000000000001',
      discover_time: new Date('2024-06-10T14:20:00'),
      handle_time: new Date('2024-06-12T10:15:00'),
      rectification: '已上报人行反洗钱监测中心，已冻结相关可疑账户，加强后续交易监控',
      remark: '已按反洗钱流程处置完毕'
    },
    {
      violation_no: 'VIO202406160003',
      customer_no: 'CUST202400000003',
      customer_id: customerMap['CUST202400000003']?.id,
      biz_type: 'transaction',
      violation_type: 3,
      violation_level: 1,
      description: '柜员操作违规，未按规定核验客户身份办理大额取款',
      rule_ref: 'RULE_OPR_003',
      status: 3,
      discoverer_id: 'user000000000000000000000000000004',
      discoverer_org_id: 'org0000000000000000000000000000005',
      handler_id: 'user000000000000000000000000000002',
      discover_time: new Date('2024-06-14T16:45:00'),
      handle_time: new Date('2024-06-15T11:00:00'),
      rectification: '',
      remark: '整改措施不符合要求，已驳回重新处理'
    }
  ];

  const records = violationRecords.map(v => ({
    id: uuidv4().replace(/-/g, ''),
    ...v
  }));

  await bulkCreateInBatches(ViolationRecord, records as any);
  console.log('[Seeder] Violation records seeded successfully.');
}

export async function seedTransactions(): Promise<void> {
  console.log('[Seeder] Seeding transactions...');

  const existing = await Transaction.count();
  if (existing > 0) {
    console.log('[Seeder] Transactions already exist, skipping...');
    return;
  }

  const customers = await Customer.findAll();
  const customerMap = customers.reduce((acc: Record<string, Customer>, c) => {
    acc[c.customer_no] = c;
    return acc;
  }, {});

  const products = await Product.findAll();
  const productMap = products.reduce((acc: Record<string, Product>, p) => {
    acc[p.code] = p;
    return acc;
  }, {});

  const orgIds = [
    'org0000000000000000000000000000001',
    'org0000000000000000000000000000002',
    'org0000000000000000000000000000003',
    'org0000000000000000000000000000004',
    'org0000000000000000000000000000005'
  ];

  const channelCodes = ['counter', 'mobile', 'ebank', 'atm', 'smart'];
  const businessLines = ['retail', 'retail', 'retail', 'corporate', 'retail'];
  const operatorIds = [
    'user000000000000000000000000000001',
    'user000000000000000000000000000003',
    'user000000000000000000000000000002',
    null,
    null
  ];

  const transactions = [
    {
      transaction_no: 'TXN2024061600000001',
      channel_code: 'counter',
      channel_terminal: 'CTR001',
      type: 1,
      business_line: 'retail',
      amount: 10000,
      currency: 'CNY',
      customer_no: 'CUST202400000001',
      customer_id: customerMap['CUST202400000001']?.id,
      payer_account: '6222021000000001',
      payer_name: '张伟',
      payee_account: '',
      payee_name: '',
      product_id: productMap['DEMAND_DEPOSIT']?.id,
      org_id: orgIds[2],
      operator_id: 'user000000000000000000000000000003',
      status: 2,
      audit_status: 10,
      risk_level: 0,
      risk_tags: '',
      remark: '',
      transaction_time: new Date('2024-06-16T09:15:00'),
      fee: 0
    },
    {
      transaction_no: 'TXN2024061600000002',
      channel_code: 'mobile',
      channel_terminal: '',
      type: 3,
      business_line: 'retail',
      amount: 50000,
      currency: 'CNY',
      customer_no: 'CUST202400000002',
      customer_id: customerMap['CUST202400000002']?.id,
      payer_account: '6222021000000002',
      payer_name: '李娜',
      payee_account: '6228480000000088',
      payee_name: '刘洋',
      product_id: null,
      org_id: orgIds[3],
      operator_id: null,
      status: 2,
      audit_status: 10,
      risk_level: 1,
      risk_tags: '',
      remark: '',
      transaction_time: new Date('2024-06-16T10:30:00'),
      fee: 2
    },
    {
      transaction_no: 'TXN2024061600000003',
      channel_code: 'ebank',
      channel_terminal: '',
      type: 4,
      business_line: 'retail',
      amount: 200000,
      currency: 'CNY',
      customer_no: 'CUST202400000003',
      customer_id: customerMap['CUST202400000003']?.id,
      payer_account: '6222021000000003',
      payer_name: '王强',
      payee_account: '',
      payee_name: '',
      product_id: productMap['FIN_WEALTH_STABLE']?.id,
      org_id: orgIds[4],
      operator_id: null,
      status: 0,
      audit_status: 0,
      risk_level: 2,
      risk_tags: '异常金额',
      remark: '购买稳健型理财',
      transaction_time: new Date('2024-06-16T11:45:00'),
      fee: 0
    },
    {
      transaction_no: 'TXN2024061600000004',
      channel_code: 'atm',
      channel_terminal: 'ATM005',
      type: 2,
      business_line: 'retail',
      amount: 3000,
      currency: 'CNY',
      customer_no: 'CUST202400000001',
      customer_id: customerMap['CUST202400000001']?.id,
      payer_account: '6222021000000001',
      payer_name: '张伟',
      payee_account: '',
      payee_name: '',
      product_id: productMap['DEMAND_DEPOSIT']?.id,
      org_id: orgIds[2],
      operator_id: null,
      status: 2,
      audit_status: 10,
      risk_level: 0,
      risk_tags: '',
      remark: '',
      transaction_time: new Date('2024-06-16T12:00:00'),
      fee: 0
    },
    {
      transaction_no: 'TXN2024061600000005',
      channel_code: 'smart',
      channel_terminal: 'STM002',
      type: 8,
      business_line: 'retail',
      amount: 15000,
      currency: 'CNY',
      customer_no: 'CUST202400000004',
      customer_id: customerMap['CUST202400000004']?.id,
      payer_account: '6222021000000004',
      payer_name: '赵敏',
      payee_account: '4367480000000099',
      payee_name: '',
      product_id: null,
      org_id: orgIds[1],
      operator_id: null,
      status: 2,
      audit_status: 10,
      risk_level: 1,
      risk_tags: '',
      remark: '信用卡还款',
      transaction_time: new Date('2024-06-16T13:20:00'),
      fee: 0
    },
    {
      transaction_no: 'TXN2024061600000006',
      channel_code: 'counter',
      channel_terminal: 'CTR002',
      type: 5,
      business_line: 'retail',
      amount: 800000,
      currency: 'CNY',
      customer_no: 'CUST202400000005',
      customer_id: customerMap['CUST202400000005']?.id,
      payer_account: '',
      payer_name: '',
      payee_account: '6222021000000005',
      payee_name: '陈建国',
      product_id: productMap['LOAN_PERSONAL_BIZ']?.id,
      org_id: orgIds[0],
      operator_id: 'user000000000000000000000000000001',
      status: 1,
      audit_status: 2,
      risk_level: 4,
      risk_tags: '异常金额',
      remark: '经营性贷款发放',
      transaction_time: new Date('2024-06-16T14:00:00'),
      fee: 0
    },
    {
      transaction_no: 'TXN2024061600000007',
      channel_code: 'ebank',
      channel_terminal: '',
      type: 3,
      business_line: 'corporate',
      amount: 1500000,
      currency: 'CNY',
      customer_no: 'CUST202400000006',
      customer_id: customerMap['CUST202400000006']?.id,
      payer_account: '11001010500052500001',
      payer_name: '北京星辰科技有限公司',
      payee_account: '11001010500052500088',
      payee_name: '上海供应商有限公司',
      product_id: null,
      org_id: orgIds[2],
      operator_id: null,
      status: 0,
      audit_status: 1,
      risk_level: 2,
      risk_tags: '',
      remark: '货款支付',
      transaction_time: new Date('2024-06-16T14:30:00'),
      fee: 15
    },
    {
      transaction_no: 'TXN2024061600000008',
      channel_code: 'counter',
      channel_terminal: 'CTR003',
      type: 1,
      business_line: 'corporate',
      amount: 5000000,
      currency: 'CNY',
      customer_no: 'CUST202400000007',
      customer_id: customerMap['CUST202400000007']?.id,
      payer_account: '',
      payer_name: '',
      payee_account: '31001510500052500002',
      payee_name: '上海瑞通贸易有限公司',
      product_id: productMap['CORP_DEMAND_DEPOSIT']?.id,
      org_id: orgIds[1],
      operator_id: 'user000000000000000000000000000002',
      status: 2,
      audit_status: 10,
      risk_level: 3,
      risk_tags: '异常金额,跨境交易',
      remark: '大额跨境贸易回款',
      transaction_time: new Date('2024-06-16T15:10:00'),
      fee: 100
    },
    {
      transaction_no: 'TXN2024061600000009',
      channel_code: 'mobile',
      channel_terminal: '',
      type: 6,
      business_line: 'retail',
      amount: 200,
      currency: 'CNY',
      customer_no: 'CUST202400000009',
      customer_id: customerMap['CUST202400000009']?.id,
      payer_account: '6222021000000009',
      payer_name: '孙丽华',
      payee_account: '',
      payee_name: '',
      product_id: null,
      org_id: orgIds[1],
      operator_id: null,
      status: 2,
      audit_status: 10,
      risk_level: 0,
      risk_tags: '',
      remark: '水费缴纳',
      transaction_time: new Date('2024-06-16T15:45:00'),
      fee: 0
    },
    {
      transaction_no: 'TXN2024061600000010',
      channel_code: 'smart',
      channel_terminal: 'STM003',
      type: 3,
      business_line: 'retail',
      amount: 8000,
      currency: 'CNY',
      customer_no: 'CUST202400000002',
      customer_id: customerMap['CUST202400000002']?.id,
      payer_account: '6222021000000002',
      payer_name: '李娜',
      payee_account: '6222021000000066',
      payee_name: '王芳',
      product_id: null,
      org_id: orgIds[3],
      operator_id: null,
      status: 3,
      audit_status: 11,
      risk_level: 0,
      risk_tags: '',
      remark: '转账失败：收款账户不存在',
      transaction_time: new Date('2024-06-16T16:00:00'),
      fee: 0
    },
    {
      transaction_no: 'TXN2024061600000011',
      channel_code: 'ebank',
      channel_terminal: '',
      type: 7,
      business_line: 'retail',
      amount: 100000,
      currency: 'USD',
      customer_no: 'CUST202400000008',
      customer_id: customerMap['CUST202400000008']?.id,
      payer_account: '11001010500052500008',
      payer_name: '北京华信金融投资集团',
      payee_account: '',
      payee_name: '',
      product_id: null,
      org_id: orgIds[0],
      operator_id: null,
      status: 0,
      audit_status: 0,
      risk_level: 5,
      risk_tags: '跨境交易,夜间交易,异常金额',
      remark: '美元结汇交易',
      transaction_time: new Date('2024-06-16T23:50:00'),
      fee: 500
    },
    {
      transaction_no: 'TXN2024061600000012',
      channel_code: 'atm',
      channel_terminal: 'ATM008',
      type: 2,
      business_line: 'retail',
      amount: 2000,
      currency: 'CNY',
      customer_no: 'CUST202400000003',
      customer_id: customerMap['CUST202400000003']?.id,
      payer_account: '6222021000000003',
      payer_name: '王强',
      payee_account: '',
      payee_name: '',
      product_id: productMap['DEMAND_DEPOSIT']?.id,
      org_id: orgIds[4],
      operator_id: null,
      status: 2,
      audit_status: 10,
      risk_level: 1,
      risk_tags: '',
      remark: '',
      transaction_time: new Date('2024-06-16T08:20:00'),
      fee: 0
    },
    {
      transaction_no: 'TXN2024061600000013',
      channel_code: 'counter',
      channel_terminal: 'CTR005',
      type: 3,
      business_line: 'corporate',
      amount: 350000,
      currency: 'CNY',
      customer_no: 'CUST202400000010',
      customer_id: customerMap['CUST202400000010']?.id,
      payer_account: '31001510500052500010',
      payer_name: '上海浦东智能制造有限公司',
      payee_account: '31001510500052500099',
      payee_name: '原材料供应商',
      product_id: null,
      org_id: orgIds[3],
      operator_id: 'user000000000000000000000000000003',
      status: 2,
      audit_status: 10,
      risk_level: 3,
      risk_tags: '频繁交易',
      remark: '原材料采购款',
      transaction_time: new Date('2024-06-16T10:00:00'),
      fee: 10.5
    },
    {
      transaction_no: 'TXN2024061600000014',
      channel_code: 'mobile',
      channel_terminal: '',
      type: 4,
      business_line: 'retail',
      amount: 50000,
      currency: 'CNY',
      customer_no: 'CUST202400000009',
      customer_id: customerMap['CUST202400000009']?.id,
      payer_account: '6222021000000009',
      payer_name: '孙丽华',
      payee_account: '',
      payee_name: '',
      product_id: productMap['FIN_WEALTH_STABLE']?.id,
      org_id: orgIds[1],
      operator_id: null,
      status: 2,
      audit_status: 10,
      risk_level: 1,
      risk_tags: '',
      remark: '理财购买',
      transaction_time: new Date('2024-06-16T09:00:00'),
      fee: 0
    },
    {
      transaction_no: 'TXN2024061600000015',
      channel_code: 'counter',
      channel_terminal: 'CTR007',
      type: 1,
      business_line: 'retail',
      amount: 100,
      currency: 'CNY',
      customer_no: 'CUST202400000001',
      customer_id: customerMap['CUST202400000001']?.id,
      payer_account: '',
      payer_name: '',
      payee_account: '6222021000000001',
      payee_name: '张伟',
      product_id: productMap['DEMAND_DEPOSIT']?.id,
      org_id: orgIds[2],
      operator_id: 'user000000000000000000000000000003',
      status: 2,
      audit_status: 10,
      risk_level: 0,
      risk_tags: '',
      remark: '小额现金存入',
      transaction_time: new Date('2024-06-16T16:30:00'),
      fee: 0
    }
  ];

  const records = transactions.map(t => ({
    id: uuidv4().replace(/-/g, ''),
    ...t
  }));

  await bulkCreateInBatches(Transaction, records as any);
  console.log('[Seeder] Transactions seeded successfully.');
}

export async function seedAccountOpenings(): Promise<void> {
  console.log('[Seeder] Seeding account openings...');
  const existing = await AccountOpening.count();
  if (existing > 0) {
    console.log('[Seeder] Account openings already exist, skipping...');
    return;
  }

  const org1 = 'org0000000000000000000000000000002';
  const org2 = 'org0000000000000000000000000000003';
  const adminId = 'user000000000000000000000000000001';
  const operatorId = 'user000000000000000000000000000003';
  const auditorId = 'user000000000000000000000000000004';

  const customers = await Customer.findAll({ limit: 8, order: [['id', 'ASC']], raw: true });
  if (customers.length < 8) {
    console.log('[Seeder] Not enough customers found, skipping account openings...');
    return;
  }

  const openings = [
    { customer_id: customers[0].id, customer_no: customers[0].customer_no, account_type: 1, customer_name: customers[0].customer_name, id_card_no: customers[0].id_card_no, mobile: customers[0].mobile, risk_level: 0, status: 5, channel_code: 'counter', submit_org_id: org1, submitter_id: operatorId, submit_time: new Date('2024-06-01 09:00:00'), is_isolated: 0, account_no: '622220240601000001', account_id: 'acc1' },
    { customer_id: customers[1].id, customer_no: customers[1].customer_no, account_type: 2, customer_name: customers[1].customer_name, id_card_no: customers[1].id_card_no, mobile: customers[1].mobile, risk_level: 1, status: 3, channel_code: 'mobile', submit_org_id: org1, submitter_id: operatorId, submit_time: new Date('2024-06-10 14:20:00'), is_isolated: 0, reviewer_id: auditorId },
    { customer_id: customers[2].id, customer_no: customers[2].customer_no, account_type: 1, customer_name: customers[2].customer_name, id_card_no: customers[2].id_card_no, mobile: customers[2].mobile, risk_level: 5, status: 6, channel_code: 'counter', submit_org_id: org2, submitter_id: adminId, submit_time: new Date('2024-06-12 10:10:00'), is_isolated: 1, isolate_reason: '身份证影像不清晰+信息不一致+跨境高风险客户', reject_reason: '该身份证影像清晰度仅35分，低于60分标准；同时客户姓名与公安部实名系统比对不一致', reviewer_id: auditorId, review_time: new Date('2024-06-12 15:00:00') },
    { customer_id: customers[3].id, customer_no: customers[3].customer_no, account_type: 3, customer_name: customers[3].customer_name, id_card_no: customers[3].id_card_no, mobile: customers[3].mobile, risk_level: 0, status: 2, channel_code: 'ebank', submit_org_id: org1, submitter_id: operatorId, submit_time: new Date('2024-06-13 16:45:00'), is_isolated: 0 },
    { customer_id: customers[4].id, customer_no: customers[4].customer_no, account_type: 2, customer_name: customers[4].customer_name, id_card_no: customers[4].id_card_no, mobile: customers[4].mobile, risk_level: 2, status: 4, channel_code: 'counter', submit_org_id: org2, submitter_id: adminId, submit_time: new Date('2024-06-14 11:00:00'), is_isolated: 0, reviewer_id: auditorId, review_time: new Date('2024-06-14 14:30:00') },
    { customer_id: customers[5].id, customer_no: customers[5].customer_no, account_type: 1, customer_name: customers[5].customer_name, id_card_no: customers[5].id_card_no, mobile: customers[5].mobile, risk_level: 4, status: 3, channel_code: 'atm', submit_org_id: org1, submitter_id: operatorId, submit_time: new Date('2024-06-15 08:30:00'), is_isolated: 0, risk_tags: '近30天重复开户3次,客户风险等级中高风险' },
    { customer_id: customers[6].id, customer_no: customers[6].customer_no, account_type: 3, customer_name: customers[6].customer_name, id_card_no: customers[6].id_card_no, mobile: customers[6].mobile, risk_level: 1, status: 5, channel_code: 'mobile', submit_org_id: org2, submitter_id: adminId, submit_time: new Date('2024-06-15 13:20:00'), is_isolated: 0, account_no: '622220240615000002', account_id: 'acc2' },
    { customer_id: customers[7].id, customer_no: customers[7].customer_no, account_type: 1, customer_name: customers[7].customer_name, id_card_no: customers[7].id_card_no, mobile: customers[7].mobile, risk_level: 3, status: 7, channel_code: 'counter', submit_org_id: org1, submitter_id: operatorId, submit_time: new Date('2024-06-16 09:10:00'), is_isolated: 0 }
  ];

  const records = openings.map((o, i) => ({
    id: `opening${String(i + 1).padStart(5, '0')}`,
    opening_no: `AO202406${String(i + 1).padStart(6, '0')}`,
    ...o
  }));

  await bulkCreateInBatches(AccountOpening, records as any);
  console.log('[Seeder] Account openings seeded successfully.');
}

export async function seedAccounts(): Promise<void> {
  console.log('[Seeder] Seeding accounts...');
  const existing = await Account.count();
  if (existing > 0) {
    console.log('[Seeder] Accounts already exist, skipping...');
    return;
  }

  const org1 = 'org0000000000000000000000000000002';
  const org2 = 'org0000000000000000000000000000003';
  const operatorId = 'user000000000000000000000000000003';
  const adminId = 'user000000000000000000000000000001';

  const customers = await Customer.findAll({ limit: 8, order: [['id', 'ASC']], raw: true });
  if (customers.length < 3) {
    console.log('[Seeder] Not enough customers found, skipping accounts...');
    return;
  }

  const accounts = [
    { id: 'acc1', account_no: '622220240601000001', customer_id: customers[0].id, customer_no: customers[0].customer_no, account_type: 1, alias: '工资主账户', balance: 128600.55, available_balance: 128600.55, frozen_amount: 0, daily_limit: 200000, single_limit: 50000, annual_fee: 10, open_org_id: org1, open_operator_id: operatorId, status: 1, open_date: new Date('2024-06-01 09:30:00') },
    { id: 'acc2', account_no: '622220240615000002', customer_id: customers[6].id, customer_no: customers[6].customer_no, account_type: 3, alias: '三类电子钱包', balance: 580.00, available_balance: 580.00, frozen_amount: 0, daily_limit: 2000, single_limit: 1000, annual_fee: 0, open_org_id: org2, open_operator_id: adminId, status: 1, open_date: new Date('2024-06-15 14:00:00') },
    { id: 'acc3', account_no: '622220240605000003', customer_id: customers[1].id, customer_no: customers[1].customer_no, account_type: 2, alias: '理财账户', balance: 85000.00, available_balance: 80000.00, frozen_amount: 5000.00, daily_limit: 10000, single_limit: 5000, annual_fee: 0, open_org_id: org1, open_operator_id: operatorId, status: 2, open_date: new Date('2024-06-05 10:00:00') }
  ];

  const records = accounts.map(a => ({
    ...a
  }));

  await bulkCreateInBatches(Account, records as any);
  console.log('[Seeder] Accounts seeded successfully.');
}

export async function seedCorporateAccountOpenings(): Promise<void> {
  console.log('[Seeder] Seeding corporate account openings...');
  const existing = await CorporateAccountOpening.count();
  if (existing > 0) {
    console.log('[Seeder] Corporate openings already exist, skipping...');
    return;
  }

  const org1 = 'org0000000000000000000000000000002';
  const org2 = 'org0000000000000000000000000000003';
  const operatorId = 'user000000000000000000000000000003';
  const adminId = 'user000000000000000000000000000001';
  const managerId = 'user000000000000000000000000000002';

  const enterpriseCustomers = await Customer.findAll({
    where: { customer_type: 2 },
    order: [['id', 'ASC']],
    raw: true
  });

  const enterpriseList = [
    { enterprise_name: '上海恒信科技有限公司', credit_code: '91310115MA1K3E2X8Q', legal_representative: '张建国', legal_id_card_no: '310101197008151234', legal_verified: 1, industry_type: '软件和信息技术服务业', registered_capital: 500, business_years: 8, agent_name: '李明', agent_id_card_no: '310101198805055678', agent_mobile: '13900000010', registered_address: '上海市浦东新区张江高科技园区博云路2号', business_address: '上海市浦东新区张江高科技园区博云路2号5楼', license_valid_from: new Date('2016-03-15'), license_valid_to: new Date('2046-03-14'), license_permanent: 0, authorization_complete: 1, customer: enterpriseCustomers[0] || null },
    { enterprise_name: '北京盛达贸易股份有限公司', credit_code: '91110105MA01A2BC3D', legal_representative: '王桂英', legal_id_card_no: '110101196505052234', legal_verified: 1, industry_type: '批发和零售业', registered_capital: 2000, business_years: 15, agent_name: '赵伟', agent_id_card_no: '110101199006064321', agent_mobile: '13900000020', registered_address: '北京市朝阳区建国路93号万达广场', business_address: '北京市朝阳区建国路93号万达广场15层', license_valid_from: new Date('2009-08-20'), license_valid_to: new Date('2039-08-19'), license_permanent: 0, authorization_complete: 1, customer: enterpriseCustomers[1] || null },
    { enterprise_name: '广州华南建筑工程有限公司', credit_code: '91440101MA59K8P74J', legal_representative: '陈建华', legal_id_card_no: '440101197203036677', legal_verified: 1, industry_type: '房屋建筑业', registered_capital: 8000, business_years: 20, agent_name: '周强', agent_id_card_no: '440101199208083344', agent_mobile: '13900000030', registered_address: '广州市天河区珠江新城华夏路16号', business_address: '广州市天河区珠江新城华夏路16号保利国际广场', license_valid_from: new Date('2004-06-10'), license_valid_to: new Date('2034-06-09'), license_permanent: 0, authorization_complete: 1, customer: enterpriseCustomers[2] || null },
    { enterprise_name: '深圳前海金融投资有限公司', credit_code: '91440300MA5EL4KH5W', legal_representative: '林振华', legal_id_card_no: '440301197812128899', legal_verified: 2, industry_type: '资本市场服务', registered_capital: 50000, business_years: 6, agent_name: '吴芳', agent_id_card_no: '440301199401012233', agent_mobile: '13900000040', registered_address: '深圳市前海深港合作区前湾一路1号', business_address: '深圳市福田区益田路5033号平安金融中心', license_valid_from: new Date('2018-05-01'), license_valid_to: new Date('2048-04-30'), license_permanent: 0, authorization_complete: 2, customer: enterpriseCustomers[3] || null },
    { enterprise_name: '成都西部生物医药有限公司', credit_code: '91510100MA61C2XN5Y', legal_representative: '刘婷婷', legal_id_card_no: '510101198210103344', legal_verified: 1, industry_type: '医药制造业', registered_capital: 3000, business_years: 12, agent_name: '孙磊', agent_id_card_no: '510101199302025566', agent_mobile: '13900000050', registered_address: '成都市高新区科园南路88号', business_address: '成都市高新区科园南路88号天府生命科技园', license_valid_from: new Date('2012-11-15'), license_valid_to: new Date('2042-11-14'), license_permanent: 0, authorization_complete: 1, customer: enterpriseCustomers[4] || null },
    { enterprise_name: '杭州东方电子商务有限公司', credit_code: '91330100MA27W29K8L', legal_representative: '何晓峰', legal_id_card_no: '330101198507077788', legal_verified: 1, industry_type: '互联网和相关服务', registered_capital: 1500, business_years: 10, agent_name: '郑敏', agent_id_card_no: '330101199409098899', agent_mobile: '13900000060', registered_address: '杭州市西湖区文三路90号', business_address: '杭州市西湖区文三路90号东部软件园', license_valid_from: new Date('2014-09-20'), license_valid_to: new Date('2034-09-19'), license_permanent: 0, authorization_complete: 1, customer: enterpriseCustomers[5] || null }
  ];

  const openings = [
    { account_type: 1, open_purpose: '日常经营结算', channel_code: 'counter', status: 5, risk_level: 1, submit_org_id: org1, submitter_id: operatorId, reviewer_id: managerId, precheck_result: 1, is_dishonest: 0, is_abnormal: 0, is_paused: 0, is_isolated: 0, idx: 0 },
    { account_type: 2, open_purpose: '流动资金贷款', channel_code: 'counter', status: 3, risk_level: 2, submit_org_id: org2, submitter_id: adminId, reviewer_id: null, precheck_result: 1, is_dishonest: 0, is_abnormal: 0, is_paused: 0, is_isolated: 0, idx: 1 },
    { account_type: 3, open_purpose: '项目建设专用资金', channel_code: 'counter', status: 5, risk_level: 2, submit_org_id: org1, submitter_id: operatorId, reviewer_id: managerId, precheck_result: 1, is_dishonest: 0, is_abnormal: 0, is_paused: 0, is_isolated: 0, idx: 2 },
    { account_type: 1, open_purpose: '募集资金专户', channel_code: 'ebank', status: 6, risk_level: 4, submit_org_id: org2, submitter_id: adminId, reviewer_id: managerId, precheck_result: 1, is_dishonest: 0, is_abnormal: 0, is_paused: 0, is_isolated: 0, reject_reason: '募集资金用途说明不完整，请补充项目可行性报告', idx: 3 },
    { account_type: 4, open_purpose: '异地项目部临时结算', channel_code: 'counter', status: 4, risk_level: 2, submit_org_id: org1, submitter_id: operatorId, reviewer_id: managerId, precheck_result: 1, is_dishonest: 0, is_abnormal: 0, is_paused: 0, is_isolated: 0, idx: 4 },
    { account_type: 1, open_purpose: '经营结算', channel_code: 'counter', status: 2, risk_level: 1, submit_org_id: org2, submitter_id: adminId, reviewer_id: null, precheck_result: 1, is_dishonest: 0, is_abnormal: 0, is_paused: 0, is_isolated: 0, idx: 5 }
  ];

  const records = openings.map((o, i) => {
    const ent = enterpriseList[o.idx];
    return {
      id: `corp${String(i + 1).padStart(5, '0')}`,
      opening_no: `CO202406${String(i + 1).padStart(6, '0')}`,
      customer_id: ent.customer?.id,
      customer_no: ent.customer?.customer_no,
      account_type: o.account_type,
      enterprise_name: ent.enterprise_name,
      credit_code: ent.credit_code,
      license_valid_from: ent.license_valid_from,
      license_valid_to: ent.license_valid_to,
      license_permanent: ent.license_permanent,
      legal_representative: ent.legal_representative,
      legal_id_card_no: ent.legal_id_card_no,
      legal_verified: ent.legal_verified,
      agent_name: ent.agent_name,
      agent_id_card_no: ent.agent_id_card_no,
      agent_mobile: ent.agent_mobile,
      agent_verified: 1,
      registered_address: ent.registered_address,
      business_address: ent.business_address,
      business_status: 1,
      tax_registration_no: ent.credit_code,
      tax_info_consistent: 1,
      industry_type: ent.industry_type,
      registered_capital: ent.registered_capital,
      business_years: ent.business_years,
      authorization_complete: ent.authorization_complete,
      target_org_id: o.submit_org_id,
      open_purpose: o.open_purpose,
      supporting_materials: JSON.stringify(['营业执照.pdf', '法人身份证.pdf', '授权委托书.pdf']),
      approval_level: String([3, 2, 2, 1][o.account_type - 1]),
      risk_level: o.risk_level,
      risk_tags: o.risk_level >= 3 ? '高风险行业,注册资本较大' : '',
      channel_code: o.channel_code,
      status: o.status,
      precheck_result: o.precheck_result,
      precheck_reasons: JSON.stringify([{ name: '营业执照有效期', field: 'license_valid_to', passed: true, score: 25, message: '营业执照有效期正常' }]),
      reject_reason: o.reject_reason || null,
      reviewer_id: o.reviewer_id,
      review_time: o.status >= 4 ? new Date(`2024-06-${10 + i} 10:${30 + i}:00`) : null,
      submit_org_id: o.submit_org_id,
      submitter_id: o.submitter_id,
      submit_time: new Date(`2024-06-${5 + i} 09:${15 + i}:00`),
      account_id: o.status === 5 ? `corpack${String(i + 1).padStart(5, '0')}` : null,
      account_no: o.status === 5 ? `CC${i + 1}202406${String(10 + i).padStart(2, '0')}${String(i + 1).padStart(2, '0')}` : null,
      is_dishonest: o.is_dishonest,
      is_abnormal: o.is_abnormal,
      is_paused: o.is_paused,
      is_isolated: o.is_isolated,
      isolate_reason: null,
      remark: null
    };
  });

  await bulkCreateInBatches(CorporateAccountOpening, records as any);
  console.log('[Seeder] Corporate account openings seeded successfully.');
}

export async function seedOpeningReviewLogs(): Promise<void> {
  console.log('[Seeder] Seeding opening review logs...');
  const existing = await OpeningReviewLog.count();
  if (existing > 0) {
    console.log('[Seeder] Opening review logs already exist, skipping...');
    return;
  }

  const adminId = 'user000000000000000000000000000001';
  const managerId = 'user000000000000000000000000000002';
  const operatorId = 'user000000000000000000000000000003';
  const auditorId = 'user000000000000000000000000000004';

  const reviewLogs = [
    {
      opening_type: 2,
      opening_id: 'corp00001',
      opening_no: 'CO202406000001',
      review_level: 1,
      reviewer_id: auditorId,
      reviewer_name: '审核员',
      review_result: 1,
      review_comment: '资料齐全，信息真实有效，初审通过',
      reject_reason: null,
      reject_details: null,
      supporting_files: JSON.stringify(['初审核对表.pdf', '法人面签照片.jpg']),
      pre_approved_amount: 500,
      risk_level_before: 1,
      risk_level_after: 1,
      consistency_check: 2,
      conflict_flag: 0,
      next_required_level: 2,
      created_at: new Date('2024-06-08 09:30:00')
    },
    {
      opening_type: 2,
      opening_id: 'corp00001',
      opening_no: 'CO202406000001',
      review_level: 2,
      reviewer_id: managerId,
      reviewer_name: '机构管理员',
      review_result: 1,
      review_comment: '符合开户条件，复审通过，建议进入终审',
      reject_reason: null,
      reject_details: null,
      supporting_files: JSON.stringify(['复审意见书.pdf']),
      pre_approved_amount: 500,
      risk_level_before: 1,
      risk_level_after: 1,
      consistency_check: 1,
      conflict_flag: 0,
      next_required_level: 3,
      created_at: new Date('2024-06-08 14:20:00')
    },
    {
      opening_type: 2,
      opening_id: 'corp00002',
      opening_no: 'CO202406000002',
      review_level: 1,
      reviewer_id: operatorId,
      reviewer_name: '业务操作员',
      review_result: 1,
      review_comment: '贷款材料已核实，初审通过',
      reject_reason: null,
      reject_details: null,
      supporting_files: JSON.stringify(['初审核对表.pdf']),
      pre_approved_amount: 2000,
      risk_level_before: 2,
      risk_level_after: 2,
      consistency_check: 2,
      conflict_flag: 0,
      next_required_level: 2,
      created_at: new Date('2024-06-09 10:15:00')
    },
    {
      opening_type: 2,
      opening_id: 'corp00003',
      opening_no: 'CO202406000003',
      review_level: 1,
      reviewer_id: operatorId,
      reviewer_name: '业务操作员',
      review_result: 1,
      review_comment: '项目资金证明材料齐全，初审通过',
      reject_reason: null,
      reject_details: null,
      supporting_files: JSON.stringify(['开户资料核验单.pdf']),
      pre_approved_amount: 8000,
      risk_level_before: 2,
      risk_level_after: 2,
      consistency_check: 2,
      conflict_flag: 0,
      next_required_level: 2,
      created_at: new Date('2024-06-10 09:00:00')
    },
    {
      opening_type: 2,
      opening_id: 'corp00003',
      opening_no: 'CO202406000003',
      review_level: 2,
      reviewer_id: managerId,
      reviewer_name: '机构管理员',
      review_result: 1,
      review_comment: '复核信息一致，复审通过',
      reject_reason: null,
      reject_details: null,
      supporting_files: JSON.stringify(['复审意见.pdf']),
      pre_approved_amount: 8000,
      risk_level_before: 2,
      risk_level_after: 2,
      consistency_check: 1,
      conflict_flag: 0,
      next_required_level: 3,
      created_at: new Date('2024-06-10 15:30:00')
    },
    {
      opening_type: 2,
      opening_id: 'corp00003',
      opening_no: 'CO202406000003',
      review_level: 3,
      reviewer_id: adminId,
      reviewer_name: '系统管理员',
      review_result: 1,
      review_comment: '符合专用账户开户条件，终审通过',
      reject_reason: null,
      reject_details: null,
      supporting_files: JSON.stringify(['终审批准书.pdf']),
      pre_approved_amount: 8000,
      risk_level_before: 2,
      risk_level_after: 2,
      consistency_check: 1,
      conflict_flag: 0,
      next_required_level: 0,
      created_at: new Date('2024-06-11 11:00:00')
    },
    {
      opening_type: 1,
      opening_id: 'opening00001',
      opening_no: 'AO202406000001',
      review_level: 1,
      reviewer_id: auditorId,
      reviewer_name: '审核员',
      review_result: 2,
      review_comment: '身份证影像模糊，且姓名与实名系统比对存在差异，予以驳回',
      reject_reason: 'PHOTO_UNCLEAR',
      reject_details: '身份证影像清晰度评分仅35分，低于60分标准；客户姓名与公安部实名系统比对不一致，请客户重新提交身份材料',
      supporting_files: JSON.stringify(['驳回通知书.pdf']),
      pre_approved_amount: null,
      risk_level_before: 5,
      risk_level_after: 5,
      consistency_check: 2,
      conflict_flag: 0,
      next_required_level: 0,
      created_at: new Date('2024-06-03 16:45:00')
    },
    {
      opening_type: 1,
      opening_id: 'opening00002',
      opening_no: 'AO202406000002',
      review_level: 1,
      reviewer_id: managerId,
      reviewer_name: '机构管理员',
      review_result: 3,
      review_comment: '客户电话申请取消本次二类账户开户，转至柜面办理一类账户',
      reject_reason: null,
      reject_details: null,
      supporting_files: JSON.stringify(['取消申请确认单.pdf']),
      pre_approved_amount: null,
      risk_level_before: 1,
      risk_level_after: 1,
      consistency_check: 2,
      conflict_flag: 0,
      next_required_level: 1,
      created_at: new Date('2024-06-11 10:30:00')
    }
  ];

  const records = reviewLogs.map((log, i) => ({
    id: `orlog${String(i + 1).padStart(5, '0')}`,
    ...log
  }));

  await bulkCreateInBatches(OpeningReviewLog, records as any);
  console.log('[Seeder] Opening review logs seeded successfully.');
}

export async function seedStatusChangeLogs(): Promise<void> {
  console.log('[Seeder] Seeding status change logs...');
  const existing = await StatusChangeLog.count();
  if (existing > 0) {
    console.log('[Seeder] Status change logs already exist, skipping...');
    return;
  }

  const adminId = 'user000000000000000000000000000001';
  const managerId = 'user000000000000000000000000000002';
  const operatorId = 'user000000000000000000000000000003';

  const logs = [
    {
      opening_type: 1,
      opening_id: 'personal00001',
      opening_no: 'OPN20240101001',
      status_before: 0,
      status_before_text: '待预检',
      status_after: 1,
      status_after_text: '预检通过待录入',
      operation_type: 'submit',
      operation_type_text: '提交申请',
      operator_id: operatorId,
      operator_name: '操作员',
      operator_role: 'operator',
      compliance_check: 1,
      operation_node: '资料录入'
    },
    {
      opening_type: 1,
      opening_id: 'personal00001',
      opening_no: 'OPN20240101001',
      status_before: 1,
      status_before_text: '预检通过待录入',
      status_after: 2,
      status_after_text: '录入中',
      operation_type: 'submit',
      operation_type_text: '提交申请',
      operator_id: operatorId,
      operator_name: '操作员',
      operator_role: 'operator',
      compliance_check: 1,
      operation_node: '资料录入'
    },
    {
      opening_type: 1,
      opening_id: 'personal00001',
      opening_no: 'OPN20240101001',
      status_before: 2,
      status_before_text: '录入中',
      status_after: 3,
      status_after_text: '待复核',
      operation_type: 'submit',
      operation_type_text: '提交申请',
      operator_id: operatorId,
      operator_name: '操作员',
      operator_role: 'operator',
      compliance_check: 1,
      operation_node: '提交审核'
    },
    {
      opening_type: 1,
      opening_id: 'personal00001',
      opening_no: 'OPN20240101001',
      status_before: 3,
      status_before_text: '待复核',
      status_after: 4,
      status_after_text: '复核通过待开户',
      operation_type: 'review_approve',
      operation_type_text: '审核通过',
      operator_id: managerId,
      operator_name: '管理员',
      operator_role: 'manager',
      compliance_check: 1,
      sync_result: JSON.stringify({ customerStatusSynced: false, accountStatusSynced: false, riskFilingSynced: true }),
      operation_node: '审核通过'
    },
    {
      opening_type: 1,
      opening_id: 'personal00002',
      opening_no: 'OPN20240101002',
      status_before: 3,
      status_before_text: '待复核',
      status_after: 6,
      status_after_text: '已驳回',
      operation_type: 'review_reject',
      operation_type_text: '审核驳回',
      operator_id: managerId,
      operator_name: '管理员',
      operator_role: 'manager',
      compliance_check: 1,
      remark: '身份证影像不清晰',
      operation_node: '审核驳回'
    },
    {
      opening_type: 2,
      opening_id: 'corporate00001',
      opening_no: 'CORP20240101001',
      status_before: 0,
      status_before_text: '待预检',
      status_after: 1,
      status_after_text: '预检通过待录入',
      operation_type: 'submit',
      operation_type_text: '提交申请',
      operator_id: operatorId,
      operator_name: '操作员',
      operator_role: 'operator',
      compliance_check: 1,
      operation_node: '资料录入'
    },
    {
      opening_type: 2,
      opening_id: 'corporate00001',
      opening_no: 'CORP20240101001',
      status_before: 2,
      status_before_text: '录入中',
      status_after: 7,
      status_after_text: '已取消',
      operation_type: 'cancel',
      operation_type_text: '撤销取消',
      operator_id: managerId,
      operator_name: '管理员',
      operator_role: 'manager',
      compliance_check: 1,
      remark: '客户主动取消',
      operation_node: '撤销/作废'
    },
    {
      opening_type: 1,
      opening_id: 'personal00003',
      opening_no: 'OPN20240101003',
      status_before: 5,
      status_before_text: '已开户',
      status_after: 3,
      status_after_text: '待复核',
      operation_type: 'cancel',
      operation_type_text: '撤销取消',
      operator_id: operatorId,
      operator_name: '操作员',
      operator_role: 'operator',
      compliance_check: 0,
      violation_details: '已完成开户状态禁止撤销修改；操作类型在当前状态下被锁定；状态流转不合规，禁止跳转',
      operation_node: '状态变更'
    },
    {
      opening_type: 2,
      opening_id: 'corporate00002',
      opening_no: 'CORP20240101002',
      status_before: 4,
      status_before_text: '复核通过待开户',
      status_after: 7,
      status_after_text: '已取消',
      operation_type: 'void',
      operation_type_text: '作废',
      operator_id: operatorId,
      operator_name: '操作员',
      operator_role: 'operator',
      compliance_check: 2,
      violation_details: '已通过终审状态禁止作废；仅管理员可执行作废操作',
      operation_node: '撤销/作废'
    }
  ];

  const records = logs.map((log, i) => ({
    id: `scl${String(i + 1).padStart(5, '0')}`,
    ...log
  }));

  await bulkCreateInBatches(StatusChangeLog, records as any);
  console.log('[Seeder] Status change logs seeded successfully.');
}

export async function runAllSeeders(options?: { force?: boolean; closeOnFinish?: boolean }): Promise<void> {
  const force = options?.force ?? false;
  const closeOnFinish = options?.closeOnFinish ?? false;

  console.log('========================================');
  console.log('[Seeder] Starting database seeding...');
  console.log('========================================');

  try {
    if (force) {
      await syncDatabase(true);
    }

    await seedOrganizations();
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedUsers();
    await seedUserRoles();
    await seedAuditRules();
    await seedProducts();
    await seedCustomers();
    await seedAccounts();
    await seedAccountOpenings();
    await seedCorporateAccountOpenings();
    await seedOpeningReviewLogs();
    await seedStatusChangeLogs();
    await seedViolationRecords();
    await seedTransactions();

    console.log('========================================');
    console.log('[Seeder] All seeders completed successfully!');
    console.log('[Seeder] Default accounts:');
    console.log('  - admin / 123456 (超级管理员)');
    console.log('  - manager / 123456 (机构管理员)');
    console.log('  - operator / 123456 (业务操作员)');
    console.log('  - auditor / 123456 (审核员)');
    console.log('========================================');

    if (closeOnFinish) {
      await sequelize.close();
    }
  } catch (error) {
    console.error('[Seeder] Seeding failed:', error);
    if (closeOnFinish) {
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  runAllSeeders({ force: true, closeOnFinish: true });
}