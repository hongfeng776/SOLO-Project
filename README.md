# 奇影内容运营管理平台

> 文娱内容平台资源量大、审核频次高、运维操作密集的业务特性，打造的一体化内容运营管理平台。

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript (严格模式)
- **构建工具**: Vite 5.x
- **路由**: Vue Router 4.x
- **状态管理**: Pinia + 持久化插件
- **UI组件库**: Element Plus
- **HTTP库**: Axios (二次封装)
- **图标**: @element-plus/icons-vue
- **工具库**: dayjs / lodash-es / echarts

### 后端
- **框架**: Node.js + Express
- **ORM**: Sequelize 6.x
- **数据库**: MySQL 5.7+
- **缓存**: Redis 6.x
- **认证**: JWT + 双Token机制
- **验证**: Joi
- **安全**: helmet / cors / 限流
- **日志**: morgan

## 功能特性

### 已实现模块

| 模块 | 功能说明 |
|------|----------|
| **认证授权** | JWT双Token认证、自动刷新、角色分级权限、路由守卫 |
| **系统管理** | 用户管理、角色管理、权限配置、个人中心 |
| **内容管理** | 影视内容CRUD、内容审核、批量审核、内容预览 |
| **版权管理** | 版权信息维护、合同管理、授权期限、内容关联 |
| **广告投放** | 广告位管理、投放周期、投放数据统计 |
| **活动运营** | 营销活动配置、抽奖/优惠/签到活动、参与数据统计 |

### 文娱平台专属规范
- 内容审核状态：待审核 → 审核中 → 通过/驳回 → 已下架
- 版权类型：独家/非独家/代理/公共
- 会员等级：普通/VIP/SVIP/年度/终身
- 内容分类：电影/电视剧/综艺/动漫/纪录片/短视频/直播
- 广告类型：Banner/开屏/插屏/信息流/激励视频

## 目录结构

```
.
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── app.js              # 应用入口
│   │   ├── config/             # 配置(数据库/Redis/全局)
│   │   ├── constants/          # 枚举常量
│   │   ├── controllers/        # 控制层(7个模块)
│   │   ├── middleware/         # 中间件(鉴权/验证/异常)
│   │   ├── models/             # Sequelize模型(6个核心表)
│   │   ├── routes/             # 路由层
│   │   ├── scripts/            # 数据库初始化脚本
│   │   ├── services/           # 业务逻辑层
│   │   └── utils/              # 工具函数
│   ├── .env                    # 环境变量
│   └── package.json
│
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── api/                # API接口层
│   │   ├── components/         # 通用组件(6个高频复用)
│   │   ├── constants/          # 枚举常量
│   │   ├── layouts/            # 布局框架
│   │   ├── router/             # 路由配置
│   │   ├── stores/             # Pinia状态管理
│   │   ├── styles/             # 全局样式
│   │   ├── types/              # TypeScript类型
│   │   ├── utils/              # 工具函数
│   │   ├── views/              # 页面视图
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
└── package.json                # 根目录启动脚本
```

## 快速开始

### 环境要求
- Node.js >= 16.x
- MySQL >= 5.7
- Redis >= 6.x

### 1. 安装依赖

```bash
# 一键安装所有依赖(包含concurrently)
npm run install:all
```

### 2. 配置环境变量

修改 `backend/.env`:
```env
# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=qiying_admin
DB_USER=root
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 3. 初始化数据库

```bash
# 创建数据库并初始化表结构 + 初始数据
npm run db:init
```

初始化后默认账号：
| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 超级管理员 | admin | admin123456 | 全部权限 |
| 内容审核员 | auditor01 | admin123456 | 内容审核权限 |

### 4. 启动开发环境

```bash
# 一键启动前后端(推荐)
npm run dev

# 或分别启动
npm run dev:backend   # 后端: http://localhost:3000
npm run dev:frontend  # 前端: http://localhost:5173
```

### 5. 生产部署

```bash
# 构建前端
npm run build:frontend

# 启动后端服务
npm start
```

## 后端 API 概览

| 模块 | 接口前缀 | 说明 |
|------|----------|------|
| 认证 | `/api/v1/auth` | 登录/登出/刷新Token/修改密码 |
| 用户 | `/api/v1/users` | 用户CRUD/状态修改/批量删除 |
| 角色 | `/api/v1/roles` | 角色CRUD/权限配置 |
| 内容 | `/api/v1/contents` | 内容CRUD/审核/批量审核 |
| 版权 | `/api/v1/copyrights` | 版权信息CRUD |
| 广告 | `/api/v1/advertisements` | 广告CRUD/批量删除 |
| 活动 | `/api/v1/activities` | 活动CRUD |
| 通用 | `/api/v1/common` | 枚举字典/健康检查 |

## 核心架构亮点

### 1. 四层分层架构
```
Routes → Controllers → Services → Models
```
- **路由层**: 定义HTTP端点，接入中间件
- **控制层**: 数据校验，请求响应处理
- **服务层**: 核心业务逻辑
- **模型层**: 数据库ORM映射

### 2. 前端组件化
- `QyDataTable`: 统一数据表格(分页/选择/空状态)
- `QyAuditDialog`: 内容审核弹窗(单条/批量)
- `QyContentPreview`: 内容详情预览
- `QyTableToolbar`: 表格操作栏(新增/刷新/批量)
- `QyUpload`: 文件上传组件
- `QyEmpty`: 空状态展示

### 3. 安全机制
- JWT双Token机制(Access + Refresh)
- Redis存储Token，支持主动登出
- 接口级权限控制(中间件校验)
- 路由级角色权限拦截
- API限流 + Helmet安全头
- 密码BCrypt加密存储

### 4. 性能优化
- 前端Vite构建分包优化
- 路由懒加载 + 过渡动画
- Axios请求去重 + 自动重试
- Redis缓存热点数据
- 数据库连接池 + 索引优化

## 业务编码规范

### 命名规范
- 后端接口: `GET /api/v1/contents` (复数名词)
- 文件命名: PascalCase组件 / camelCase工具
- 数据表: `sys_`系统表前缀, `biz_`业务表前缀

### 响应格式
```json
{
  "code": 0,
  "message": "操作成功",
  "data": {},
  "timestamp": 1700000000000
}
```

## License

MIT License
