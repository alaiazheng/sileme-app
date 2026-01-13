# 死了么应用 - Render部署指南

## 📋 部署准备清单

### 1. 数据库准备 (MongoDB Atlas)
- [ ] 注册 [MongoDB Atlas](https://www.mongodb.com/atlas) 账户
- [ ] 创建免费集群
- [ ] 获取连接字符串 (格式: `mongodb+srv://username:password@cluster.mongodb.net/sileme`)
- [ ] 设置网络访问 (允许所有IP: 0.0.0.0/0)

### 2. 代码仓库准备
- [ ] 将代码推送到 GitHub 仓库
- [ ] 确保 `.env` 文件已添加到 `.gitignore`
- [ ] 确保生产环境配置文件存在

## 🚀 Render部署步骤

### 第一步：部署后端 (Web Service)

1. **创建Web Service**
   - 登录 [Render](https://render.com)
   - 点击 "New" → "Web Service"
   - 连接你的GitHub仓库
   - 选择后端目录: `backend`

2. **配置构建设置**
   ```
   Name: sileme-backend
   Environment: Node
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

3. **设置环境变量**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sileme
   JWT_SECRET=your_super_secure_jwt_secret_here
   FRONTEND_URL=https://sileme-web.onrender.com
   ```

4. **部署并获取URL**
   - 点击 "Create Web Service"
   - 等待部署完成
   - 记录后端URL (例如: `https://sileme-backend.onrender.com`)

### 第二步：部署前端 (Static Site)

1. **创建Static Site**
   - 点击 "New" → "Static Site"
   - 连接同一个GitHub仓库
   - 选择根目录

2. **配置构建设置**
   ```
   Name: sileme-web
   Branch: main
   Root Directory: (留空，使用根目录)
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

3. **设置环境变量**
   ```
   VITE_API_URL=https://sileme-backend.onrender.com/api
   ```

4. **部署并测试**
   - 点击 "Create Static Site"
   - 等待部署完成
   - 访问前端URL测试功能

### 第三步：更新后端CORS配置

1. 在Render后端服务的环境变量中更新:
   ```
   FRONTEND_URL=https://your-actual-frontend-url.onrender.com
   ```

2. 重新部署后端服务

## 🔧 本地测试生产配置

### 测试后端
```bash
cd backend
NODE_ENV=production npm start
```

### 测试前端构建
```bash
npm run build
npm run preview
```

## 📝 重要提醒

1. **免费版限制**
   - 后端服务会在15分钟无活动后休眠
   - 首次访问可能需要30秒启动时间
   - 每月750小时免费时长

2. **数据库连接**
   - 确保MongoDB Atlas允许所有IP访问
   - 连接字符串中的密码不能包含特殊字符

3. **环境变量安全**
   - 不要在代码中硬编码敏感信息
   - 使用Render的环境变量功能

## 🎯 部署后验证

- [ ] 后端API健康检查: `GET /api/health`
- [ ] 前端页面正常加载
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 打卡功能正常
- [ ] 数据持久化正常

## 🐛 常见问题

1. **CORS错误**: 检查后端CORS配置和FRONTEND_URL环境变量
2. **数据库连接失败**: 检查MongoDB Atlas网络设置和连接字符串
3. **API请求失败**: 检查前端API_URL配置
4. **服务启动慢**: 免费版正常现象，等待30秒

## 📞 技术支持

如遇到部署问题，请检查:
1. Render服务日志
2. 浏览器开发者工具控制台
3. 网络请求状态