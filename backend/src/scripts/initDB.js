require('dotenv').config()
const { syncDatabase } = require('../models/db')
const { hashPassword } = require('../utils/auth')
const { User, Category, Resource, Template, Member } = require('../models')

const initDatabase = async () => {
  try {
    console.log('开始初始化数据库...')

    await syncDatabase(true)

    console.log('创建超级管理员...')
    const adminPassword = await hashPassword('admin123456')
    const superAdmin = await User.create({
      username: 'admin',
      password: adminPassword,
      nickname: '超级管理员',
      email: 'admin@yingchuang.com',
      phone: '13800138000',
      role: 'super_admin',
      status: 'active'
    })

    const auditorPassword = await hashPassword('auditor123')
    await User.create({
      username: 'auditor',
      password: auditorPassword,
      nickname: '审核员',
      email: 'auditor@yingchuang.com',
      phone: '13800138001',
      role: 'auditor',
      status: 'active'
    })

    const operatorPassword = await hashPassword('operator123')
    await User.create({
      username: 'operator',
      password: operatorPassword,
      nickname: '运营员',
      email: 'operator@yingchuang.com',
      phone: '13800138002',
      role: 'operator',
      status: 'active'
    })

    console.log('创建分类数据...')
    const imageCategories = ['自然风光', '城市建筑', '人物肖像', '美食餐饮', '科技数码', '商务办公']
    const videoCategories = ['宣传片', '短视频', '纪录片', '动画', 'Vlog', '教育']
    const templateCategories = ['PSD模板', 'AE模板', 'PPT模板', '海报设计', 'Logo设计', 'UI设计']

    for (let i = 0; i < imageCategories.length; i++) {
      await Category.create({
        name: imageCategories[i],
        type: 'image',
        sort: i + 1,
        status: 'active'
      })
    }

    for (let i = 0; i < videoCategories.length; i++) {
      await Category.create({
        name: videoCategories[i],
        type: 'video',
        sort: i + 1,
        status: 'active'
      })
    }

    for (let i = 0; i < templateCategories.length; i++) {
      await Category.create({
        name: templateCategories[i],
        type: 'template',
        sort: i + 1,
        status: 'active'
      })
    }

    console.log('创建示例资源...')
    const sampleImages = [
      { title: '山川湖海风光摄影', categoryId: 1, fileType: 'image' },
      { title: '城市夜景航拍', categoryId: 2, fileType: 'image' },
      { title: '商务办公场景', categoryId: 6, fileType: 'image' },
      { title: '美食摄影作品集', categoryId: 4, fileType: 'image' },
      { title: '科技产品展示', categoryId: 5, fileType: 'image' }
    ]

    for (const img of sampleImages) {
      await Resource.create({
        ...img,
        description: '高质量影像素材，适用于各类设计项目',
        coverUrl: `https://picsum.photos/400/300?random=${Math.random()}`,
        fileUrl: `https://picsum.photos/1920/1080?random=${Math.random()}`,
        fileSize: Math.floor(Math.random() * 5 * 1024 * 1024) + 1024 * 1024,
        width: 1920,
        height: 1080,
        status: ['draft', 'pending', 'approved', 'published'][Math.floor(Math.random() * 4)],
        tags: ['高清', '素材', '精选'].join(','),
        authorId: superAdmin.id,
        authorName: superAdmin.nickname,
        viewCount: Math.floor(Math.random() * 1000),
        downloadCount: Math.floor(Math.random() * 500),
        likeCount: Math.floor(Math.random() * 200)
      })
    }

    console.log('创建示例模板...')
    const sampleTemplates = [
      { name: '商务海报模板', categoryId: 10, categoryName: '海报设计' },
      { name: '企业宣传PPT', categoryId: 9, categoryName: 'PPT模板' },
      { name: '产品展示AE模板', categoryId: 8, categoryName: 'AE模板' },
      { name: 'Logo设计模板集', categoryId: 11, categoryName: 'Logo设计' }
    ]

    for (const tpl of sampleTemplates) {
      await Template.create({
        ...tpl,
        description: '专业设计模板，可直接使用',
        coverUrl: `https://picsum.photos/400/300?random=${Math.random()}`,
        previewUrl: `https://picsum.photos/800/600?random=${Math.random()}`,
        fileUrl: `/templates/${Math.random().toString(36).substr(2, 9)}.zip`,
        fileSize: Math.floor(Math.random() * 50 * 1024 * 1024) + 5 * 1024 * 1024,
        price: Math.floor(Math.random() * 100) + 10,
        status: ['draft', 'pending', 'approved', 'published'][Math.floor(Math.random() * 4)],
        tags: ['精品', '商用', '高清'].join(','),
        authorId: superAdmin.id,
        authorName: superAdmin.nickname,
        useCount: Math.floor(Math.random() * 200),
        software: 'Photoshop',
        version: '1.0.0'
      })
    }

    console.log('创建会员示例...')
    for (let i = 1; i <= 5; i++) {
      const memberUser = await User.create({
        username: `user00${i}`,
        password: await hashPassword('user123456'),
        nickname: `会员用户${i}`,
        email: `user00${i}@example.com`,
        phone: `1390000000${i}`,
        role: 'member',
        status: 'active'
      })

      await Member.create({
        userId: memberUser.id,
        username: memberUser.username,
        level: ['normal', 'bronze', 'silver', 'gold', 'platinum'][i - 1],
        points: i * 100,
        balance: i * 50,
        totalDownload: i * 10,
        totalConsume: i * 100
      })
    }

    console.log('\n========================================')
    console.log('✅ 数据库初始化完成!')
    console.log('')
    console.log('超级管理员账号:')
    console.log('  用户名: admin')
    console.log('  密码: admin123456')
    console.log('')
    console.log('审核员账号:')
    console.log('  用户名: auditor')
    console.log('  密码: auditor123')
    console.log('')
    console.log('运营员账号:')
    console.log('  用户名: operator')
    console.log('  密码: operator123')
    console.log('========================================\n')

    process.exit(0)
  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

initDatabase()
