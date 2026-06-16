# 优才企招管理后台 - 后端服务

## 技术栈
- Node.js + Express
- TypeScript
- MySQL + Sequelize ORM
- JWT 认证

## 项目结构
```
src/
├── config/          # 配置文件
├── constants/       # 常量枚举
├── controllers/     # 控制层
├── dao/            # 数据访问层
├── middleware/     # 中间件
├── models/         # 数据模型
├── routes/         # 路由
├── services/       # 业务逻辑层
├── utils/          # 工具函数
├── scripts/        # 脚本
└── app.ts          # 入口文件
```

## 快速开始

### 安装依赖
```bash
npm install
```

### 配置环境变量
复制 `.env` 文件并修改数据库配置

### 初始化数据库
```bash
npm run init-db
```

### 开发模式
```bash
npm run dev
```

### 构建
```bash
npm run build
```

### 生产模式
```bash
npm start
```

## 默认账号
- 管理员: admin / 123456
- HR专员: hr001 / 123456
