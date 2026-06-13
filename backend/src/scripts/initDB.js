require('dotenv').config();
const { sequelize, User, Role, Permission } = require('../models');

const initDatabase = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log('开始初始化数据库...');

    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ force: false, transaction });
    console.log('数据表同步完成');

    const defaultRoles = [
      { name: '超级管理员', code: 'admin', description: '拥有系统所有权限', status: 1 },
      { name: '普通用户', code: 'user', description: '普通用户权限', status: 1 }
    ];

    const roles = [];
    for (const roleData of defaultRoles) {
      const [role, created] = await Role.findOrCreate({
        where: { code: roleData.code },
        defaults: roleData,
        transaction
      });
      roles.push(role);
      if (created) {
        console.log(`创建角色: ${roleData.name} (${roleData.code})`);
      } else {
        console.log(`角色已存在: ${roleData.name} (${roleData.code})`);
      }
    }

    const adminRole = roles.find(r => r.code === 'admin');
    const userRole = roles.find(r => r.code === 'user');

    const defaultPermissions = [
      { name: '系统管理', code: 'system', type: 'menu', path: '/system', component: 'system/index', icon: 'Setting', sort: 1, parent_id: null },
      { name: '用户管理', code: 'system:user', type: 'menu', path: '/system/user', component: 'system/user/index', icon: 'User', sort: 1, parent_id: null },
      { name: '用户列表', code: 'system:user:list', type: 'button', sort: 1, parent_id: null },
      { name: '新增用户', code: 'system:user:add', type: 'button', sort: 2, parent_id: null },
      { name: '编辑用户', code: 'system:user:edit', type: 'button', sort: 3, parent_id: null },
      { name: '删除用户', code: 'system:user:delete', type: 'button', sort: 4, parent_id: null },
      { name: '分配角色', code: 'system:user:assign', type: 'button', sort: 5, parent_id: null },
      { name: '查看用户', code: 'system:user:view', type: 'button', sort: 6, parent_id: null },
      { name: '角色管理', code: 'system:role', type: 'menu', path: '/system/role', component: 'system/role/index', icon: 'UserFilled', sort: 2, parent_id: null },
      { name: '角色列表', code: 'system:role:list', type: 'button', sort: 1, parent_id: null },
      { name: '新增角色', code: 'system:role:add', type: 'button', sort: 2, parent_id: null },
      { name: '编辑角色', code: 'system:role:edit', type: 'button', sort: 3, parent_id: null },
      { name: '删除角色', code: 'system:role:delete', type: 'button', sort: 4, parent_id: null },
      { name: '分配权限', code: 'system:role:assign', type: 'button', sort: 5, parent_id: null },
      { name: '查看角色', code: 'system:role:view', type: 'button', sort: 6, parent_id: null },
      { name: '权限管理', code: 'system:permission', type: 'menu', path: '/system/permission', component: 'system/permission/index', icon: 'Key', sort: 3, parent_id: null },
      { name: '权限列表', code: 'system:permission:list', type: 'button', sort: 1, parent_id: null },
      { name: '新增权限', code: 'system:permission:add', type: 'button', sort: 2, parent_id: null },
      { name: '编辑权限', code: 'system:permission:edit', type: 'button', sort: 3, parent_id: null },
      { name: '删除权限', code: 'system:permission:delete', type: 'button', sort: 4, parent_id: null },
      { name: '查看权限', code: 'system:permission:view', type: 'button', sort: 5, parent_id: null }
    ];

    const permissions = [];
    for (const permData of defaultPermissions) {
      const [permission, created] = await Permission.findOrCreate({
        where: { code: permData.code },
        defaults: permData,
        transaction
      });
      permissions.push(permission);
      if (created) {
        console.log(`创建权限: ${permData.name} (${permData.code})`);
      } else {
        console.log(`权限已存在: ${permData.name} (${permData.code})`);
      }
    }

    const systemMenu = permissions.find(p => p.code === 'system');
    const userMenu = permissions.find(p => p.code === 'system:user');
    const roleMenu = permissions.find(p => p.code === 'system:role');
    const permissionMenu = permissions.find(p => p.code === 'system:permission');

    if (systemMenu && userMenu && !userMenu.parent_id) {
      await userMenu.update({ parent_id: systemMenu.id }, { transaction });
      console.log('设置用户管理父级为系统管理');
    }
    if (systemMenu && roleMenu && !roleMenu.parent_id) {
      await roleMenu.update({ parent_id: systemMenu.id }, { transaction });
      console.log('设置角色管理父级为系统管理');
    }
    if (systemMenu && permissionMenu && !permissionMenu.parent_id) {
      await permissionMenu.update({ parent_id: systemMenu.id }, { transaction });
      console.log('设置权限管理父级为系统管理');
    }

    const buttonPerms = permissions.filter(p => p.type === 'button');
    for (const perm of buttonPerms) {
      if (!perm.parent_id) {
        if (perm.code.startsWith('system:user:')) {
          await perm.update({ parent_id: userMenu.id }, { transaction });
          console.log(`设置${perm.name}父级为用户管理`);
        } else if (perm.code.startsWith('system:role:')) {
          await perm.update({ parent_id: roleMenu.id }, { transaction });
          console.log(`设置${perm.name}父级为角色管理`);
        } else if (perm.code.startsWith('system:permission:')) {
          await perm.update({ parent_id: permissionMenu.id }, { transaction });
          console.log(`设置${perm.name}父级为权限管理`);
        }
      }
    }

    if (adminRole) {
      await adminRole.setPermissions(permissions, { transaction });
      console.log('给超级管理员角色分配所有权限');
    }

    const adminExists = await User.findOne({ where: { username: 'admin' }, transaction });
    let adminUser;
    if (adminExists) {
      console.log('管理员账号已存在，跳过创建');
      adminUser = adminExists;
    } else {
      adminUser = await User.create({
        username: 'admin',
        password: 'admin123',
        nickname: '系统管理员',
        email: 'admin@hongjing.com',
        role: 'admin',
        status: 1
      }, { transaction });
      console.log('默认管理员账号创建成功');
      console.log('用户名: admin');
      console.log('密码: admin123');
    }

    if (adminRole && adminUser) {
      await adminUser.setRoles([adminRole], { transaction });
      console.log('给 admin 用户分配超级管理员角色');
    }

    const userExists = await User.findOne({ where: { username: 'user' }, transaction });
    if (userExists) {
      console.log('普通用户账号已存在，跳过创建');
    } else {
      const normalUser = await User.create({
        username: 'user',
        password: 'user123',
        nickname: '普通用户',
        email: 'user@hongjing.com',
        role: 'user',
        status: 1
      }, { transaction });
      if (userRole) {
        await normalUser.setRoles([userRole], { transaction });
      }
      console.log('默认普通用户账号创建成功');
      console.log('用户名: user');
      console.log('密码: user123');
    }

    await transaction.commit();
    console.log('数据库初始化完成');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('数据库初始化失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

initDatabase();
