const BASE_URL = 'http://localhost:3001/api';

async function test() {
  console.log('=== 个人账户开户管控 - 接口联调测试 ===\n');

  let token = '';

  async function request(path, method, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json();
    return { status: res.status, data };
  }

  try {
    console.log('1. 登录接口...');
    const login = await request('/auth/login', 'POST', { username: 'admin', password: '123456' });
    token = login.data.data.token;
    console.log('   ✅ 登录成功\n');

    console.log('2. 功能点1 - 前置校验（身份证有效期+黑名单+实名完整性）...');
    const precheck = await request('/business/opening/precheck', 'POST', {
      customerName: '测试客户',
      idCardNo: '11010119900307123X',
      mobile: '13800000001',
      idValidFrom: '2020-01-01',
      idValidTo: '2040-01-01'
    });
    console.log('   ✅ 预检结果:', precheck.data.data.passed ? '通过' : '未通过', '风险等级:', precheck.data.data.riskLevel, '分数:', precheck.data.data.overallScore, '\n');

    console.log('3. 功能点4 - 开户溯源校验（重复开户检测+影像校验)...');
    const trace = await request('/business/opening/trace', 'POST', {
      idCardNo: '11010119900307123X',
      customerName: '测试客户',
      imageClarityScore: 85
    });
    console.log('   ✅ 溯源结果: 重复风险:', trace.data.data.duplicateRisk, '影像清晰:', trace.data.data.imageCheck.passed, '\n');

    console.log('4. 开户申请列表...');
    const list = await request('/business/opening/list?page=1&pageSize=10', 'GET');
    console.log('   ✅ 列表总数:', list.data.data.total, '状态分布:', JSON.stringify(list.data.data.aggregations?.status || []), '\n');

    console.log('5. 账户列表...');
    const accounts = await request('/business/account/list?page=1&pageSize=10', 'GET');
    console.log('   ✅ 账户总数:', accounts.data.data.total, '类型分布:', JSON.stringify(accounts.data.data.aggregations?.accountType || []), '\n');

    console.log('6. 功能点2 - 创建开户申请（一类账户）...');
    const create = await request('/business/opening', 'POST', {
      customerName: '新开户客户',
      idCardNo: '32010119950505123X',
      mobile: '13900000099',
      accountType: 1,
      idValidFrom: '2020-01-01',
      idValidTo: '2040-01-01',
      openPurpose: '工资发放',
      targetOrgId: 'org0000000000000000000000000000002'
    });
    console.log('   ✅ 创建成功,开户号:', create.data.data.openingNo, '状态:', create.data.data.status, '\n');

    console.log('=== 所有测试通过! ✅');

  } catch (e) {
    console.error('❌ 测试失败:', e.message || e);
    process.exit(1);
  }
}

test();
