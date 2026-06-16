# 程行智联 - 出行管理后台系统

## 项目简介

程行智联是一套完整的出行平台后台管理系统，聚焦高并发订单调度、运力管控、高频审核运维等核心场景，提供稳定可迭代的后台基础架构。

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript (严格模式)
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **HTTP请求**: Axios (二次封装)
- **图表**: ECharts + vue-echarts
- **工具库**: dayjs, js-cookie, nprogress

### 后端
- **框架**: Node.js + Express
- **数据库**: MySQL
- **ORM**: Sequelize
- **身份鉴权**: JWT
- **密码加密**: bcryptjs
- **安全防护**: helmet, express-rate-limit
- **日志**: morgan
- **环境配置**: dotenv

## 项目结构

```
annotation-project-20/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/              # API接口
│   │   ├── components/       # 通用组件
│   │   ├── enums/            # 业务枚举
│   │   ├── layout/           # 布局组件
│   │   ├── router/           # 路由配置
│   │   ├── store/            # 状态管理
│   │   ├── styles/           # 全局样式
│   │   ├── types/            # TypeScript类型定义
│   │   ├── utils/            # 工具函数
│   │   ├── views/            # 页面视图
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── ...
│
└── backend/                  # 后端项目
    ├── src/
    │   ├── config/           # 配置文件
    │   ├── controllers/      # 控制器层
    │   ├── middleware/       # 中间件
    │   ├── models/           # 数据模型
    │   ├── routes/           # 路由层
    │   └── utils/            # 工具函数
    ├── public/               # 静态资源
    ├── app.js                # 入口文件
    ├── package.json
    └── .env                  # 环境配置
```

## 功能模块

### 1. 工作台
- 数据概览统计卡片
- 订单趋势图表
- 运力类型分布
- 最新订单列表
- 待办事项提醒

### 2. 订单管理
- 订单列表（分页、搜索、筛选）
- 订单详情
- 订单调度
- 订单取消
- 批量操作

### 3. 司机管理
- 司机列表
- 司机资质审核
- 司机状态管理
- 司机详情

### 4. 车辆管理
- 车辆列表
- 车辆审核
- 车辆状态管理

### 5. 乘客管理
- 乘客列表
- 乘客详情
- 乘客状态管理

### 6. 运力管控
- 运力监控（实时运力分布）
- 运力类型管理
- 热门区域供需分析

### 7. 财务管理
- 对账流水
- 结算管理
- 财务统计

### 8. 系统管理
- 用户管理
- 角色管理
- 菜单管理
- 权限控制

## 业务枚举

### 订单状态
- 1: 待接单
- 2: 已派单
- 3: 接驾中
- 4: 行程中
- 5: 已完成
- 6: 已取消
- 7: 已过期

### 司机状态
- 0: 离线
- 1: 在线
- 2: 接单中
- 3: 已封禁

### 运力类型
- 1: 快车
- 2: 专车
- 3: 豪华车
- 4: 拼车
- 5: 出租车

### 财务类型
- 1: 收入
- 2: 支出
- 3: 退款
- 4: 提现

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 5.7
- npm 或 yarn

### 数据库准备

创建 MySQL 数据库：

```sql
CREATE DATABASE cxzl_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 后端启动

1. 进入后端目录
```bash
cd backend
```

2. 修改环境配置（.env）
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cxzl_admin
```

3. 安装依赖
```bash
npm install
```

4. 初始化数据库（创建表和初始数据）
```bash
npm run init
```

5. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

后端服务将运行在 `http://localhost:3000`

### 前端启动

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

前端服务将运行在 `http://localhost:5173`

### 默认账号

- 用户名: `admin`
- 密码: `123456`

## API 接口规范

### 统一响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 分页响应格式

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/登录过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 代码规范

### 命名规范
- 文件夹: 小驼峰命名
- 组件文件: 大驼峰命名
- 变量/函数: 小驼峰命名
- 常量: 全大写下划线分隔

### 目录规范
- `src/api` - 所有API接口定义
- `src/components` - 通用可复用组件
- `src/views` - 页面级组件
- `src/store` - Pinia状态管理
- `src/utils` - 工具函数
- `src/enums` - 业务枚举定义
- `src/types` - TypeScript类型定义

## 安全特性

- JWT身份认证
- 密码bcrypt加密
- Helmet安全头
- 接口请求频率限制
- SQL注入防护（Sequelize参数化查询）
- CORS跨域配置
- XSS防护

## 开发说明

### 后端四层架构
- **路由层 (routes)**: 路由定义和请求分发
- **控制器层 (controllers)**: 业务逻辑处理
- **模型层 (models)**: 数据模型定义和数据库操作
- **中间件层 (middleware)**: 认证、错误处理等公共逻辑

### 前端架构
- 组件化开发
- 状态集中管理
- 路由权限控制
- 请求统一封装
- 响应式布局

## License

MIT
