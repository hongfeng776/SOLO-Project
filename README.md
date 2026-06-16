# 优才企招管理后台

企业级招聘管理后台系统，基于 Vue 3 + Node.js + MySQL 全栈技术栈打造，助力企业HR实现轻量化、高效率的招聘运维管理。

## 技术架构

### 前端
- **框架**: Vue 3 + TypeScript (严格模式)
- **构建工具**: Vite 5
- **状态管理**: Pinia + 持久化插件
- **路由**: Vue Router 4
- **UI组件库**: Element Plus
- **HTTP请求**: Axios (二次封装)
- **样式**: SCSS

### 后端
- **框架**: Express.js
- **语言**: TypeScript
- **ORM**: Sequelize
- **数据库**: MySQL
- **认证**: JWT
- **架构**: 四层分层架构 (Controller / Service / DAO / Model)

## 项目结构
```
annotation-project-13/
├── frontend/       # 前端项目
├── backend/        # 后端项目
└── package.json    # 根目录脚本
```

## 快速开始

### 环境要求
- Node.js >= 16
- MySQL >= 5.7

### 1. 安装依赖
```bash
npm run install:all
```

### 2. 配置数据库
修改 `backend/.env` 文件中的数据库配置

### 3. 初始化数据库
```bash
npm run init:db
```

### 4. 启动开发服务
```bash
npm run dev
```

- 前端地址: http://localhost:5173
- 后端地址: http://localhost:3000

### 默认账号
- 超级管理员: admin / 123456
- HR专员: hr001 / 123456

## 功能模块

### 企业管理
- 企业信息CRUD
- 企业状态管理
- 批量操作

### 岗位管理
- 岗位信息CRUD
- 岗位发布/关闭
- 多条件筛选

### 简历管理
- 简历信息CRUD
- 简历状态流转
- 简历详情展示

### 面试管理
- 面试安排CRUD
- 面试阶段管理
- 面试评价记录

### 入职管理
- 入职流程管理
- 入职状态跟踪
- Offer信息管理

### 系统管理
- 用户管理
- 角色权限
- 账号状态

## 后端架构规范

### 四层分层架构
1. **Controller 控制层** - 接收请求，参数校验，响应返回
2. **Service 业务层** - 核心业务逻辑处理
3. **DAO 数据访问层** - 数据库操作封装
4. **Model 模型层** - 数据模型定义

### 统一响应格式
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": 1234567890
}
```

### RESTful 接口规范
- GET - 查询
- POST - 新增
- PUT - 更新
- DELETE - 删除

## 前端规范

### 组件命名
- 大驼峰命名 (PascalCase)
- 通用组件放在 `components/` 目录
- 页面组件放在 `views/` 目录

### 接口调用
- 使用 `@/api/` 目录下的封装函数
- 统一错误处理
- 自动携带 Token

### 状态管理
- 使用 Pinia 进行状态管理
- 用户信息等持久化存储
