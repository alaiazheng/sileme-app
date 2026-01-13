# 死了么 - 后端API服务

基于Node.js + Express + MongoDB构建的RESTful API服务，为"死了么"应用提供完整的后端支持。

## 功能特性

### 🔐 用户认证
- JWT令牌认证
- 用户注册/登录
- 密码加密存储
- 令牌刷新机制

### 📝 打卡系统
- 每日打卡记录
- 心情状态选择
- 地理位置记录
- 打卡统计分析
- 连续打卡计算

### 🔔 通知系统
- 多类型通知支持
- 实时WebSocket推送
- 计划通知调度
- 通知状态管理

### 📊 数据统计
- 用户行为分析
- 打卡趋势统计
- 月度/年度报告
- 成就系统

### 🛡️ 数据安全
- 数据导出/导入
- 隐私保护机制
- 速率限制
- 安全中间件

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: MongoDB + Mongoose
- **认证**: JWT + bcryptjs
- **实时通信**: Socket.IO
- **日志**: Winston
- **验证**: express-validator
- **安全**: Helmet + CORS
- **部署**: Docker + Docker Compose

## 快速开始

### 环境要求

- Node.js 18+
- MongoDB 5.0+
- npm 或 yarn

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd backend
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

4. **启动MongoDB**
```bash
# 使用Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# 或使用本地安装的MongoDB
mongod
```

5. **启动开发服务器**
```bash
npm run dev
```

服务器将在 http://localhost:5000 启动

### Docker部署

1. **使用Docker Compose**
```bash
docker-compose up -d
```

2. **查看服务状态**
```bash
docker-compose ps
```

3. **查看日志**
```bash
docker-compose logs -f api
```

## API文档

### 基础信息

- **Base URL**: `http://localhost:5000/api`
- **认证方式**: Bearer Token
- **数据格式**: JSON

### 主要接口

#### 认证相关
```
POST /auth/register     # 用户注册
POST /auth/login        # 用户登录
GET  /auth/me          # 获取当前用户信息
POST /auth/refresh     # 刷新令牌
POST /auth/logout      # 用户登出
```

#### 用户管理
```
PUT  /users/profile              # 更新用户资料
PUT  /users/settings             # 更新用户设置
POST /users/emergency-contacts   # 添加紧急联系人
GET  /users/stats               # 获取用户统计
```

#### 打卡系统
```
POST /checkins                    # 创建打卡记录
GET  /checkins                   # 获取打卡记录列表
GET  /checkins/today/status      # 检查今日打卡状态
GET  /checkins/stats             # 获取打卡统计
GET  /checkins/calendar/:year/:month  # 获取日历数据
```

#### 通知系统
```
POST /notifications              # 创建通知
GET  /notifications             # 获取通知列表
PUT  /notifications/:id/read    # 标记通知已读
PUT  /notifications/read-all    # 批量标记已读
DELETE /notifications/:id       # 删除通知
```

#### 数据管理
```
GET  /data/export               # 导出数据
POST /data/import               # 导入数据
POST /data/validate             # 验证数据格式
DELETE /data/clear-all          # 清除所有数据
```

### 响应格式

成功响应：
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 响应数据
  }
}
```

错误响应：
```json
{
  "success": false,
  "message": "错误信息",
  "errors": [
    // 详细错误信息（可选）
  ]
}
```

## 数据库设计

### 用户模型 (User)
```javascript
{
  username: String,        // 用户名
  email: String,          // 邮箱
  password: String,       // 加密密码
  profile: {              // 个人资料
    nickname: String,
    bio: String,
    birthday: Date,
    gender: String
  },
  settings: {             // 用户设置
    notificationEnabled: Boolean,
    checkInReminder: Boolean,
    theme: String
  },
  stats: {               // 统计信息
    totalCheckIns: Number,
    currentStreak: Number,
    longestStreak: Number
  },
  emergencyContacts: []   // 紧急联系人
}
```

### 打卡模型 (CheckIn)
```javascript
{
  user: ObjectId,         // 用户ID
  date: Date,            // 打卡日期
  mood: String,          // 心情状态
  note: String,          // 备注
  location: {            // 位置信息
    coordinates: [Number],
    address: String
  },
  tags: [String],        // 标签
  isPublic: Boolean      // 是否公开
}
```

### 通知模型 (Notification)
```javascript
{
  user: ObjectId,        // 用户ID
  title: String,         // 标题
  message: String,       // 内容
  type: String,          // 类型
  priority: Number,      // 优先级
  isRead: Boolean,       // 是否已读
  scheduledFor: Date,    // 计划时间
  expiresAt: Date       // 过期时间
}
```

## 环境变量配置

```bash
# 服务器配置
PORT=5000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/sileme

# JWT配置
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# 安全配置
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# 文件上传配置
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## 部署指南

### 生产环境部署

1. **准备服务器**
   - Ubuntu 20.04+ 或 CentOS 8+
   - 2GB+ RAM
   - 20GB+ 存储空间

2. **安装Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

3. **配置环境变量**
```bash
# 复制并编辑生产环境配置
cp .env.example .env.production
```

4. **启动服务**
```bash
docker-compose -f docker-compose.yml up -d
```

5. **配置反向代理**
   - 使用Nginx或Traefik
   - 配置SSL证书
   - 设置域名解析

### 监控和维护

1. **日志监控**
```bash
# 查看应用日志
docker-compose logs -f api

# 查看数据库日志
docker-compose logs -f mongodb
```

2. **性能监控**
   - 使用PM2进行进程管理
   - 配置健康检查
   - 设置告警机制

3. **数据备份**
```bash
# MongoDB备份
docker exec mongodb mongodump --out /backup

# 定期备份脚本
0 2 * * * /path/to/backup-script.sh
```

## 开发指南

### 项目结构
```
backend/
├── config/          # 配置文件
├── middleware/      # 中间件
├── models/         # 数据模型
├── routes/         # 路由定义
├── services/       # 业务服务
├── utils/          # 工具函数
├── logs/           # 日志文件
├── uploads/        # 上传文件
└── tests/          # 测试文件
```

### 代码规范

1. **ESLint配置**
```bash
npm run lint        # 检查代码规范
npm run lint:fix    # 自动修复
```

2. **提交规范**
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

### 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MongoDB服务状态
   - 验证连接字符串
   - 确认网络连通性

2. **JWT令牌错误**
   - 检查JWT_SECRET配置
   - 验证令牌格式
   - 确认过期时间

3. **文件上传失败**
   - 检查上传目录权限
   - 验证文件大小限制
   - 确认磁盘空间

### 性能优化

1. **数据库优化**
   - 创建适当索引
   - 优化查询语句
   - 使用连接池

2. **缓存策略**
   - Redis缓存热点数据
   - 静态资源CDN
   - API响应缓存

3. **负载均衡**
   - 多实例部署
   - 反向代理配置
   - 健康检查

## 许可证

MIT License

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 联系方式

- 项目地址: [GitHub Repository]
- 问题反馈: [Issues]
- 邮箱: developer@example.com