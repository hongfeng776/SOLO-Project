# 智慧出行管理后台 - 项目规范

## 1. 技术栈标准

### 1.1 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.3+ | 核心框架 |
| Vite | 5.0+ | 构建工具 |
| Element Plus | 2.4+ | UI组件库 |
| Vue Router | 4.2+ | 路由管理 |
| Pinia | 2.1+ | 状态管理 |
| Axios | 1.6+ | HTTP客户端 |
| Sass | 1.69+ | CSS预处理器 |
| Day.js | 1.11+ | 日期处理 |

### 1.2 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 16+ | 运行环境 |
| Express | 4.18+ | Web框架 |
| MySQL | 8.0+ | 数据库 |
| Sequelize | 6.35+ | ORM框架 |
| JWT | 9.0+ | 身份认证 |
| bcryptjs | 2.4+ | 密码加密 |
| CORS | 2.8+ | 跨域处理 |

## 2. 目录结构规范

### 2.1 后端目录结构
```
backend/
├── config/              # 配置文件
│   └── db.js          # 数据库配置
├── controllers/         # 控制层（接口处理）
│   ├── BaseController.js
│   ├── AuthController.js
│   ├── UserController.js
│   └── ...
├── services/           # 业务逻辑层
│   ├── BaseService.js
│   ├── AuthService.js
│   ├── UserService.js
│   └── ...
├── models/             # 数据模型层
│   ├── User.js
│   ├── Role.js
│   └── ...
├── middleware/         # 中间件
│   ├── auth.js        # JWT认证
│   ├── errorHandler.js # 全局异常处理
│   └── pagination.js  # 分页处理
├── utils/              # 工具函数
│   ├── result.js      # 统一响应格式
│   ├── jwt.js         # JWT工具
│   ├── password.js    # 密码工具
│   └── error.js       # 自定义异常
├── routes/            # 路由层
│   └── index.js
├── scripts/           # 脚本文件
│   └── initDB.js      # 数据库初始化
├── app.js            # 应用入口
├── .env             # 环境变量
└── package.json
```

### 2.2 前端目录结构
```
frontend/
├── src/
│   ├── api/          # API接口封装
│   │   ├── auth.js
│   │   ├── user.js
│   │   └── index.js
│   ├── assets/       # 静态资源
│   ├── components/   # 通用组件
│   │   ├── ProTable/
│   │   ├── ProForm/
│   │   ├── SearchFilter/
│   │   ├── EmptyState/
│   │   └── BatchActionBar/
│   ├── layout/       # 布局组件
│   │   ├── Layout.vue
│   │   ├── Sidebar.vue
│   │   └── Header.vue
│   ├── router/       # 路由配置
│   │   └── index.js
│   ├── store/        # 状态管理
│   │   ├── index.js
│   │   └── modules/
│   ├── styles/       # 全局样式
│   │   ├── index.scss
│   │   └── variables.scss
│   ├── utils/        # 工具函数
│   │   ├── request.js
│   │   ├── storage.js
│   │   ├── enums.js
│   │   └── validate.js
│   ├── views/        # 页面组件
│   │   ├── Login.vue
│   │   ├── Dashboard.vue
│   │   ├── system/
│   │   ├── product/
│   │   └── ...
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js
├── .env.development
├── .env.production
└── package.json
```

## 3. 代码编写规范

### 3.1 命名规范

#### 后端命名
- 文件名：大驼峰（PascalCase）+ 后缀，如 `UserController.js`
- 类名：大驼峰，如 `class UserController`
- 方法名：小驼峰，如 `getUserList()`
- 变量名：小驼峰，如 `const userInfo`
- 常量名：全大写下划线分隔，如 `const JWT_SECRET`
- 数据库表名：小写复数，如 `users`、`orders`
- 数据库字段名：小驼峰，如 `userName`、`createdAt`

#### 前端命名
- 组件文件名：大驼峰，如 `UserList.vue`
- 组件名：大驼峰，如 `export default defineComponent({ name: 'UserList' })`
- 普通JS文件名：小驼峰，如 `userApi.js`
- 变量名：小驼峰，如 `const userList = ref([])`
- 常量名：全大写下划线分隔，如 `const MAX_PAGE_SIZE = 100`
- 事件名：kebab-case，如 `@update-model-value`

### 3.2 代码风格

#### 后端（JavaScript）
- 使用2空格缩进
- 字符串优先使用单引号
- 语句末尾不加分号（可选，保持一致）
- 注释使用 `// 单行注释` 和 `/** 多行注释 */`
- 每个文件末尾保留一个空行

#### 前端（Vue）
- `<template>` 使用2空格缩进
- `<script setup>` 使用2空格缩进
- CSS使用2空格缩进
- 组件标签使用自闭合：`<el-input />`
- props 定义必须指定类型和默认值

## 4. 业务枚举规范

### 4.1 订单状态 (OrderStatus)
| 值 | 标签 | 说明 |
|----|------|------|
| 1 | 待支付 | 订单创建未支付 |
| 2 | 已支付 | 支付成功 |
| 3 | 已完成 | 订单已完成 |
| 4 | 已取消 | 订单已取消 |
| 5 | 已退款 | 已申请退款 |

### 4.2 出行品类 (TravelCategory)
| 值 | 标签 | 说明 |
|----|------|------|
| 1 | 机票 | 国内/国际机票 |
| 2 | 酒店 | 酒店预订 |
| 3 | 租车 | 汽车租赁 |
| 4 | 文旅票务 | 景区门票、演出票等 |

### 4.3 审核状态 (AuditStatus)
| 值 | 标签 | 说明 |
|----|------|------|
| 1 | 待审核 | 提交审核中 |
| 2 | 已通过 | 审核通过 |
| 3 | 已拒绝 | 审核拒绝 |

### 4.4 通用状态 (CommonStatus)
| 值 | 标签 | 说明 |
|----|------|------|
| 1 | 启用 | 正常可用 |
| 0 | 禁用 | 已停用 |

### 4.5 时间格式规范
- 存储格式：`YYYY-MM-DD HH:mm:ss`
- 展示格式：
  - 完整时间：`YYYY-MM-DD HH:mm:ss`
  - 日期：`YYYY-MM-DD`
  - 年月：`YYYY-MM`
  - 时分：`HH:mm`

## 5. 接口规范

### 5.1 RESTful 接口规范
| 操作 | 方法 | 路径示例 | 说明 |
|------|------|----------|------|
| 列表查询 | GET | `/api/users?pageNum=1&pageSize=10` | 分页查询 |
| 详情查询 | GET | `/api/users/:id` | 根据ID查询 |
| 新增 | POST | `/api/users` | 创建资源 |
| 更新 | PUT | `/api/users/:id` | 更新资源 |
| 删除 | DELETE | `/api/users/:id` | 删除资源 |
| 批量删除 | DELETE | `/api/users/batch` | 批量删除 |

### 5.2 统一响应格式
```javascript
{
  code: 200,      // 状态码：200成功，400参数错误，401未认证，403无权限，404不存在，500服务器错误
  message: 'success',  // 提示信息
  data: any       // 返回数据
}
```

### 5.3 分页响应格式
```javascript
{
  code: 200,
  message: 'success',
  data: {
    list: [],      // 数据列表
    total: 100,    // 总条数
    pageNum: 1,    // 当前页码
    pageSize: 10,  // 每页条数
    totalPages: 10 // 总页数
  }
}
```

### 5.4 请求头规范
- 认证：`Authorization: Bearer <token>`
- 内容类型：`Content-Type: application/json`

## 6. 视觉风格规范

### 6.1 主题色
| 类型 | 色值 | 用途 |
|------|------|------|
| 主色调 | #1890ff | 品牌色、主要按钮 |
| 成功色 | #52c41a | 成功状态、通过 |
| 警告色 | #faad14 | 警告、待处理 |
| 危险色 | #ff4d4f | 删除、错误、拒绝 |
| 信息色 | #1890ff | 普通信息 |

### 6.2 布局规范
- 侧边栏宽度：220px（折叠后64px）
- 侧边栏背景：#001529
- 顶部栏高度：64px
- 内容区边距：24px
- 卡片圆角：4px
- 基础字号：14px

## 7. 权限规范

### 7.1 角色定义
| 角色编码 | 角色名称 | 权限范围 |
|----------|----------|----------|
| admin | 超级管理员 | 所有权限 |
| operator | 运营人员 | 订单、产品管理 |
| merchant | 商家 | 自有产品管理 |

### 7.2 权限控制
- 路由级：基于角色的路由访问控制
- 按钮级：基于权限标识的按钮显示控制
- 接口级：基于JWT的接口访问控制

## 8. 启动脚本

### 安装依赖
```bash
npm run install:all
```

### 启动开发环境
```bash
# 同时启动前后端
npm run dev

# 仅启动后端
npm run dev:backend

# 仅启动前端
npm run dev:frontend
```

### 初始化数据库
```bash
cd backend
npm run init:db
```

### 生产构建
```bash
npm run build
```

## 9. 默认账号

- 用户名：`admin`
- 密码：`123456`
