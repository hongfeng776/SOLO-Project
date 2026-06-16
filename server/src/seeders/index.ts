import { sequelize } from '@config/database';
import { db } from '@models/index';
import bcrypt from 'bcryptjs';

const { User, Role, Permission, UserRole, RolePermission, StockQuote, AssetProduct, CustomerAsset, FundFlow, ComplianceAudit } = db;

async function seedPermissions() {
  const modules = [
    { name: '仪表盘', code: 'dashboard', path: '/dashboard', icon: 'DashboardOutlined', sortOrder: 1, children: [
      { name: '仪表盘查看', code: 'dashboard:view', type: 'button', sortOrder: 1 },
    ]},
    { name: '股票行情', code: 'stock', path: '/stocks', icon: 'StockOutlined', sortOrder: 2, children: [
      { name: '股票查看', code: 'stock:view', type: 'button', sortOrder: 1 },
      { name: '股票管理', code: 'stock:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '理财产品', code: 'product', path: '/products', icon: 'FundOutlined', sortOrder: 3, children: [
      { name: '产品查看', code: 'product:view', type: 'button', sortOrder: 1 },
      { name: '产品管理', code: 'product:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '客户资产', code: 'customer', path: '/customers', icon: 'UserOutlined', sortOrder: 4, children: [
      { name: '客户查看', code: 'customer:view', type: 'button', sortOrder: 1 },
      { name: '客户管理', code: 'customer:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '资金流水', code: 'fund-flow', path: '/fund-flows', icon: 'TransactionOutlined', sortOrder: 5, children: [
      { name: '流水查看', code: 'fund-flow:view', type: 'button', sortOrder: 1 },
      { name: '流水管理', code: 'fund-flow:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '合规审计', code: 'compliance', path: '/compliance-audits', icon: 'AuditOutlined', sortOrder: 6, children: [
      { name: '审计查看', code: 'compliance:view', type: 'button', sortOrder: 1 },
      { name: '审计管理', code: 'compliance:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '用户管理', code: 'user', path: '/users', icon: 'TeamOutlined', sortOrder: 7, children: [
      { name: '用户查看', code: 'user:view', type: 'button', sortOrder: 1 },
      { name: '用户管理', code: 'user:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '角色管理', code: 'role', path: '/roles', icon: 'SafetyOutlined', sortOrder: 8, children: [
      { name: '角色查看', code: 'role:view', type: 'button', sortOrder: 1 },
      { name: '角色管理', code: 'role:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '权限管理', code: 'permission', path: '/permissions', icon: 'KeyOutlined', sortOrder: 9, children: [
      { name: '权限查看', code: 'permission:view', type: 'button', sortOrder: 1 },
      { name: '权限管理', code: 'permission:manage', type: 'button', sortOrder: 2 },
    ]},
  ];

  const allPermissions: InstanceType<typeof Permission>[] = [];

  for (const mod of modules) {
    const parent = await Permission.create({
      perm_name: mod.name,
      perm_code: mod.code,
      perm_type: 'menu',
      path: mod.path,
      icon: mod.icon,
      sort_order: mod.sortOrder,
      status: 1,
    } as any);
    allPermissions.push(parent);

    for (const child of mod.children) {
      const perm = await Permission.create({
        perm_name: child.name,
        perm_code: child.code,
        perm_type: child.type,
        parent_id: parent.id,
        sort_order: child.sortOrder,
        status: 1,
      } as any);
      allPermissions.push(perm);
    }
  }

  return allPermissions;
}

async function seedRoles(allPermissions: InstanceType<typeof Permission>[]) {
  const superAdmin = await Role.create({
    role_name: '超级管理员',
    role_code: 'super_admin',
    description: '拥有系统所有权限',
    status: 1,
  } as any);

  const admin = await Role.create({
    role_name: '管理员',
    role_code: 'admin',
    description: '拥有大部分管理权限',
    status: 1,
  } as any);

  const analyst = await Role.create({
    role_name: '分析师',
    role_code: 'analyst',
    description: '仅拥有查看权限',
    status: 1,
  } as any);

  const auditor = await Role.create({
    role_name: '审计员',
    role_code: 'auditor',
    description: '拥有查看和合规审计管理权限',
    status: 1,
  } as any);

  const superAdminPermIds = allPermissions.map((p) => p.id);
  await RolePermission.bulkCreate(superAdminPermIds.map((perm_id) => ({ role_id: superAdmin.id, perm_id } as any)));

  const adminPermCodes = allPermissions
    .filter((p) => !p.perm_code.startsWith('permission:'))
    .map((p) => p.id);
  await RolePermission.bulkCreate(adminPermCodes.map((perm_id) => ({ role_id: admin.id, perm_id } as any)));

  const analystPermCodes = ['dashboard', 'dashboard:view', 'stock', 'stock:view', 'product', 'product:view', 'customer', 'customer:view'];
  const analystPermIds = allPermissions
    .filter((p) => analystPermCodes.includes(p.perm_code))
    .map((p) => p.id);
  await RolePermission.bulkCreate(analystPermIds.map((perm_id) => ({ role_id: analyst.id, perm_id } as any)));

  const auditorPermCodes = ['dashboard', 'dashboard:view', 'stock', 'stock:view', 'product', 'product:view', 'customer', 'customer:view', 'fund-flow', 'fund-flow:view', 'compliance', 'compliance:view', 'compliance:manage'];
  const auditorPermIds = allPermissions
    .filter((p) => auditorPermCodes.includes(p.perm_code))
    .map((p) => p.id);
  await RolePermission.bulkCreate(auditorPermIds.map((perm_id) => ({ role_id: auditor.id, perm_id } as any)));

  return { superAdmin, admin, analyst, auditor };
}

async function seedUsers(roles: { superAdmin: InstanceType<typeof Role>; analyst: InstanceType<typeof Role>; auditor: InstanceType<typeof Role> }) {
  const salt = await bcrypt.genSalt(10);

  const admin = await User.create({
    username: 'admin',
    password: await bcrypt.hash('admin123', salt),
    real_name: '系统管理员',
    phone: '13800000001',
    email: 'admin@zhitou.com',
    status: 1,
  } as any);

  const analystUser = await User.create({
    username: 'analyst',
    password: await bcrypt.hash('analyst123', salt),
    real_name: '张分析师',
    phone: '13800000002',
    email: 'analyst@zhitou.com',
    status: 1,
  } as any);

  const auditorUser = await User.create({
    username: 'auditor',
    password: await bcrypt.hash('auditor123', salt),
    real_name: '李审计员',
    phone: '13800000003',
    email: 'auditor@zhitou.com',
    status: 1,
  } as any);

  await UserRole.bulkCreate([
    { user_id: admin.id, role_id: roles.superAdmin.id } as any,
    { user_id: analystUser.id, role_id: roles.analyst.id } as any,
    { user_id: auditorUser.id, role_id: roles.auditor.id } as any,
  ]);

  return { admin, analystUser, auditorUser };
}

async function seedStockQuotes() {
  const stocks = [
    {
      stock_code: '600519', stock_name: '贵州茅台', market: 'SH',
      current_price: 1689.00, change_amount: 15.50, change_rate: 0.93,
      open_price: 1675.00, close_price: 1673.50, high_price: 1695.00, low_price: 1670.00,
      volume: 32567800, turnover: 5498230000, amplitude: 1.49,
      pe_ratio: 33.56, pb_ratio: 10.28,
      total_market_cap: 2122500000000, circulate_market_cap: 2122500000000,
      trade_date: '2026-06-15',
    },
    {
      stock_code: '000858', stock_name: '五粮液', market: 'SZ',
      current_price: 156.30, change_amount: -2.10, change_rate: -1.32,
      open_price: 158.50, close_price: 158.40, high_price: 159.80, low_price: 155.60,
      volume: 45231000, turnover: 7031560000, amplitude: 2.65,
      pe_ratio: 21.45, pb_ratio: 5.63,
      total_market_cap: 606300000000, circulate_market_cap: 606300000000,
      trade_date: '2026-06-15',
    },
    {
      stock_code: '601318', stock_name: '中国平安', market: 'SH',
      current_price: 48.65, change_amount: 0.35, change_rate: 0.72,
      open_price: 48.20, close_price: 48.30, high_price: 49.10, low_price: 48.00,
      volume: 68945000, turnover: 3342000000, amplitude: 2.28,
      pe_ratio: 9.87, pb_ratio: 1.15,
      total_market_cap: 886000000000, circulate_market_cap: 886000000000,
      trade_date: '2026-06-15',
    },
    {
      stock_code: '300750', stock_name: '宁德时代', market: 'SZ',
      current_price: 218.50, change_amount: 5.80, change_rate: 2.72,
      open_price: 213.00, close_price: 212.70, high_price: 220.00, low_price: 212.00,
      volume: 28765000, turnover: 6234500000, amplitude: 3.76,
      pe_ratio: 25.32, pb_ratio: 6.78,
      total_market_cap: 958000000000, circulate_market_cap: 845000000000,
      trade_date: '2026-06-15',
    },
    {
      stock_code: '002594', stock_name: '比亚迪', market: 'SZ',
      current_price: 286.40, change_amount: -4.60, change_rate: -1.58,
      open_price: 291.00, close_price: 291.00, high_price: 293.50, low_price: 284.80,
      volume: 19876000, turnover: 5678900000, amplitude: 2.99,
      pe_ratio: 28.56, pb_ratio: 5.92,
      total_market_cap: 832000000000, circulate_market_cap: 756000000000,
      trade_date: '2026-06-15',
    },
  ];

  await StockQuote.bulkCreate(stocks as any);
}

async function seedAssetProducts() {
  const products = [
    {
      product_code: 'FUND001', product_name: '稳健增值债券A', product_type: 'bond',
      risk_level: 'R2', nav: 1.0523, acc_nav: 1.2523, daily_yield: 0.0012, annual_yield: 0.0456,
      product_status: 'active', min_amount: 1000, max_amount: 5000000,
      manager: '华夏基金管理有限公司', custodian: '中国工商银行',
      raise_start_date: '2025-01-15', raise_end_date: '2025-03-15', maturity_date: '2028-01-15',
      product_desc: '稳健型债券基金，主要投资于国债、金融债和高等级信用债',
    },
    {
      product_code: 'FUND002', product_name: '科技成长混合C', product_type: 'mixed',
      risk_level: 'R4', nav: 2.3568, acc_nav: 2.8568, daily_yield: 0.0085, annual_yield: 0.1523,
      product_status: 'active', min_amount: 100, max_amount: 1000000,
      manager: '易方达基金管理有限公司', custodian: '中国建设银行',
      raise_start_date: '2025-02-01', raise_end_date: '2025-04-01', maturity_date: '2030-02-01',
      product_desc: '混合型基金，重点配置科技成长类优质上市公司',
    },
    {
      product_code: 'INS001', product_name: '金生康瑞重疾险', product_type: 'insurance',
      risk_level: 'R1', nav: null, acc_nav: null, daily_yield: null, annual_yield: null,
      product_status: 'active', min_amount: 3000, max_amount: 100000,
      manager: '中国人寿保险股份有限公司', custodian: null,
      raise_start_date: '2024-06-01', raise_end_date: '2026-05-31', maturity_date: '2054-06-01',
      product_desc: '重大疾病保险，覆盖120种重疾和50种轻症',
    },
    {
      product_code: 'DEPO001', product_name: '智享定期存款90天', product_type: 'deposit',
      risk_level: 'R1', nav: null, acc_nav: null, daily_yield: null, annual_yield: 0.0285,
      product_status: 'active', min_amount: 50000, max_amount: 3000000,
      manager: null, custodian: null,
      raise_start_date: '2025-01-01', raise_end_date: '2026-12-31', maturity_date: null,
      product_desc: '90天定期存款产品，到期自动赎回',
    },
    {
      product_code: 'FUND003', product_name: '沪深300指数增强A', product_type: 'index',
      risk_level: 'R3', nav: 1.8234, acc_nav: 2.1234, daily_yield: 0.0045, annual_yield: 0.0987,
      product_status: 'active', min_amount: 10, max_amount: 500000,
      manager: '富国基金管理有限公司', custodian: '中国农业银行',
      raise_start_date: '2024-09-01', raise_end_date: '2025-09-01', maturity_date: null,
      product_desc: '指数增强型基金，跟踪沪深300指数并力求超额收益',
    },
  ];

  await AssetProduct.bulkCreate(products as any);
}

async function seedCustomerAssets() {
  const customers = [
    {
      customer_name: '王建国', id_card: '110101198501011234', phone: '13912345678',
      total_asset: 2568000.00, available_amount: 856000.00, frozen_amount: 120000.00,
      total_profit: 168500.50, total_cost: 2399500.00, risk_level: 'R3',
      customer_type: 'individual', status: 'active',
    },
    {
      customer_name: '李明辉', id_card: '310101199203152345', phone: '13823456789',
      total_asset: 5680000.00, available_amount: 2340000.00, frozen_amount: 500000.00,
      total_profit: 580000.00, total_cost: 5100000.00, risk_level: 'R4',
      customer_type: 'individual', status: 'active',
    },
    {
      customer_name: '中科创新科技有限公司', id_card: '91110108MA01ABCDEF', phone: '010-87654321',
      total_asset: 15800000.00, available_amount: 6200000.00, frozen_amount: 1500000.00,
      total_profit: 1800000.00, total_cost: 14000000.00, risk_level: 'R2',
      customer_type: 'corporate', status: 'active',
    },
    {
      customer_name: '陈雅琳', id_card: '440101199508204567', phone: '13734567890',
      total_asset: 389000.00, available_amount: 289000.00, frozen_amount: 0,
      total_profit: 12500.00, total_cost: 376500.00, risk_level: 'R2',
      customer_type: 'individual', status: 'active',
    },
    {
      customer_name: '鼎盛资产管理有限公司', id_card: '91310115MA1HGHIJKL', phone: '021-56781234',
      total_asset: 35600000.00, available_amount: 12800000.00, frozen_amount: 3500000.00,
      total_profit: 4200000.00, total_cost: 31400000.00, risk_level: 'R4',
      customer_type: 'corporate', status: 'active',
    },
  ];

  await CustomerAsset.bulkCreate(customers as any);
}

async function seedFundFlows() {
  const flows = [
    { flow_no: 'FF20260615001', customer_id: 1, asset_id: 1, flow_type: 'purchase', amount: 100000.00, balance_after: 956000.00, flow_status: 'success', channel: 'online', remark: '购买稳健增值债券A' },
    { flow_no: 'FF20260615002', customer_id: 2, asset_id: 2, flow_type: 'purchase', amount: 200000.00, balance_after: 2540000.00, flow_status: 'success', channel: 'online', remark: '购买科技成长混合C' },
    { flow_no: 'FF20260614003', customer_id: 3, asset_id: 4, flow_type: 'redeem', amount: 500000.00, balance_after: 5700000.00, flow_status: 'success', channel: 'counter', remark: '赎回定期存款' },
    { flow_no: 'FF20260614004', customer_id: 4, asset_id: 5, flow_type: 'purchase', amount: 50000.00, balance_after: 339000.00, flow_status: 'success', channel: 'online', remark: '购买沪深300指数增强A' },
    { flow_no: 'FF20260613005', customer_id: 5, asset_id: 1, flow_type: 'purchase', amount: 1000000.00, balance_after: 13800000.00, flow_status: 'success', channel: 'online', remark: '购买稳健增值债券A' },
    { flow_no: 'FF20260613006', customer_id: 1, asset_id: 2, flow_type: 'purchase', amount: 80000.00, balance_after: 876000.00, flow_status: 'pending', channel: 'online', remark: '购买科技成长混合C-待确认' },
    { flow_no: 'FF20260612007', customer_id: 2, asset_id: 3, flow_type: 'purchase', amount: 12000.00, balance_after: 2528000.00, flow_status: 'success', channel: 'online', remark: '购买金生康瑞重疾险' },
    { flow_no: 'FF20260612008', customer_id: 3, asset_id: 5, flow_type: 'purchase', amount: 500000.00, balance_after: 5200000.00, flow_status: 'success', channel: 'counter', remark: '购买沪深300指数增强A' },
    { flow_no: 'FF20260611009', customer_id: 4, asset_id: 1, flow_type: 'redeem', amount: 20000.00, balance_after: 389000.00, flow_status: 'success', channel: 'online', remark: '赎回稳健增值债券A' },
    { flow_no: 'FF20260611010', customer_id: 5, asset_id: 2, flow_type: 'purchase', amount: 2000000.00, balance_after: 14800000.00, flow_status: 'failed', channel: 'online', remark: '购买科技成长混合C-风控拦截' },
  ];

  await FundFlow.bulkCreate(flows as any);
}

async function seedComplianceAudits() {
  const audits = [
    {
      audit_no: 'CA20260615001', audit_type: 'trade', audit_status: 'approved',
      target_type: 'fund_flow', target_id: 1, risk_score: 12.50,
      auditor_id: 3, audit_opinion: '交易金额正常，符合客户风险等级', audit_at: new Date('2026-06-15T10:30:00'),
    },
    {
      audit_no: 'CA20260615002', audit_type: 'trade', audit_status: 'approved',
      target_type: 'fund_flow', target_id: 2, risk_score: 18.30,
      auditor_id: 3, audit_opinion: '交易金额在合理范围内', audit_at: new Date('2026-06-15T11:00:00'),
    },
    {
      audit_no: 'CA20260614003', audit_type: 'kyc', audit_status: 'approved',
      target_type: 'customer', target_id: 3, risk_score: 5.00,
      auditor_id: 3, audit_opinion: '企业客户资料齐全，通过KYC审核', audit_at: new Date('2026-06-14T14:20:00'),
    },
    {
      audit_no: 'CA20260613004', audit_type: 'trade', audit_status: 'rejected',
      target_type: 'fund_flow', target_id: 10, risk_score: 78.60,
      auditor_id: 3, audit_opinion: '单笔交易金额过大，超出客户风险承受能力，拒绝交易', audit_at: new Date('2026-06-13T16:45:00'),
    },
    {
      audit_no: 'CA20260612005', audit_type: 'risk', audit_status: 'pending',
      target_type: 'customer', target_id: 5, risk_score: 45.20,
      auditor_id: null, audit_opinion: null, audit_at: null,
    },
  ];

  await ComplianceAudit.bulkCreate(audits as any);
}

async function seed() {
  try {
    await sequelize.sync({ force: false, alter: true });
    console.log('Database synced');

    const permissions = await seedPermissions();
    console.log(`Seeded ${permissions.length} permissions`);

    const roles = await seedRoles(permissions);
    console.log('Seeded 4 roles');

    await seedUsers(roles);
    console.log(`Seeded 3 users`);

    await seedStockQuotes();
    console.log('Seeded 5 stock quotes');

    await seedAssetProducts();
    console.log('Seeded 5 asset products');

    await seedCustomerAssets();
    console.log('Seeded 5 customer assets');

    await seedFundFlows();
    console.log('Seeded 10 fund flows');

    await seedComplianceAudits();
    console.log('Seeded 5 compliance audits');

    console.log('All seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
