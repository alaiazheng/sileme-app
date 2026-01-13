# 死了么 - 完整项目概览

一个现代化的生活状态提醒应用，包含完整的前端和后端实现。

## 🎯 项目简介

"死了么"是一个简约而功能完整的生活提醒应用，帮助用户养成良好的生活习惯。项目包含：

- **前端**: React + Vite + Tailwind CSS 构建的响应式Web应用
- **后端**: Node.js + Express + MongoDB 构建的RESTful API服务

## 📁 项目结构

```
20260113143431/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── context/        # 状态管理
│   │   ├── hooks/          # 自定义Hook
│   │   └── utils/          # 工具函数
│   ├── public/             # 静态资源
│   ├── package.json        # 前端依赖
│   └── vite.config.js      # Vite配置
│
├── backend/                 # 后端API服务
│   ├── config/             # 配置文件
│   ├── middleware/         # 中间件
│   ├── models/            # 数据模型
│   ├── routes/            # API路由
│   ├── services/          # 业务服务
│   ├── utils/             # 工具函数
│   ├── package.json       # 后端依赖
│   ├── server.js          # 服务器入口
│   └── docker-compose.yml # Docker配置
│
└── PROJECT_OVERVIEW.md     # 项目概览（本文件）
```

## 🚀 快速开始

### 前端应用

1. **启动前端开发服务器**
```bash
cd frontend
npm install
npm run dev
```

2. **访问应用**
- 开发地址: http://localhost:3001
- 支持热重载和实时预览

### 后端服务

1. **启动后端API服务**
```bash
cd backend
npm install
npm run dev
```

2. **API服务**
- API地址: http://localhost:5000
- 文档地址: http://localhost:5000/api/docs

### 完整部署

使用Docker Compose一键部署：
```bash
cd backend
docker-compose up -d
```

## ✨ 核心功能

### 前端功能

#### 🏠 首页
- 欢迎界面和应用介绍
- 统计数据展示（总打卡、连续天数、最长记录）
- 功能模块快速导航
- 最近打卡记录展示

#### ✅ 一键打卡
- 每日打卡功能
- 心情状态选择（很好、开心、一般、不好）
- 备注信息添加
- 实时时间显示
- 打卡状态检查

#### 🔔 紧急通知
- 多类型通知支持（普通、重要、紧急、成功）
- 通知创建和管理
- 已读/未读状态
- 通知统计信息

#### 🛡️ 隐私保护
- 数据统计展示
- 数据导出功能
- 数据导入功能
- 一键清除数据
- 隐私说明

#### ⚙️ 设置
- 用户信息管理
- 应用设置配置
- 紧急联系人管理
- 主题设置（预留）

### 后端功能

#### 🔐 用户认证
- JWT令牌认证
- 用户注册/登录
- 密码加密存储
- 令牌刷新机制

#### 📝 打卡系统
- 每日打卡记录
- 心情状态管理
- 地理位置记录（可选）
- 打卡统计分析
- 连续打卡计算

#### 🔔 通知系统
- 实时WebSocket推送
- 计划通知调度
- 多渠道通知支持
- 通知状态管理

#### 📊 数据统计
- 用户行为分析
- 打卡趋势统计
- 月度/年度报告
- 成就系统

#### 🛡️ 数据管理
- 完整数据导出
- 数据导入验证
- 隐私保护机制
- 数据清理功能

## 🛠️ 技术栈

### 前端技术

- **框架**: React 18
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **路由**: React Router
- **状态管理**: Context API + useReducer
- **图标**: Lucide React
- **日期处理**: date-fns
- **PWA**: Service Worker + Web App Manifest

### 后端技术

- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: MongoDB + Mongoose
- **认证**: JWT + bcryptjs
- **实时通信**: Socket.IO
- **验证**: express-validator
- **日志**: Winston
- **安全**: Helmet + CORS + Rate Limiting
- **任务调度**: node-cron

### 部署技术

- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **进程管理**: PM2（可选）
- **监控**: 健康检查 + 日志监控

## 🎨 设计特色

### UI/UX设计

- **简约风格**: 清新的绿色主题，符合原版应用风格
- **响应式设计**: 完美适配手机、平板、桌面设备
- **移动优先**: 专为移动端优化的交互体验
- **无障碍**: 支持键盘导航和屏幕阅读器

### 用户体验

- **一键操作**: 简化的打卡流程
- **实时反馈**: 即时的操作反馈和状态更新
- **离线支持**: PWA技术，支持离线使用
- **数据安全**: 本地存储优先，用户完全控制数据

## 🔒 安全特性

### 前端安全

- **数据本地化**: 优先使用本地存储
- **输入验证**: 客户端数据验证
- **XSS防护**: 安全的数据渲染
- **HTTPS**: 生产环境强制HTTPS

### 后端安全

- **认证授权**: JWT令牌 + 权限控制
- **数据加密**: bcrypt密码加密
- **速率限制**: API调用频率限制
- **安全头**: Helmet安全中间件
- **输入验证**: express-validator数据验证
- **SQL注入防护**: Mongoose ODM保护

## 📱 移动端优化

### 响应式设计

- **断点设计**: 适配各种屏幕尺寸
- **触摸优化**: 适合触摸操作的按钮大小
- **手势支持**: 滑动、点击等手势操作
- **性能优化**: 针对移动设备的性能优化

### PWA特性

- **离线缓存**: Service Worker缓存策略
- **安装提示**: 添加到主屏幕功能
- **推送通知**: Web Push API支持
- **后台同步**: 离线数据同步

## 🚀 部署方案

### 开发环境

```bash
# 前端开发
cd frontend && npm run dev

# 后端开发
cd backend && npm run dev
```

### 生产环境

#### Docker部署（推荐）

```bash
cd backend
docker-compose up -d
```

#### 传统部署

```bash
# 构建前端
cd frontend && npm run build

# 启动后端
cd backend && npm start
```

### 云平台部署

- **Vercel**: 前端静态部署
- **Railway**: 全栈应用部署
- **AWS/阿里云**: 容器化部署
- **Heroku**: 快速原型部署

## 📊 性能指标

### 前端性能

- **首屏加载**: < 2秒
- **交互响应**: < 100ms
- **包大小**: < 500KB (gzipped)
- **Lighthouse评分**: 90+

### 后端性能

- **API响应时间**: < 200ms
- **并发处理**: 1000+ 请求/秒
- **内存使用**: < 512MB
- **CPU使用**: < 50%

## 🔮 未来规划

### 短期计划

- [ ] 深色主题支持
- [ ] 多语言国际化
- [ ] 数据可视化图表
- [ ] 社交分享功能

### 长期计划

- [ ] 移动端原生应用
- [ ] 桌面端Electron应用
- [ ] 微信小程序版本
- [ ] 团队协作功能

## 🤝 贡献指南

### 开发流程

1. **Fork项目** 到个人仓库
2. **创建分支** `git checkout -b feature/new-feature`
3. **提交更改** `git commit -m 'Add new feature'`
4. **推送分支** `git push origin feature/new-feature`
5. **创建PR** 提交Pull Request

### 代码规范

- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Conventional Commits**: 提交信息规范
- **Husky**: Git钩子自动化

### 测试要求

- **单元测试**: 核心功能测试覆盖
- **集成测试**: API接口测试
- **E2E测试**: 用户流程测试
- **性能测试**: 负载和压力测试

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- **项目地址**: [GitHub Repository]
- **问题反馈**: [GitHub Issues]
- **讨论交流**: [GitHub Discussions]
- **邮箱**: developer@example.com

---

**死了么** - 让生活更有规律，让习惯更加持久 🌱