# 影创智修后台管理系统

影像内容运营平台后台管理系统，基于 Vue 3 + Node.js 技术栈构建。

## 项目简介

影创智修是一个面向影像素材运维、内容审核的高交互轻量化后台管理系统。

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia (持久化插件)
- **路由**: Vue Router 4
- **UI 组件库**: Element Plus
- **HTTP 请求**: Axios (二次封装)
- **样式**: SCSS

### 后端
- **运行时**: Node.js
- **框架**: Express
- **ORM**: Sequelize
- **数据库**: MySQL
- **鉴权**: JWT
- **密码加密**: bcryptjs

## 项目结构

```
.
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/              # API 接口
│   │   ├── assets/           # 静态资源
│   │   ├── components/       # 组件
│   │   │   └── business/     # 业务复用组件
│   │   ├── constants/        # 常量定义
│   │   ├── layout/           # 布局组件
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── styles/           # 全局样式
│   │   ├── types/            # TypeScript 类型定义
│   │   ├── utils/            # 工具函数
│   │   └── views/            # 页面视图
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── config/           # 配置文件
│   │   ├── controllers/      # 控制器层
│   │   ├── middlewares/      # 中间件
│   │   ├── models/           # 数据模型层
│   │   ├── routes/           # 路由层
│   │   ├── services/         # 业务逻辑层
│   │   ├── scripts/          # 脚本
│   │   ├── utils/            # 工具函数
│   │   └── app.js            # 入口文件
│   ├── .env
│   └── package.json
└── package.json              # 根目录脚本
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 5.7
- npm >= 8.0.0

### 1. 安装依赖

```bash
# 方式一：根目录一键安装
npm run install:all

# 方式二：分别安装
cd frontend && npm install
cd ../backend && npm install
```

### 2. 配置数据库

修改 `backend/.env` 文件中的数据库配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=yingchuang_admin
DB_USER=root
DB_PASSWORD=your_password
```

### 3. 初始化数据库

```bash
npm run init:db
```

> 该命令会创建数据库表结构和初始数据，包括：
> - 超级管理员账号: admin / admin123456
> - 审核员账号: auditor / auditor123
> - 运营员账号: operator / operator123
> - 示例分类、资源、模板、会员数据

### 4. 启动项目

```bash
# 同时启动前后端 (需要安装 concurrently)
npm run dev

# 分别启动
npm run dev:frontend   # 前端 http://localhost:5173
npm run dev:backend    # 后端 http://localhost:3000
```

## 功能模块

### 1. 数据概览
- 核心数据统计卡片
- 资源增长趋势
- 资源状态分布
- 最新资源 / 最近审核

### 2. 影像资源
- 图片资源管理
- 视频资源管理
- 资源分类管理
- 批量操作（删除、上下架）
- 资源预览

### 3. 特效模板
- 模板列表管理
- 模板分类
- 价格设置

### 4. 内容审核
- 待审核列表
- 审核面板
- 审核记录
- 批量审核

### 5. 用户管理
- 平台用户管理
- 会员管理
- 角色权限
- 状态管理

### 6. 系统设置
- 基本设置
- 上传设置
- 审核设置

## 角色权限

| 角色 | 权限说明 |
|------|---------|
| super_admin | 超级管理员，拥有所有权限 |
| admin | 管理员，用户管理、审核管理、系统设置 |
| auditor | 审核员，内容审核相关权限 |
| operator | 运营员，资源、模板管理权限 |
| member | 会员，仅前台访问权限 |

## 业务规范

### 资源状态
- `draft` - 草稿
- `pending` - 待审核
- `approved` - 审核通过
- `rejected` - 审核拒绝
- `published` - 已发布
- `offline` - 已下架

### 文件规格
- 图片: JPG/PNG/GIF/WebP，最大 10MB
- 视频: MP4/AVI/MOV，最大 500MB

### 审核层级
- 一级审核
- 二级审核
- 三级审核

## 开发规范

### 命名规范
- 组件名: PascalCase (e.g. `DataTable.vue`)
- 页面名: 小写+横杠 (e.g. `image-resources.vue`) - 本项目使用小写目录
- API 接口: 动词+名词 (e.g. `getResourceList`)
- 常量: 全大写+下划线 (e.g. `IMAGE_MAX_SIZE`)

### 代码风格
- TypeScript 严格模式
- 组件使用 `<script setup>` 语法
- 样式使用 SCSS + BEM 命名

## License

ISC
