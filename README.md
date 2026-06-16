# CCB 全渠道智慧业务运营管理后台

建行全渠道智慧业务运营管理后台系统，提供业务管理、风控审核、系统管理等一体化功能。

## 项目简介

本项目是一个金融级别的业务运营管理系统，包含以下核心模块：

- **运营概览**：系统数据统计与可视化展示
- **业务管理**：渠道业务、交易流水、产品管理
- **风控审核**：待审核、审核历史、风控规则配置
- **系统管理**：用户管理、角色管理、权限管理、机构管理、操作日志

## 技术栈

### 前端
- **框架**：Vue 3 + TypeScript
- **构建工具**：Vite 5
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **UI 组件库**：Element Plus
- **图表库**：ECharts 5
- **HTTP 客户端**：Axios
- **进度条**：NProgress

### 后端
- **框架**：Express 4 + TypeScript
- **ORM**：Sequelize 6 + sequelize-typescript
- **数据库**：MySQL
- **认证**：JWT (jsonwebtoken) + bcryptjs
- **参数校验**：Joi
- **工具库**：Lodash、Day.js、UUID

## 项目结构

```
ccb-admin-monorepo/
├── frontend/              # 前端项目
│   ├── src/
│   │   ├── api/           # API 接口定义
│   │   ├── components/    # 公共组件
│   │   ├── layouts/       # 布局组件
│   │   ├── router/        # 路由配置
│   │   ├── store/         # Pinia 状态管理
│   │   ├── styles/        # 全局样式
│   │   ├── types/         # TypeScript 类型定义
│   │   ├── utils/         # 工具函数
│   │   ├── views/         # 页面视图
│   │   └── main.ts        # 入口文件
│   └── package.json
├── backend/               # 后端项目
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── controllers/   # 控制器
│   │   ├── database/      # 数据库相关（含种子数据）
│   │   ├── middlewares/   # 中间件
│   │   ├── models/        # 数据模型
│   │   ├── repositories/  # 数据访问层
│   │   ├── routes/        # 路由定义
│   │   ├── services/      # 业务逻辑层
│   │   ├── types/         # TypeScript 类型
│   │   ├── utils/         # 工具函数
│   │   └── server.ts      # 入口文件
│   └── package.json
└── package.json           # Monorepo 根配置
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- MySQL >= 5.7 或 >= 8.0
- npm >= 9.0.0

### 1. 克隆项目

```bash
git clone <repository-url>
cd annotation-project-19
```

### 2. 安装依赖

在项目根目录执行：

```bash
npm run install:all
```

或分别安装：

```bash
# 安装根目录依赖（用于 concurrently）
npm install

# 安装前端依赖
cd frontend && npm install

# 安装后端依赖
cd ../backend && npm install
```

### 3. 配置数据库

编辑 `backend/.env.development` 文件，配置数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ccb_admin
DB_DIALECT=mysql
```

### 4. 初始化数据库和种子数据

```bash
npm run seed
```

此命令将自动创建数据表并插入初始数据（机构、角色、权限、用户、审核规则等）。

### 5. 启动开发服务

**同时启动前后端（推荐）：**

```bash
npm run dev
```

**分别启动：**

```bash
# 仅启动前端（端口 5173）
npm run dev:frontend

# 仅启动后端（端口 3000）
npm run dev:backend
```

### 6. 访问系统

前端地址：http://localhost:5173

后端 API 地址：http://localhost:3000/api

## 生产构建

```bash
# 同时构建前后端
npm run build

# 分别构建
npm run build:frontend
npm run build:backend
```

构建完成后，启动生产服务：

```bash
npm run start
```

## 默认账号密码

执行数据库种子数据后，可使用以下账号登录：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 超级管理员 | 拥有所有权限，可访问所有模块 |
| manager | 123456 | 机构管理员 | 管理本机构及下属机构用户和业务 |
| operator | 123456 | 业务操作员 | 经办业务操作，提交审核 |
| auditor | 123456 | 审核员 | 负责风控审核流程 |

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run install:all` | 安装前后端所有依赖 |
| `npm run dev` | 同时启动前后端开发服务 |
| `npm run dev:frontend` | 仅启动前端开发服务 |
| `npm run dev:backend` | 仅启动后端开发服务 |
| `npm run build` | 构建前后端生产版本 |
| `npm run build:frontend` | 仅构建前端 |
| `npm run build:backend` | 仅构建后端 |
| `npm run seed` | 初始化数据库并填充种子数据 |
| `npm run start` | 启动后端生产服务 |

## 核心特性

- 基于 RBAC 的权限控制模型
- 动态路由与菜单权限
- 标签页（TagsView）持久化
- 风控审核流程管理
- 操作日志记录
- 请求签名与防重放
- 统一异常处理
- 数据权限范围控制
