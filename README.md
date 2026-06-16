# 电商智慧管理后台

全链路电商运营管理平台，基于 Vue 3 + TypeScript + Node.js + Express + MySQL + Redis 技术栈。

## 技术架构

### 前端技术栈
- **框架**: Vue 3 + TypeScript (严格模式)
- **构建工具**: Vite 5
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP 请求**: Axios (二次封装)
- **图表**: ECharts
- **样式**: SCSS

### 后端技术栈
- **运行时**: Node.js
- **框架**: Express
- **语言**: TypeScript
- **数据库**: MySQL 8.0 + Sequelize ORM
- **缓存**: Redis
- **认证**: JWT (双Token机制)
- **安全**: bcryptjs (密码加密), helmet, cors
- **日志**: morgan

## 项目结构

```
annotation-project-17/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── api/                 # API接口定义
│   │   ├── components/          # 通用组件
│   │   │   ├── ProTable/        # 高级表格组件
│   │   │   ├── FormDialog/      # 表单弹窗组件
│   │   │   └── EmptyState/      # 空状态组件
│   │   ├── layouts/             # 布局组件
│   │   ├── router/              # 路由配置
│   │   ├── stores/              # Pinia状态管理
│   │   ├── styles/              # 全局样式
│   │   ├── types/               # TypeScript类型定义
│   │   ├── utils/               # 工具函数
│   │   ├── views/               # 页面视图
│   │   │   ├── dashboard/       # 数据概览
│   │   │   ├── goods/           # 商品管理
│   │   │   ├── order/           # 订单管理
│   │   │   ├── user/            # 用户管理
│   │   │   ├── marketing/       # 营销管理
│   │   │   ├── aftersale/       # 售后管理
│   │   │   ├── merchant/        # 商家管理
│   │   │   ├── system/          # 系统设置
│   │   │   ├── login/           # 登录页
│   │   │   └── error/           # 错误页
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── backend/                     # 后端项目
    ├── src/
    │   ├── config/              # 配置文件
    │   │   ├── index.ts         # 统一配置
    │   │   ├── database.ts      # 数据库配置
    │   │   └── redis.ts         # Redis配置
    │   ├── controllers/         # 控制层 (HTTP请求处理)
    │   │   ├── AuthController.ts
    │   │   ├── GoodsController.ts
    │   │   ├── OrderController.ts
    │   │   ├── UserController.ts
    │   │   ├── MarketingController.ts
    │   │   ├── AfterSaleController.ts
    │   │   └── MerchantController.ts
    │   ├── services/            # 业务逻辑层
    │   │   ├── AuthService.ts
    │   │   ├── GoodsService.ts
    │   │   ├── OrderService.ts
    │   │   ├── UserService.ts
    │   │   ├── MarketingService.ts
    │   │   ├── AfterSaleService.ts
    │   │   └── MerchantService.ts
    │   ├── models/              # 数据模型层 (Sequelize)
    │   │   ├── Admin.ts
    │   │   ├── User.ts
    │   │   ├── Goods.ts
    │   │   ├── Order.ts
    │   │   ├── Marketing.ts
    │   │   ├── AfterSale.ts
    │   │   └── Merchant.ts
    │   ├── dao/                 # 数据访问层
    │   │   ├── BaseDao.ts       # 基础DAO
    │   │   ├── AdminDao.ts
    │   │   ├── UserDao.ts
    │   │   ├── GoodsDao.ts
    │   │   ├── OrderDao.ts
    │   │   ├── MarketingDao.ts
    │   │   ├── AfterSaleDao.ts
    │   │   └── MerchantDao.ts
    │   ├── middlewares/         # 中间件
    │   │   ├── auth.ts          # JWT认证中间件
    │   │   ├── errorHandler.ts  # 全局异常处理
    │   │   └── logger.ts        # 请求日志
    │   ├── utils/               # 工具函数
    │   │   ├── response.ts      # 统一响应格式
    │   │   ├── jwt.ts           # JWT工具
    │   │   ├── password.ts      # 密码加密
    │   │   ├── captcha.ts       # 验证码
    │   │   ├── cache.ts         # Redis缓存
    │   │   └── date.ts          # 日期工具
    │   ├── routes/              # 路由配置
    │   │   ├── index.ts
    │   │   ├── auth.ts
    │   │   ├── goods.ts
    │   │   ├── order.ts
    │   │   ├── user.ts
    │   │   ├── marketing.ts
    │   │   ├── aftersale.ts
    │   │   └── merchant.ts
    │   ├── types/               # TypeScript类型
    │   ├── database/            # 数据库脚本
    │   │   └── init.sql         # 初始化SQL
    │   └── app.ts               # 应用入口
    ├── package.json
    ├── tsconfig.json
    └── .env                     # 环境变量
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0

### 1. 数据库初始化

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS annotation_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 执行初始化脚本
source backend/src/database/init.sql
```

### 2. 后端启动

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 修改 .env 中的数据库和Redis配置

# 开发模式启动 (热重载)
npm run dev

# 构建生产版本
npm run build

# 生产模式启动
npm start
```

后端服务启动后访问: http://localhost:3000

- 健康检查: http://localhost:3000/health
- API文档: http://localhost:3000/api/v1

### 3. 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

前端服务启动后访问: http://localhost:5173

### 默认账号
- 用户名: admin
- 密码: admin123

## API接口规范

### 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1717200000000
}
```

### 响应码说明
- `200` - 成功
- `400` - 请求参数错误
- `401` - 未认证或Token过期
- `403` - 无权限访问
- `404` - 资源不存在
- `500` - 服务器内部错误

### 分页请求参数
```typescript
interface PageParams {
  pageNum: number;    // 页码
  pageSize: number;   // 每页条数
}
```

### 分页响应格式
```typescript
interface PageResult<T> {
  list: T[];          // 数据列表
  total: number;      // 总条数
  pageNum: number;    // 当前页码
  pageSize: number;   // 每页条数
}
```

## API接口列表

### 认证模块 (无需认证)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/auth/captcha` | 获取验证码 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refreshToken` | 刷新Token |

### 认证模块 (需要认证)
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/logout` | 用户登出 |
| GET | `/api/v1/auth/userInfo` | 获取用户信息 |

### 商品模块 (需要认证)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/goods/list` | 分页查询商品列表 |
| GET | `/api/v1/goods/:id` | 获取商品详情 |
| POST | `/api/v1/goods/create` | 创建商品 |
| PUT | `/api/v1/goods/:id` | 更新商品 |
| DELETE | `/api/v1/goods/:id` | 删除商品 |
| POST | `/api/v1/goods/batchDelete` | 批量删除商品 |
| PUT | `/api/v1/goods/:id/status` | 更新商品状态 |

### 订单模块 (需要认证)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/order/list` | 分页查询订单列表 |
| GET | `/api/v1/order/:id` | 获取订单详情 |
| POST | `/api/v1/order/create` | 创建订单 |
| PUT | `/api/v1/order/:id` | 更新订单 |
| DELETE | `/api/v1/order/:id` | 删除订单 |
| POST | `/api/v1/order/batchDelete` | 批量删除订单 |
| PUT | `/api/v1/order/:id/status` | 更新订单状态 |

### 用户模块 (需要认证)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/user/list` | 分页查询用户列表 |
| GET | `/api/v1/user/:id` | 获取用户详情 |
| POST | `/api/v1/user/create` | 创建用户 |
| PUT | `/api/v1/user/:id` | 更新用户 |
| DELETE | `/api/v1/user/:id` | 删除用户 |
| POST | `/api/v1/user/batchDelete` | 批量删除用户 |
| PUT | `/api/v1/user/:id/status` | 更新用户状态 |

### 营销模块 (需要认证)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/marketing/list` | 分页查询营销列表 |
| GET | `/api/v1/marketing/:id` | 获取营销详情 |
| POST | `/api/v1/marketing/create` | 创建营销活动 |
| PUT | `/api/v1/marketing/:id` | 更新营销活动 |
| DELETE | `/api/v1/marketing/:id` | 删除营销活动 |
| POST | `/api/v1/marketing/batchDelete` | 批量删除营销活动 |
| PUT | `/api/v1/marketing/:id/status` | 更新营销状态 |

### 售后模块 (需要认证)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/aftersale/list` | 分页查询售后列表 |
| GET | `/api/v1/aftersale/:id` | 获取售后详情 |
| POST | `/api/v1/aftersale/create` | 创建售后申请 |
| PUT | `/api/v1/aftersale/:id` | 更新售后申请 |
| DELETE | `/api/v1/aftersale/:id` | 删除售后申请 |
| POST | `/api/v1/aftersale/batchDelete` | 批量删除售后申请 |
| PUT | `/api/v1/aftersale/:id/status` | 更新售后状态 |

### 商家模块 (需要认证)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/merchant/list` | 分页查询商家列表 |
| GET | `/api/v1/merchant/:id` | 获取商家详情 |
| POST | `/api/v1/merchant/create` | 创建商家 |
| PUT | `/api/v1/merchant/:id` | 更新商家 |
| DELETE | `/api/v1/merchant/:id` | 删除商家 |
| POST | `/api/v1/merchant/batchDelete` | 批量删除商家 |
| PUT | `/api/v1/merchant/:id/status` | 更新商家状态 |

## 全局规范

### 命名规范
- **文件命名**: kebab-case (如: user-list.vue)
- **组件命名**: PascalCase (如: ProTable)
- **变量命名**: camelCase (如: userName)
- **常量命名**: UPPER_SNAKE_CASE (如: MAX_RETRY_COUNT)
- **接口命名**: PascalCase + I前缀 (如: IUserInfo)
- **TypeScript 类型**: PascalCase (如: UserInfo)

### 电商业务枚举
- **订单状态**: 待付款(1)、已付款(2)、已发货(3)、已完成(4)、已取消(5)、退款中(6)、已退款(7)
- **物流状态**: 未发货(0)、已发货(1)、运输中(2)、已送达(3)、已签收(4)
- **商品状态**: 下架(0)、上架(1)、已删除(2)
- **用户状态**: 禁用(0)、启用(1)
- **售后状态**: 待处理(1)、处理中(2)、已完成(3)、已拒绝(4)、已取消(5)
- **营销类型**: 优惠券(1)、满减活动(2)、秒杀活动(3)、拼团活动(4)
- **商家状态**: 待审核(0)、已入驻(1)、已拒绝(2)、已禁用(3)

### 金额精度
- 数据库存储: DECIMAL(10, 2)
- 前端展示: 保留2位小数，自动添加货币符号 ¥
- 计算规则: 使用 BigDecimal 或 Number.toFixed(2) 确保精度

### 时间格式
- 存储格式: DATETIME (YYYY-MM-DD HH:mm:ss)
- 展示格式: 
  - 完整时间: YYYY-MM-DD HH:mm:ss
  - 日期: YYYY-MM-DD
  - 相对时间: 刚刚、X分钟前、X小时前、X天前

## 核心功能

### 前端核心能力
1. **Axios二次封装**: Token自动携带、请求拦截、超时重试(2次)、全局异常统一提示
2. **通用组件**: 
   - ProTable: 智能搜索、分页、批量操作、自定义列渲染
   - FormDialog: 新增/编辑弹窗、表单验证
   - EmptyState: 空状态提示
3. **权限系统**: JWT认证、路由拦截、角色权限管控
4. **全局规范**: 统一视觉主题、页面布局、按钮弹窗交互样式

### 后端核心能力
1. **四层分层架构**: Controller → Service → DAO → Model
2. **RESTful接口规范**: 统一HTTP方法、路径命名、响应格式
3. **全局异常捕获**: 统一错误处理、错误码规范
4. **JWT双Token机制**: Access Token(24h) + Refresh Token(7d)
5. **Redis缓存**: 验证码、Token、热点数据缓存
6. **数据库连接池**: Sequelize ORM + 连接池管理

## 开发命令

### 前端命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run type-check   # TypeScript类型检查
npm run lint         # ESLint代码检查
```

### 后端命令
```bash
npm run dev          # 开发模式 (热重载)
npm run build        # 构建生产版本
npm start            # 启动生产服务器
npm run watch        # TypeScript监听模式
npm run lint         # ESLint代码检查
```

## 部署说明

### 前端部署
1. 执行 `npm run build` 生成 dist 目录
2. 将 dist 目录部署到 Nginx 或其他静态文件服务器
3. 配置反向代理 `/api` 到后端服务

### 后端部署
1. 执行 `npm run build` 生成 dist 目录
2. 配置环境变量 .env
3. 使用 PM2 启动: `pm2 start dist/app.js --name ecommerce-admin`
4. 配置 Nginx 反向代理到 3000 端口

## License

MIT
