async function test() {
  async function login(username) {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: '123456' })
    });
    const data = await res.json();
    return data.data.token;
  }

  async function testPermission(token, role) {
    const res = await fetch('http://localhost:3001/api/business/opening/batch/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ ids: ['test'], operation: 'approve' })
    });
    const data = await res.json();
    console.log(role + ': code=' + data.code + ', msg=' + (data.message || data.data));
  }

  console.log('=== 权限控制验证: 批量审核接口 ===\n');
  
  const adminToken = await login('admin');
  await testPermission(adminToken, 'admin   ');
  
  const managerToken = await login('manager');
  await testPermission(managerToken, 'manager ');
  
  const operatorToken = await login('operator');
  await testPermission(operatorToken, 'operator');
  
  const auditorToken = await login('auditor');
  await testPermission(auditorToken, 'auditor ');
}
test();
