# 智慧出行管理后台

## 项目简介

基于 Vue 3 + Node.js + Express + MySQL 的全栈智慧出行管理后台系统，支持机票、酒店、租车、文旅票务等多品类出行业务的统一管理。

## 技术栈

### 前端
- Vue 3 + Composition API
- Vite 4.x
- Element Plus
- Vue Router 4.x
- Pinia
- Axios

### 后端
- Node.js
- Express 4.x
- MySQL 8.x
- Sequelize ORM
- JWT 认证

## 项目结构

```
├── frontend/          # 前端项目
├── backend/         # 后端项目
├── package.json   # 根项目配置
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 16.x
- MySQL >= 8.x

### 安装依赖

```bash
npm run install:all
```

### 开发环境启动

```bash
# 同时启动前后端
npm run dev

# 仅启动后端
npm run dev:backend

# 仅启动前端
npm run dev:frontend
```

### 生产环境构建

```bash
npm run build
```

## 默认账号

- 用户名：admin
- 密码：123456
