const BASE = 'http://localhost:3001/api';

async function login() {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123456' })
  });
  const d = await r.json();
  return d.data.token;
}

async function run() {
  const token = await login();
  const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  console.log('=== Login OK, token acquired ===\n');

  // ===== 功能点1：前置预检 =====
  console.log('=== 1. Precheck (功能点1: 前置校验) ===');
  let r = await fetch(`${BASE}/business/opening/precheck`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      customerName: '张三',
      idCardNo: '110101199003077654',
      mobile: '13812345678',
      idValidTo: '2030-12-31',
      accountType: 1,
      channelCode: 'counter'
    })
  });
  let d = await r.json();
  console.log('status:', r.status, 'passed:', d.data.passed, 'score:', d.data.overall_score,
    'risk_level:', d.data.risk_level, 'tags:', d.data.risk_tags);
  console.log('items sample:', d.data.items?.slice(0, 3).map((x: any) => `${x.field}=${x.passed}`), '\n');

  // ===== 黑名单测试 =====
  console.log('=== 1b. Precheck with blacklist id (功能点1: 黑名单拦截) ===');
  r = await fetch(`${BASE}/business/opening/precheck`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      customerName: '黑名单',
      idCardNo: '110101199001011234',
      mobile: '13812345678',
      accountType: 2,
      channelCode: 'mobile'
    })
  });
  d = await r.json();
  console.log('status:', r.status, 'passed:', d.data.passed, 'blocked:', d.data.blocked_reason?.slice(0, 60), '\n');

  // ===== 功能点1+2：创建开户申请（多类型） =====
  console.log('=== 2. Create Opening (功能点1+2: 多账户类型联动) ===');
  r = await fetch(`${BASE}/business/opening`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      accountType: 2,
      customerName: '李四',
      idCardNo: '310101198807072345',
      mobile: '13987654321',
      idValidTo: '2035-06-30',
      mobileVerified: 1,
      regionMatched: 1,
      openPurpose: 'salary',
      imageClarityScore: '90',
      channelCode: 'counter'
    })
  });
  d = await r.json();
  console.log('status:', r.status, 'opening_no:', d.data?.opening_no, 'account_type:', d.data?.account_type_text,
    'risk_level:', d.data?.risk_level, 'status:', d.data?.status_text);
  const openingId1 = d.data?.id;
  console.log();

  // 高风险+投资用途 二类户
  console.log('=== 2b. Create high-risk Type III (功能点3: 差异化校验) ===');
  r = await fetch(`${BASE}/business/opening`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      accountType: 3,
      customerName: '王五',
      idCardNo: '440101198505056789',
      mobile: '13712349876',
      idValidTo: '2028-05-05',
      mobileVerified: 2,
      regionMatched: 0,
      openPurpose: 'investment',
      imageClarityScore: '70',
      channelCode: 'ebank'
    })
  });
  d = await r.json();
  console.log('status:', r.status, 'opening_no:', d.data?.opening_no, 'status:', d.data?.status_text,
    'risk_level:', d.data?.risk_level, 'risk_tags:', d.data?.risk_tags?.slice(0, 30));
  const openingId2 = d.data?.id;
  console.log();

  // ===== 功能点2：取消操作 =====
  console.log('=== 3. Cancel Opening (功能点2: 取消操作保留实名) ===');
  r = await fetch(`${BASE}/business/opening/${openingId1}/cancel`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ remark: '用户主动取消' })
  });
  d = await r.json();
  console.log('status:', r.status, 'new_status:', d.data?.status_text,
    'customer_name still:', d.data?.customer_name, 'residential cleared:', !d.data?.residential_address);
  console.log();

  // ===== 功能点3：批量导入 =====
  console.log('=== 4. Batch Import (功能点3: 差异化校验+高风险复核) ===');
  r = await fetch(`${BASE}/business/opening/batch/import`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      items: [
        { customerName: '批量客1', idCardNo: '510101199001011234', mobile: '13800000001', accountType: 1, openPurpose: 'consumption' },
        { customerName: '批量客2', idCardNo: '510101199001011235', mobile: '13800000002', accountType: 2, openPurpose: 'investment' },
        { customerName: '批量客3', idCardNo: '110101199001011234', mobile: '13800000003', accountType: 1 }
      ]
    })
  });
  d = await r.json();
  console.log('status:', r.status);
  d.data.forEach((item: any, i: number) => {
    console.log(`  [${i}] success=${item.success} opening=${item.opening_no?.slice(0, 12)}... errors=${item.errors?.length || 0} warnings=${item.warnings?.length || 0} need_review=${item.need_manual_review} risk=${item.risk_level}`);
  });
  console.log();

  // ===== 功能点3：批量通过（仅管理员） =====
  console.log('=== 5. Batch Review Approve (功能点3: 仅管理员批量通过) ===');
  const pendingIds = d.data.filter((x: any) => x.success && x.need_manual_review).map((x: any) => x.opening_id).filter(Boolean);
  console.log('pending ids:', pendingIds);
  if (pendingIds.length > 0) {
    r = await fetch(`${BASE}/business/opening/batch/review`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ ids: pendingIds, operation: 'approve' })
    });
    d = await r.json();
    console.log('status:', r.status, 'success_count:', d.data?.success_count, 'fail_count:', d.data?.fail_count);
  }
  console.log();

  // ===== 功能点4：溯源检查 =====
  console.log('=== 6. Trace Check (功能点4: 重复开户+多维度校验) ===');
  r = await fetch(`${BASE}/business/opening/trace`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ idCardNo: '510101199001011234', customerName: '批量客1' })
  });
  d = await r.json();
  console.log('status:', r.status);
  console.log('  total_openings:', d.data?.total_openings, 'duplicate_risk:', d.data?.duplicate_risk,
    'allowed:', d.data?.allowed, 'block_reason:', d.data?.block_reason?.slice(0, 50));
  console.log('  image_checks:', JSON.stringify(d.data?.image_checks),
    'recent_count:', d.data?.recent_openings?.length);
  console.log();

  // ===== 功能点1：开户列表 =====
  console.log('=== 7. Opening List ===');
  r = await fetch(`${BASE}/business/opening/list?page=1&pageSize=5&status=3`, { headers: H });
  d = await r.json();
  console.log('status:', r.status, 'total:', d.data?.total, 'list sample:');
  d.data?.list?.slice(0, 3).forEach((o: any) => {
    console.log(`  ${o.opening_no} | ${o.customer_name} | ${o.account_type_text} | ${o.status_text} | risk=${o.risk_level_text} | isolated=${o.is_isolated}`);
  });
  console.log();

  // ===== 功能点2：办理开户 =====
  console.log('=== 8. Open Account (功能点2: 开户成功自动生成账户号) ===');
  if (pendingIds.length > 0) {
    r = await fetch(`${BASE}/business/opening/${pendingIds[0]}/open`, {
      method: 'POST', headers: H
    });
    d = await r.json();
    console.log('status:', r.status, 'account_no:', d.data?.account_no, 'status:', d.data?.status_text);
  }
  console.log();

  // ===== 账户管理 =====
  console.log('=== 9. Account List ===');
  r = await fetch(`${BASE}/business/account/list?page=1&pageSize=5`, { headers: H });
  d = await r.json();
  console.log('status:', r.status, 'total:', d.data?.total);
  d.data?.list?.slice(0, 3).forEach((a: any) => {
    console.log(`  ${a.account_no} | ${a.account_type_text} | ${a.customer_name} | ￥${a.balance} | ${a.status_text}`);
  });

  console.log('\n=== 所有接口测试完成 ===');
}

run().catch(e => console.error('ERROR:', e.message, e.response?.data)).finally(() => process.exit(0));
