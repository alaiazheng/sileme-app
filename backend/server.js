import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

import connectDB from './config/database.js'
import logger from './config/logger.js'
import errorHandler from './middleware/errorHandler.js'
import NotificationService from './services/notificationService.js'

// 路由导入
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import checkinRoutes from './routes/checkins.js'
import notificationRoutes from './routes/notifications.js'
import statsRoutes from './routes/stats.js'
import dataRoutes from './routes/data.js'

// 加载环境变量
dotenv.config()

// 连接数据库
connectDB()

// CORS配置 - 需要在创建服务器之前定义
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.FRONTEND_URL || 'https://sileme-web.onrender.com',
      'https://sileme-web.onrender.com'
    ]
  : ['http://localhost:3001', 'http://localhost:3000']

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
})

// 初始化通知服务
const notificationService = new NotificationService(io)

// 中间件
app.use(helmet())
app.use(compression())
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX), // 限制每个IP 100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
})
app.use('/api/', limiter)

// 解析JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 静态文件
app.use('/uploads', express.static('uploads'))

// Socket.IO连接处理
io.on('connection', (socket) => {
  logger.info(`用户连接: ${socket.id}`)
  
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`)
    logger.info(`用户 ${userId} 加入房间`)
  })
  
  socket.on('disconnect', () => {
    logger.info(`用户断开连接: ${socket.id}`)
  })
})

// 将io实例和通知服务添加到app中，供路由使用
app.set('io', io)
app.set('notificationService', notificationService)

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/checkins', checkinRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/data', dataRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'connected',
      notifications: 'running'
    }
  })
})

// API文档
app.get('/api/docs', (req, res) => {
  res.json({
    message: '死了么 API 文档',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': '用户注册',
        'POST /api/auth/login': '用户登录',
        'GET /api/auth/me': '获取当前用户信息',
        'POST /api/auth/refresh': '刷新令牌',
        'POST /api/auth/logout': '用户登出'
      },
      users: {
        'PUT /api/users/profile': '更新用户资料',
        'PUT /api/users/settings': '更新用户设置',
        'POST /api/users/emergency-contacts': '添加紧急联系人',
        'GET /api/users/stats': '获取用户统计',
        'GET /api/users/export': '导出用户数据'
      },
      checkins: {
        'POST /api/checkins': '创建打卡记录',
        'GET /api/checkins': '获取打卡记录列表',
        'GET /api/checkins/today/status': '检查今日打卡状态',
        'GET /api/checkins/stats': '获取打卡统计',
        'GET /api/checkins/calendar/:year/:month': '获取日历数据'
      },
      notifications: {
        'POST /api/notifications': '创建通知',
        'GET /api/notifications': '获取通知列表',
        'PUT /api/notifications/:id/read': '标记通知已读',
        'PUT /api/notifications/read-all': '批量标记已读',
        'DELETE /api/notifications/:id': '删除通知'
      },
      stats: {
        'GET /api/stats/overview': '获取综合统计',
        'GET /api/stats/checkin-trends': '获取打卡趋势',
        'GET /api/stats/monthly-report/:year/:month': '获取月度报告',
        'GET /api/stats/achievements': '获取成就数据'
      },
      data: {
        'GET /api/data/export': '导出数据',
        'POST /api/data/import': '导入数据',
        'POST /api/data/validate': '验证数据格式',
        'DELETE /api/data/clear-all': '清除所有数据'
      }
    }
  })
})

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '死了么 API 服务',
    version: '1.0.0',
    docs: '/api/docs'
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

// 错误处理中间件
app.use(errorHandler)

const PORT = process.env.PORT || 5001

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`服务器运行在端口 ${PORT}`)
  logger.info(`环境: ${process.env.NODE_ENV}`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...')
  notificationService.stop()
  server.close(() => {
    logger.info('HTTP服务器已关闭')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，开始优雅关闭...')
  notificationService.stop()
  server.close(() => {
    logger.info('HTTP服务器已关闭')
    process.exit(0)
  })
})

export default app