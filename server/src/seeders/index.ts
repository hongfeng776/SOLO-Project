import { sequelize } from '@config/database';
import { db } from '@models/index';
import bcrypt from 'bcryptjs';
import { StockStatus } from '@enums/index';

const { User, Role, Permission, UserRole, RolePermission, StockQuote, StockQuoteHistory, QuoteAuditTrail, AssetProduct, CustomerAsset, FundFlow, ComplianceAudit, Trade, CustomerHolding, RiskAlert, OperationLog } = db;

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
    { name: '证券交易', code: 'trade', path: '/trades', icon: 'SwapOutlined', sortOrder: 7, children: [
      { name: '交易查看', code: 'trade:view', type: 'button', sortOrder: 1 },
      { name: '交易管理', code: 'trade:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '客户持仓', code: 'holding', path: '/holdings', icon: 'PieChartOutlined', sortOrder: 8, children: [
      { name: '持仓查看', code: 'holding:view', type: 'button', sortOrder: 1 },
    ]},
    { name: '风险告警', code: 'alert', path: '/alerts', icon: 'WarningOutlined', sortOrder: 9, children: [
      { name: '告警查看', code: 'alert:view', type: 'button', sortOrder: 1 },
      { name: '告警管理', code: 'alert:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '操作日志', code: 'log', path: '/logs', icon: 'FileTextOutlined', sortOrder: 10, children: [
      { name: '日志查看', code: 'log:view', type: 'button', sortOrder: 1 },
    ]},
    { name: '用户管理', code: 'user', path: '/users', icon: 'TeamOutlined', sortOrder: 11, children: [
      { name: '用户查看', code: 'user:view', type: 'button', sortOrder: 1 },
      { name: '用户管理', code: 'user:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '角色管理', code: 'role', path: '/roles', icon: 'SafetyOutlined', sortOrder: 12, children: [
      { name: '角色查看', code: 'role:view', type: 'button', sortOrder: 1 },
      { name: '角色管理', code: 'role:manage', type: 'button', sortOrder: 2 },
    ]},
    { name: '权限管理', code: 'permission', path: '/permissions', icon: 'KeyOutlined', sortOrder: 13, children: [
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

  const analystPermCodes = ['dashboard', 'dashboard:view', 'stock', 'stock:view', 'product', 'product:view', 'customer', 'customer:view', 'holding', 'holding:view', 'alert', 'alert:view'];
  const analystPermIds = allPermissions
    .filter((p) => analystPermCodes.includes(p.perm_code))
    .map((p) => p.id);
  await RolePermission.bulkCreate(analystPermIds.map((perm_id) => ({ role_id: analyst.id, perm_id } as any)));

  const auditorPermCodes = ['dashboard', 'dashboard:view', 'stock', 'stock:view', 'product', 'product:view', 'customer', 'customer:view', 'fund-flow', 'fund-flow:view', 'compliance', 'compliance:view', 'compliance:manage', 'trade', 'trade:view', 'holding', 'holding:view', 'alert', 'alert:view', 'alert:manage', 'log', 'log:view'];
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
  const statusArray: string[] = [];
  for (let i = 0; i < 25; i++) statusArray.push(StockStatus.TRADING);
  for (let i = 0; i < 2; i++) statusArray.push(StockStatus.HOLIDAY);
  for (let i = 0; i < 2; i++) statusArray.push(StockStatus.SUSPENDED);
  statusArray.push(StockStatus.DELISTED);
  for (let i = statusArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statusArray[i], statusArray[j]] = [statusArray[j], statusArray[i]];
  }
  const dataSources = ['sina', 'tencent', 'eastmoney'];
  const baseStocks = [
    { stock_code: '600519', stock_name: '贵州茅台', market: 'SH', sector: '消费', current_price: 1689.00, pe_ratio: 33.56, pb_ratio: 10.28, total_market_cap: 2122500000000, circulate_market_cap: 2122500000000 },
    { stock_code: '000858', stock_name: '五粮液', market: 'SZ', sector: '消费', current_price: 156.30, pe_ratio: 21.45, pb_ratio: 5.63, total_market_cap: 606300000000, circulate_market_cap: 606300000000 },
    { stock_code: '601318', stock_name: '中国平安', market: 'SH', sector: '金融', current_price: 48.65, pe_ratio: 9.87, pb_ratio: 1.15, total_market_cap: 886000000000, circulate_market_cap: 886000000000 },
    { stock_code: '300750', stock_name: '宁德时代', market: 'SZ', sector: '制造', current_price: 218.50, pe_ratio: 25.32, pb_ratio: 6.78, total_market_cap: 958000000000, circulate_market_cap: 845000000000 },
    { stock_code: '002594', stock_name: '比亚迪', market: 'SZ', sector: '制造', current_price: 286.40, pe_ratio: 28.56, pb_ratio: 5.92, total_market_cap: 832000000000, circulate_market_cap: 756000000000 },
    { stock_code: '600036', stock_name: '招商银行', market: 'SH', sector: '金融', current_price: 35.20, pe_ratio: 7.12, pb_ratio: 0.95, total_market_cap: 885000000000, circulate_market_cap: 885000000000 },
    { stock_code: '601012', stock_name: '隆基绿能', market: 'SH', sector: '能源', current_price: 24.85, pe_ratio: 18.32, pb_ratio: 3.25, total_market_cap: 188000000000, circulate_market_cap: 188000000000 },
    { stock_code: '600276', stock_name: '恒瑞医药', market: 'SH', sector: '医药', current_price: 45.30, pe_ratio: 52.18, pb_ratio: 8.76, total_market_cap: 288000000000, circulate_market_cap: 288000000000 },
    { stock_code: '000333', stock_name: '美的集团', market: 'SZ', sector: '制造', current_price: 62.50, pe_ratio: 13.85, pb_ratio: 3.12, total_market_cap: 436000000000, circulate_market_cap: 436000000000 },
    { stock_code: '601899', stock_name: '紫金矿业', market: 'SH', sector: '材料', current_price: 15.68, pe_ratio: 12.45, pb_ratio: 2.88, total_market_cap: 408000000000, circulate_market_cap: 408000000000 },
    { stock_code: '000002', stock_name: '万科A', market: 'SZ', sector: '地产', current_price: 8.56, pe_ratio: 6.23, pb_ratio: 0.48, total_market_cap: 99500000000, circulate_market_cap: 99500000000 },
    { stock_code: '601888', stock_name: '中国中免', market: 'SH', sector: '消费', current_price: 68.90, pe_ratio: 28.65, pb_ratio: 5.32, total_market_cap: 134000000000, circulate_market_cap: 134000000000 },
    { stock_code: '600030', stock_name: '中信证券', market: 'SH', sector: '金融', current_price: 22.15, pe_ratio: 15.32, pb_ratio: 1.28, total_market_cap: 330000000000, circulate_market_cap: 330000000000 },
    { stock_code: '002475', stock_name: '立讯精密', market: 'SZ', sector: '科技', current_price: 32.40, pe_ratio: 22.15, pb_ratio: 4.56, total_market_cap: 231000000000, circulate_market_cap: 231000000000 },
    { stock_code: '300059', stock_name: '东方财富', market: 'SZ', sector: '金融', current_price: 16.85, pe_ratio: 48.23, pb_ratio: 6.12, total_market_cap: 282000000000, circulate_market_cap: 282000000000 },
    { stock_code: '600887', stock_name: '伊利股份', market: 'SH', sector: '消费', current_price: 27.60, pe_ratio: 18.45, pb_ratio: 3.88, total_market_cap: 175000000000, circulate_market_cap: 175000000000 },
    { stock_code: '000568', stock_name: '泸州老窖', market: 'SZ', sector: '消费', current_price: 185.50, pe_ratio: 25.67, pb_ratio: 9.88, total_market_cap: 274000000000, circulate_market_cap: 274000000000 },
    { stock_code: '600031', stock_name: '三一重工', market: 'SH', sector: '制造', current_price: 18.25, pe_ratio: 15.62, pb_ratio: 2.15, total_market_cap: 156000000000, circulate_market_cap: 156000000000 },
    { stock_code: '000001', stock_name: '平安银行', market: 'SZ', sector: '金融', current_price: 11.28, pe_ratio: 5.45, pb_ratio: 0.52, total_market_cap: 218000000000, circulate_market_cap: 218000000000 },
    { stock_code: '601398', stock_name: '工商银行', market: 'SH', sector: '金融', current_price: 5.62, pe_ratio: 4.88, pb_ratio: 0.45, total_market_cap: 2008000000000, circulate_market_cap: 2008000000000 },
    { stock_code: '600900', stock_name: '长江电力', market: 'SH', sector: '能源', current_price: 27.85, pe_ratio: 20.32, pb_ratio: 3.85, total_market_cap: 624000000000, circulate_market_cap: 624000000000 },
    { stock_code: '002415', stock_name: '海康威视', market: 'SZ', sector: '科技', current_price: 34.12, pe_ratio: 19.85, pb_ratio: 4.22, total_market_cap: 323000000000, circulate_market_cap: 323000000000 },
    { stock_code: '300015', stock_name: '爱尔眼科', market: 'SZ', sector: '医药', current_price: 15.36, pe_ratio: 65.23, pb_ratio: 12.56, total_market_cap: 197000000000, circulate_market_cap: 197000000000 },
    { stock_code: '601668', stock_name: '中国建筑', market: 'SH', sector: '地产', current_price: 5.18, pe_ratio: 4.52, pb_ratio: 0.58, total_market_cap: 219000000000, circulate_market_cap: 219000000000 },
    { stock_code: '600585', stock_name: '海螺水泥', market: 'SH', sector: '材料', current_price: 26.85, pe_ratio: 8.32, pb_ratio: 1.02, total_market_cap: 144000000000, circulate_market_cap: 144000000000 },
    { stock_code: '601166', stock_name: '兴业银行', market: 'SH', sector: '金融', current_price: 17.56, pe_ratio: 4.88, pb_ratio: 0.48, total_market_cap: 367000000000, circulate_market_cap: 367000000000 },
    { stock_code: '002714', stock_name: '牧原股份', market: 'SZ', sector: '消费', current_price: 42.35, pe_ratio: 12.88, pb_ratio: 4.15, total_market_cap: 227000000000, circulate_market_cap: 227000000000 },
    { stock_code: '601288', stock_name: '农业银行', market: 'SH', sector: '金融', current_price: 3.85, pe_ratio: 4.52, pb_ratio: 0.42, total_market_cap: 1350000000000, circulate_market_cap: 1350000000000 },
    { stock_code: '002230', stock_name: '科大讯飞', market: 'SZ', sector: '科技', current_price: 52.18, pe_ratio: 168.35, pb_ratio: 8.56, total_market_cap: 121000000000, circulate_market_cap: 121000000000 },
    { stock_code: '600438', stock_name: '通威股份', market: 'SH', sector: '能源', current_price: 28.65, pe_ratio: 15.23, pb_ratio: 3.56, total_market_cap: 206000000000, circulate_market_cap: 206000000000 },
  ];
  const stocks = baseStocks.map((s, idx) => {
    const currentPrice = s.current_price;
    const changePercent = (Math.random() * 8 - 4) / 100;
    const changeAmount = Number((currentPrice * changePercent).toFixed(2));
    const changeRate = Number((changePercent * 100).toFixed(2));
    const open = Number((currentPrice * (1 + (Math.random() * 2 - 1) / 100)).toFixed(2));
    const close = Number((currentPrice - changeAmount).toFixed(2));
    const high = Number((Math.max(open, currentPrice) * (1 + Math.random() / 100)).toFixed(2));
    const low = Number((Math.min(open, currentPrice) * (1 - Math.random() / 100)).toFixed(2));
    const volume = Math.floor(Math.random() * 90000000) + 10000000;
    const turnover = Number((volume * (high + low) / 2).toFixed(2));
    const amplitude = Number((((high - low) / close) * 100).toFixed(2));
    return {
      stock_code: s.stock_code,
      stock_name: s.stock_name,
      market: s.market,
      status: statusArray[idx],
      sector: s.sector,
      data_source: dataSources[idx % dataSources.length],
      current_price: currentPrice,
      change_amount: changeAmount,
      change_rate: changeRate,
      open_price: open,
      close_price: close,
      high_price: high,
      low_price: low,
      volume,
      turnover,
      amplitude,
      pe_ratio: s.pe_ratio,
      pb_ratio: s.pb_ratio,
      total_market_cap: s.total_market_cap,
      circulate_market_cap: s.circulate_market_cap,
      trade_date: '2026-06-16',
      last_sync_at: new Date(),
    };
  });

  await StockQuote.bulkCreate(stocks as any);
  console.log(`Seeded ${stocks.length} stock quotes`);
}

async function seedStockQuoteHistory() {
  const stocks = await StockQuote.findAll();
  const historyRecords: any[] = [];
  for (const stock of stocks) {
    let basePrice = Number(stock.close_price || stock.current_price || 100);
    const baseVolume = Number(stock.volume || 10000000);
    for (let i = 45; i >= 1; i--) {
      const date = new Date('2026-06-16');
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }
      const dateStr = date.toISOString().split('T')[0];
      const changePercent = (Math.random() * 6 - 3) / 100;
      const open = Number((basePrice * (1 + (Math.random() * 1 - 0.5) / 100)).toFixed(2));
      const close = Number((basePrice * (1 + changePercent)).toFixed(2));
      const high = Number((Math.max(open, close) * (1 + Math.random() * 1.5 / 100)).toFixed(2));
      const low = Number((Math.min(open, close) * (1 - Math.random() * 1.5 / 100)).toFixed(2));
      const volume = Math.floor(baseVolume * (0.7 + Math.random() * 0.6));
      const turnover = Number((volume * ((open + close) / 2)).toFixed(2));
      historyRecords.push({
        stock_id: stock.id,
        stock_code: stock.stock_code,
        stock_name: stock.stock_name,
        trade_date: dateStr,
        open_price: open,
        close_price: close,
        high_price: high,
        low_price: low,
        current_price: close,
        change_amount: Number((close - basePrice).toFixed(2)),
        change_rate: Number((((close - basePrice) / basePrice) * 100).toFixed(4)),
        volume,
        turnover,
        created_at: new Date(),
        updated_at: new Date(),
      });
      basePrice = close;
    }
  }
  await StockQuoteHistory.bulkCreate(historyRecords as any);
  console.log(`Seeded ${historyRecords.length} stock quote history records`);
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

async function seedTrades() {
  const trades = [
    {
      trade_no: 'T20260615001', customer_id: 1, stock_id: 1, stock_code: '600519', stock_name: '贵州茅台',
      trade_type: 'buy', trade_price: 1685.00, trade_quantity: 100, trade_amount: 168500.00,
      trade_status: 'success', commission: 84.25, tax: 0, net_amount: 168584.25,
      audit_required: false, auditor_id: null, audit_opinion: null, audit_at: null,
      order_at: new Date('2026-06-15T09:35:00'), deal_at: new Date('2026-06-15T09:35:12'),
    },
    {
      trade_no: 'T20260615002', customer_id: 2, stock_id: 3, stock_code: '601318', stock_name: '中国平安',
      trade_type: 'buy', trade_price: 48.50, trade_quantity: 1000, trade_amount: 48500.00,
      trade_status: 'success', commission: 24.25, tax: 0, net_amount: 48524.25,
      audit_required: false, auditor_id: null, audit_opinion: null, audit_at: null,
      order_at: new Date('2026-06-15T10:15:00'), deal_at: new Date('2026-06-15T10:15:30'),
    },
    {
      trade_no: 'T20260615003', customer_id: 1, stock_id: 2, stock_code: '000858', stock_name: '五粮液',
      trade_type: 'sell', trade_price: 157.00, trade_quantity: 200, trade_amount: 31400.00,
      trade_status: 'success', commission: 15.70, tax: 31.40, net_amount: 31352.90,
      audit_required: false, auditor_id: null, audit_opinion: null, audit_at: null,
      order_at: new Date('2026-06-15T11:05:00'), deal_at: new Date('2026-06-15T11:05:45'),
    },
    {
      trade_no: 'T20260615004', customer_id: 5, stock_id: 4, stock_code: '300750', stock_name: '宁德时代',
      trade_type: 'buy', trade_price: 218.00, trade_quantity: 5000, trade_amount: 1090000.00,
      trade_status: 'auditing', commission: 545.00, tax: 0, net_amount: 1090545.00,
      audit_required: true, auditor_id: null, audit_opinion: null, audit_at: null,
      order_at: new Date('2026-06-15T13:20:00'), deal_at: null,
    },
    {
      trade_no: 'T20260614005', customer_id: 2, stock_id: 5, stock_code: '002594', stock_name: '比亚迪',
      trade_type: 'buy', trade_price: 288.00, trade_quantity: 500, trade_amount: 144000.00,
      trade_status: 'success', commission: 72.00, tax: 0, net_amount: 144072.00,
      audit_required: false, auditor_id: null, audit_opinion: null, audit_at: null,
      order_at: new Date('2026-06-14T10:00:00'), deal_at: new Date('2026-06-14T10:00:35'),
    },
    {
      trade_no: 'T20260614006', customer_id: 3, stock_id: 1, stock_code: '600519', stock_name: '贵州茅台',
      trade_type: 'buy', trade_price: 1678.00, trade_quantity: 500, trade_amount: 839000.00,
      trade_status: 'success', commission: 419.50, tax: 0, net_amount: 839419.50,
      audit_required: true, auditor_id: 3, audit_opinion: '机构客户大额买入，已通过审核', audit_at: new Date('2026-06-14T14:30:00'),
      order_at: new Date('2026-06-14T14:00:00'), deal_at: new Date('2026-06-14T14:35:00'),
    },
    {
      trade_no: 'T20260613007', customer_id: 4, stock_id: 3, stock_code: '601318', stock_name: '中国平安',
      trade_type: 'buy', trade_price: 48.20, trade_quantity: 100, trade_amount: 4820.00,
      trade_status: 'success', commission: 5.00, tax: 0, net_amount: 4825.00,
      audit_required: false, auditor_id: null, audit_opinion: null, audit_at: null,
      order_at: new Date('2026-06-13T09:50:00'), deal_at: new Date('2026-06-13T09:50:20'),
    },
    {
      trade_no: 'T20260613008', customer_id: 1, stock_id: 1, stock_code: '600519', stock_name: '贵州茅台',
      trade_type: 'sell', trade_price: 1690.00, trade_quantity: 50, trade_amount: 84500.00,
      trade_status: 'pending', commission: 42.25, tax: 84.50, net_amount: 84373.25,
      audit_required: false, auditor_id: null, audit_opinion: null, audit_at: null,
      order_at: new Date('2026-06-13T15:00:00'), deal_at: null,
    },
    {
      trade_no: 'T20260612009', customer_id: 5, stock_id: 2, stock_code: '000858', stock_name: '五粮液',
      trade_type: 'sell', trade_price: 160.00, trade_quantity: 10000, trade_amount: 1600000.00,
      trade_status: 'failed', commission: 800.00, tax: 1600.00, net_amount: 1597600.00,
      audit_required: true, auditor_id: 3, audit_opinion: '卖出数量过大，可能涉及市场操纵，拒绝交易', audit_at: new Date('2026-06-12T11:20:00'),
      order_at: new Date('2026-06-12T11:00:00'), deal_at: null,
    },
    {
      trade_no: 'T20260611010', customer_id: 3, stock_id: 4, stock_code: '300750', stock_name: '宁德时代',
      trade_type: 'sell', trade_price: 215.00, trade_quantity: 2000, trade_amount: 430000.00,
      trade_status: 'cancelled', commission: 215.00, tax: 430.00, net_amount: 429355.00,
      audit_required: false, auditor_id: null, audit_opinion: null, audit_at: null,
      order_at: new Date('2026-06-11T14:10:00'), deal_at: null,
    },
  ];

  await Trade.bulkCreate(trades as any);
}

async function seedCustomerHoldings() {
  const holdings = [
    {
      customer_id: 1, stock_id: 1, stock_code: '600519', stock_name: '贵州茅台',
      holding_quantity: 500, available_quantity: 450, frozen_quantity: 50,
      cost_price: 1620.50, current_price: 1689.00, market_value: 844500.00,
      floating_profit: 34250.00, floating_profit_rate: 0.0422, last_trade_date: new Date('2026-06-15'),
    },
    {
      customer_id: 1, stock_id: 2, stock_code: '000858', stock_name: '五粮液',
      holding_quantity: 300, available_quantity: 300, frozen_quantity: 0,
      cost_price: 145.80, current_price: 156.30, market_value: 46890.00,
      floating_profit: 3150.00, floating_profit_rate: 0.0720, last_trade_date: new Date('2026-06-15'),
    },
    {
      customer_id: 2, stock_id: 3, stock_code: '601318', stock_name: '中国平安',
      holding_quantity: 3000, available_quantity: 3000, frozen_quantity: 0,
      cost_price: 45.20, current_price: 48.65, market_value: 145950.00,
      floating_profit: 10350.00, floating_profit_rate: 0.0763, last_trade_date: new Date('2026-06-15'),
    },
    {
      customer_id: 2, stock_id: 5, stock_code: '002594', stock_name: '比亚迪',
      holding_quantity: 500, available_quantity: 500, frozen_quantity: 0,
      cost_price: 265.00, current_price: 286.40, market_value: 143200.00,
      floating_profit: 10700.00, floating_profit_rate: 0.0808, last_trade_date: new Date('2026-06-14'),
    },
    {
      customer_id: 3, stock_id: 1, stock_code: '600519', stock_name: '贵州茅台',
      holding_quantity: 2000, available_quantity: 2000, frozen_quantity: 0,
      cost_price: 1650.00, current_price: 1689.00, market_value: 3378000.00,
      floating_profit: 78000.00, floating_profit_rate: 0.0236, last_trade_date: new Date('2026-06-14'),
    },
  ];

  await CustomerHolding.bulkCreate(holdings as any);
}

async function seedRiskAlerts() {
  const alerts = [
    {
      alert_no: 'RA20260615001', alert_type: 'trade_abnormal', alert_level: 'high', alert_status: 'pending',
      customer_id: 5, stock_id: 2, trade_id: 9,
      alert_title: '异常大额卖出交易', alert_content: '客户鼎盛资产在短时间内大量卖出五粮液股票，数量达10000股，可能存在市场操纵风险。',
      risk_score: 82.50, related_data: { trade_amount: 1600000, trade_quantity: 10000, stock_code: '000858' },
      resolver_id: null, resolve_opinion: null, resolve_at: null,
    },
    {
      alert_no: 'RA20260615002', alert_type: 'position_concentration', alert_level: 'medium', alert_status: 'confirmed',
      customer_id: 3, stock_id: 1, trade_id: null,
      alert_title: '持仓集中度超标', alert_content: '客户中科创新科技贵州茅台持仓占总资产比例达21.38%，超过单一股票持仓20%的风险阈值。',
      risk_score: 55.20, related_data: { holding_ratio: 0.2138, threshold: 0.20, stock_code: '600519' },
      resolver_id: 3, resolve_opinion: '已确认，属于机构客户正常策略配置，持续监控', resolve_at: new Date('2026-06-15T15:00:00'),
    },
    {
      alert_no: 'RA20260614003', alert_type: 'price_abnormal', alert_level: 'low', alert_status: 'resolved',
      customer_id: null, stock_id: 4, trade_id: null,
      alert_title: '宁德时代股价波动异常', alert_content: '宁德时代当日涨幅达2.72%，成交量明显放大，需关注后续走势。',
      risk_score: 25.80, related_data: { change_rate: 0.0272, volume_ratio: 1.85, stock_code: '300750' },
      resolver_id: 2, resolve_opinion: '行业板块整体上涨，属正常波动，已解决', resolve_at: new Date('2026-06-14T17:30:00'),
    },
    {
      alert_no: 'RA20260613004', alert_type: 'risk_level_mismatch', alert_level: 'critical', alert_status: 'pending',
      customer_id: 4, stock_id: null, trade_id: null,
      alert_title: '客户风险等级与投资产品不匹配', alert_content: '客户陈雅琳风险等级为R2，但近期频繁申请购买R4级别的高风险产品，存在风险承受能力不匹配问题。',
      risk_score: 88.00, related_data: { customer_risk_level: 'R2', product_risk_level: 'R4', product_count: 3 },
      resolver_id: null, resolve_opinion: null, resolve_at: null,
    },
    {
      alert_no: 'RA20260612005', alert_type: 'capital_abnormal', alert_level: 'high', alert_status: 'ignored',
      customer_id: 5, stock_id: null, trade_id: null,
      alert_title: '资金流水异常', alert_content: '客户鼎盛资产连续多日大额资金进出，3日内累计转入2000万、转出1500万，资金流向异常。',
      risk_score: 72.30, related_data: { total_in: 20000000, total_out: 15000000, days: 3 },
      resolver_id: 3, resolve_opinion: '客户解释为正常资金调度，忽略此告警', resolve_at: new Date('2026-06-12T16:00:00'),
    },
  ];

  await RiskAlert.bulkCreate(alerts as any);
}

async function seedOperationLogs() {
  const logs = [
    {
      log_type: 'login', user_id: 1, username: 'admin', module: 'auth', action: 'login',
      target_type: null, target_id: null,
      request_params: { username: 'admin' }, response_data: { code: 200, message: '登录成功' },
      ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success', error_message: null,
      request_time: new Date('2026-06-15T09:00:00'), response_time: new Date('2026-06-15T09:00:02'), duration_ms: 1850,
      created_at: new Date('2026-06-15T09:00:02'),
    },
    {
      log_type: 'login', user_id: 2, username: 'analyst', module: 'auth', action: 'login',
      target_type: null, target_id: null,
      request_params: { username: 'analyst' }, response_data: { code: 200, message: '登录成功' },
      ip_address: '192.168.1.101', user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'success', error_message: null,
      request_time: new Date('2026-06-15T09:15:00'), response_time: new Date('2026-06-15T09:15:01'), duration_ms: 1200,
      created_at: new Date('2026-06-15T09:15:01'),
    },
    {
      log_type: 'create', user_id: 1, username: 'admin', module: 'customer', action: 'create',
      target_type: 'customer_asset', target_id: 6,
      request_params: { customer_name: '测试客户', id_card: '110101199001010001' }, response_data: { code: 200, data: { id: 6 } },
      ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success', error_message: null,
      request_time: new Date('2026-06-15T10:00:00'), response_time: new Date('2026-06-15T10:00:03'), duration_ms: 2800,
      created_at: new Date('2026-06-15T10:00:03'),
    },
    {
      log_type: 'update', user_id: 1, username: 'admin', module: 'product', action: 'update',
      target_type: 'asset_product', target_id: 1,
      request_params: { id: 1, daily_yield: 0.0015 }, response_data: { code: 200, message: '更新成功' },
      ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success', error_message: null,
      request_time: new Date('2026-06-15T10:30:00'), response_time: new Date('2026-06-15T10:30:02'), duration_ms: 1500,
      created_at: new Date('2026-06-15T10:30:02'),
    },
    {
      log_type: 'audit', user_id: 3, username: 'auditor', module: 'trade', action: 'audit',
      target_type: 'trade', target_id: 6,
      request_params: { trade_id: 6, audit_opinion: '机构客户大额买入，已通过审核', audit_result: 'approved' }, response_data: { code: 200, message: '审核完成' },
      ip_address: '192.168.1.102', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success', error_message: null,
      request_time: new Date('2026-06-14T14:30:00'), response_time: new Date('2026-06-14T14:30:05'), duration_ms: 4200,
      created_at: new Date('2026-06-14T14:30:05'),
    },
    {
      log_type: 'trade', user_id: 1, username: 'admin', module: 'trade', action: 'execute',
      target_type: 'trade', target_id: 1,
      request_params: { trade_no: 'T20260615001' }, response_data: { code: 200, message: '交易执行成功' },
      ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success', error_message: null,
      request_time: new Date('2026-06-15T09:35:00'), response_time: new Date('2026-06-15T09:35:12'), duration_ms: 12000,
      created_at: new Date('2026-06-15T09:35:12'),
    },
    {
      log_type: 'export', user_id: 2, username: 'analyst', module: 'customer', action: 'export',
      target_type: 'customer_asset', target_id: null,
      request_params: { format: 'xlsx', risk_level: 'R3' }, response_data: { code: 200, data: { file_url: '/exports/customers.xlsx' } },
      ip_address: '192.168.1.101', user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'success', error_message: null,
      request_time: new Date('2026-06-15T14:00:00'), response_time: new Date('2026-06-15T14:00:25'), duration_ms: 25000,
      created_at: new Date('2026-06-15T14:00:25'),
    },
    {
      log_type: 'delete', user_id: 1, username: 'admin', module: 'user', action: 'delete',
      target_type: 'user', target_id: 99,
      request_params: { id: 99 }, response_data: { code: 404, message: '用户不存在' },
      ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'failed', error_message: 'User with id 99 not found',
      request_time: new Date('2026-06-15T11:20:00'), response_time: new Date('2026-06-15T11:20:01'), duration_ms: 800,
      created_at: new Date('2026-06-15T11:20:01'),
    },
    {
      log_type: 'logout', user_id: 2, username: 'analyst', module: 'auth', action: 'logout',
      target_type: null, target_id: null,
      request_params: null, response_data: { code: 200, message: '退出成功' },
      ip_address: '192.168.1.101', user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'success', error_message: null,
      request_time: new Date('2026-06-15T18:00:00'), response_time: new Date('2026-06-15T18:00:01'), duration_ms: 500,
      created_at: new Date('2026-06-15T18:00:01'),
    },
    {
      log_type: 'audit', user_id: 3, username: 'auditor', module: 'alert', action: 'resolve',
      target_type: 'risk_alert', target_id: 2,
      request_params: { alert_id: 2, resolve_opinion: '已确认，属于机构客户正常策略配置，持续监控' }, response_data: { code: 200, message: '告警已处理' },
      ip_address: '192.168.1.102', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success', error_message: null,
      request_time: new Date('2026-06-15T15:00:00'), response_time: new Date('2026-06-15T15:00:03'), duration_ms: 3000,
      created_at: new Date('2026-06-15T15:00:03'),
    },
  ];

  await OperationLog.bulkCreate(logs as any);
}

async function seedQuoteAuditTrails() {
  const stocks = await StockQuote.findAll();
  const operationTypes = ['create', 'update', 'import_manual', 'import_batch', 'delete'];
  const dataPeriods = ['early_morning', 'midday', 'after_close'];
  const sourceChannels = ['manual', 'import_api', 'excel_import', 'system_sync'];
  const dataSources = ['sina', 'tencent', 'eastmoney', 'manual_input'];
  const verificationStatuses = ['verified', 'pending', 'rejected'];
  const operators = [
    { id: 1, name: '系统管理员' },
    { id: 2, name: '张分析师' },
    { id: 3, name: '李审计员' },
  ];
  const fields = ['current_price', 'change_rate', 'volume', 'close_price', 'open_price'];

  const auditTrails: any[] = [];

  for (let i = 0; i < 20; i++) {
    const stock = stocks[i % stocks.length];
    const operator = operators[i % operators.length];
    const operationType = operationTypes[i % operationTypes.length];
    const dataPeriod = dataPeriods[i % dataPeriods.length];
    const sourceChannel = sourceChannels[i % sourceChannels.length];
    const dataSource = dataSources[i % dataSources.length];
    const status = verificationStatuses[i % verificationStatuses.length];
    const consistencyScore = Math.floor(Math.random() * 16) + 85;
    const changedField = fields[i % fields.length];

    const stockJson = stock.toJSON() as any;
    const previousSnapshot: any = {};
    const newSnapshot: any = {};
    const fieldChanges: any = {};

    for (const key of Object.keys(stockJson)) {
      previousSnapshot[key] = stockJson[key];
      newSnapshot[key] = stockJson[key];
    }

    if (stockJson[changedField] != null) {
      const originalVal = Number(stockJson[changedField]) || 100;
      const newVal = Number((originalVal * (1 + (Math.random() * 4 - 2) / 100)).toFixed(2));
      newSnapshot[changedField] = newVal;
      fieldChanges[changedField] = {
        previous: stockJson[changedField],
        new: newVal,
      };
    }

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - (i % 15));
    createdAt.setHours(9 + (i % 8), (i * 7) % 60, 0, 0);

    auditTrails.push({
      stock_id: stock.id,
      stock_code: stockJson.stock_code,
      operation_type: operationType,
      data_period: dataPeriod,
      field_changes: Object.keys(fieldChanges).length > 0 ? fieldChanges : null,
      previous_snapshot: previousSnapshot,
      new_snapshot: newSnapshot,
      operator_id: operator.id,
      operator_name: operator.name,
      source_channel: sourceChannel,
      data_source: dataSource,
      remark: `第${i + 1}条示例溯源记录 - ${operationType}操作`,
      verification_status: status,
      consistency_score: consistencyScore,
      accuracy_violations:
        status === 'rejected'
          ? [{ field: changedField, message: '数据精度超出阈值', level: 'warning' }]
          : null,
      created_at: createdAt,
    });
  }

  await QuoteAuditTrail.bulkCreate(auditTrails as any);
  console.log(`Seeded ${auditTrails.length} quote audit trails`);
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

    await seedStockQuoteHistory();

    await seedAssetProducts();
    console.log('Seeded 5 asset products');

    await seedCustomerAssets();
    console.log('Seeded 5 customer assets');

    await seedFundFlows();
    console.log('Seeded 10 fund flows');

    await seedComplianceAudits();
    console.log('Seeded 5 compliance audits');

    await seedTrades();
    console.log('Seeded 10 trades');

    await seedCustomerHoldings();
    console.log('Seeded 5 customer holdings');

    await seedRiskAlerts();
    console.log('Seeded 5 risk alerts');

    await seedOperationLogs();
    console.log('Seeded 10 operation logs');

    await seedQuoteAuditTrails();

    console.log('All seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
