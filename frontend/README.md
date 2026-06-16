# 优才企招管理后台 - 前端

## 技术栈
- Vue 3 + TypeScript (严格模式)
- Vite 5
- Pinia (状态管理 + 持久化)
- Vue Router 4
- Element Plus
- Axios (二次封装)
- Day.js
- SCSS

## 项目结构
```
src/
├── api/              # API 接口
├── assets/           # 静态资源
├── components/       # 通用组件
├── constants/        # 常量枚举
├── layout/           # 布局组件
├── router/           # 路由配置
├── store/            # Pinia 状态管理
├── styles/           # 全局样式
├── utils/            # 工具函数
├── views/            # 页面组件
├── App.vue
└── main.ts
```

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 类型检查
```bash
npm run type-check
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 主要功能模块
- 登录认证
- 首页仪表板
- 企业管理
- 岗位管理
- 简历管理
- 面试管理
- 入职管理
- 系统管理（用户管理）

## 通用组件
- PageContainer - 页面容器
- SearchForm - 搜索表单
- ProTable - 高级表格
- ModalForm - 弹窗表单
- EmptyState - 空状态
