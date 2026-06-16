import { User, Role } from '@models/index'
import { hashPassword } from '@utils/auth'

async function seedDatabase() {
  try {
    const adminRole = await Role.create({
      name: '超级管理员',
      code: 'admin',
      description: '系统超级管理员，拥有所有权限',
      status: 1,
      permissions: JSON.stringify(['*'])
    })

    await Role.create({
      name: '内容编辑',
      code: 'editor',
      description: '内容编辑人员',
      status: 1,
      permissions: JSON.stringify(['content:note:list', 'content:note:edit', 'content:tags:list'])
    })

    await Role.create({
      name: '内容审核',
      code: 'reviewer',
      description: '内容审核人员',
      status: 1,
      permissions: JSON.stringify(['content:note:list', 'content:review:list', 'content:review:audit'])
    })

    await Role.create({
      name: '运营人员',
      code: 'operation',
      description: '活动运营人员',
      status: 1,
      permissions: JSON.stringify(['creator:list', 'activity:list', 'activity:orders:list'])
    })

    const adminPassword = await hashPassword('admin123')
    const admin = await User.create({
      username: 'admin',
      password: adminPassword,
      nickname: '超级管理员',
      avatar: '',
      email: 'admin@hongtu.com',
      phone: '13800000000',
      status: 1
    })

    await (admin as any).addRole(adminRole)

    console.log('[Seed] 初始数据插入完成')
    console.log('[Seed] 管理员账号: admin / admin123')
    process.exit(0)
  } catch (error) {
    console.error('[Seed] 初始数据插入失败:', error)
    process.exit(1)
  }
}

seedDatabase()
