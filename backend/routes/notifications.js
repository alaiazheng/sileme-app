import express from 'express'
import Notification from '../models/Notification.js'
import { authenticate } from '../middleware/auth.js'
import { validateNotification, validatePagination, validateObjectId } from '../middleware/validation.js'
import logger from '../config/logger.js'

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

// @desc    创建通知
// @route   POST /api/notifications
// @access  Private
router.post('/', validateNotification, async (req, res) => {
  try {
    const { title, message, type, priority, scheduledFor, channels, metadata } = req.body
    
    const notification = await Notification.create({
      user: req.user._id,
      title,
      message,
      type: type || 'info',
      priority: priority || 3,
      scheduledFor,
      isScheduled: !!scheduledFor,
      channels: channels || ['push'],
      metadata: metadata || {}
    })
    
    // 如果是立即发送的通知，通过WebSocket实时推送
    if (!scheduledFor) {
      const io = req.app.get('io')
      if (io) {
        io.to(`user_${req.user._id}`).emit('new_notification', notification)
      }
      
      // 标记为已发送
      await notification.markAsSent()
    }
    
    logger.info(`用户创建通知: ${req.user.username} - ${title}`)
    
    res.status(201).json({
      success: true,
      message: '通知创建成功',
      data: { notification }
    })
    
  } catch (error) {
    logger.error('创建通知错误:', error)
    res.status(500).json({
      success: false,
      message: '创建通知失败，请稍后重试'
    })
  }
})

// @desc    获取通知列表
// @route   GET /api/notifications
// @access  Private
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const sort = req.query.sort || '-createdAt'
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = { 
      user: req.user._id,
      expiresAt: { $gt: new Date() } // 排除已过期的通知
    }
    
    // 按类型过滤
    if (req.query.type) {
      query.type = req.query.type
    }
    
    // 按分类过滤
    if (req.query.category) {
      query.category = req.query.category
    }
    
    // 按读取状态过滤
    if (req.query.isRead !== undefined) {
      query.isRead = req.query.isRead === 'true'
    }
    
    // 按优先级过滤
    if (req.query.priority) {
      query.priority = parseInt(req.query.priority)
    }
    
    const notifications = await Notification.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Notification.countDocuments(query)
    const unreadCount = await Notification.getUnreadCount(req.user._id)
    
    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    })
    
  } catch (error) {
    logger.error('获取通知列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取通知列表失败'
    })
  }
})

// @desc    获取单个通知
// @route   GET /api/notifications/:id
// @access  Private
router.get('/:id', validateObjectId(), async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      })
    }
    
    res.json({
      success: true,
      data: { notification }
    })
    
  } catch (error) {
    logger.error('获取通知错误:', error)
    res.status(500).json({
      success: false,
      message: '获取通知失败'
    })
  }
})

// @desc    标记通知为已读
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', validateObjectId(), async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      })
    }
    
    if (!notification.isRead) {
      await notification.markAsRead()
    }
    
    res.json({
      success: true,
      message: '通知已标记为已读',
      data: { notification }
    })
    
  } catch (error) {
    logger.error('标记通知已读错误:', error)
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    })
  }
})

// @desc    批量标记通知为已读
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id)
    
    logger.info(`用户批量标记通知已读: ${req.user.username} - ${result.modifiedCount}条`)
    
    res.json({
      success: true,
      message: `已标记 ${result.modifiedCount} 条通知为已读`,
      data: {
        modifiedCount: result.modifiedCount
      }
    })
    
  } catch (error) {
    logger.error('批量标记通知已读错误:', error)
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    })
  }
})

// @desc    删除通知
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', validateObjectId(), async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      })
    }
    
    await notification.deleteOne()
    
    logger.info(`用户删除通知: ${req.user.username} - ${notification.title}`)
    
    res.json({
      success: true,
      message: '通知删除成功'
    })
    
  } catch (error) {
    logger.error('删除通知错误:', error)
    res.status(500).json({
      success: false,
      message: '删除失败，请稍后重试'
    })
  }
})

// @desc    批量删除通知
// @route   DELETE /api/notifications
// @access  Private
router.delete('/', async (req, res) => {
  try {
    const { ids, type, isRead } = req.body
    
    const query = { user: req.user._id }
    
    // 按ID批量删除
    if (ids && Array.isArray(ids)) {
      query._id = { $in: ids }
    }
    
    // 按类型删除
    if (type) {
      query.type = type
    }
    
    // 按读取状态删除
    if (isRead !== undefined) {
      query.isRead = isRead
    }
    
    const result = await Notification.deleteMany(query)
    
    logger.info(`用户批量删除通知: ${req.user.username} - ${result.deletedCount}条`)
    
    res.json({
      success: true,
      message: `已删除 ${result.deletedCount} 条通知`,
      data: {
        deletedCount: result.deletedCount
      }
    })
    
  } catch (error) {
    logger.error('批量删除通知错误:', error)
    res.status(500).json({
      success: false,
      message: '删除失败，请稍后重试'
    })
  }
})

// @desc    获取通知统计信息
// @route   GET /api/notifications/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id
    
    // 基础统计
    const totalCount = await Notification.countDocuments({ 
      user: userId,
      expiresAt: { $gt: new Date() }
    })
    
    const unreadCount = await Notification.getUnreadCount(userId)
    
    // 按类型统计
    const typeStats = await Notification.aggregate([
      { 
        $match: { 
          user: userId,
          expiresAt: { $gt: new Date() }
        } 
      },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    
    // 按优先级统计
    const priorityStats = await Notification.aggregate([
      { 
        $match: { 
          user: userId,
          expiresAt: { $gt: new Date() }
        } 
      },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    
    // 最近7天的通知数量
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentCount = await Notification.countDocuments({
      user: userId,
      createdAt: { $gte: sevenDaysAgo },
      expiresAt: { $gt: new Date() }
    })
    
    res.json({
      success: true,
      data: {
        totalCount,
        unreadCount,
        readCount: totalCount - unreadCount,
        recentCount,
        typeStats,
        priorityStats
      }
    })
    
  } catch (error) {
    logger.error('获取通知统计错误:', error)
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    })
  }
})

// @desc    创建系统提醒通知
// @route   POST /api/notifications/reminder
// @access  Private
router.post('/reminder', async (req, res) => {
  try {
    const { scheduledFor } = req.body
    
    if (!scheduledFor) {
      return res.status(400).json({
        success: false,
        message: '请指定提醒时间'
      })
    }
    
    const reminderTime = new Date(scheduledFor)
    
    if (reminderTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: '提醒时间必须是未来时间'
      })
    }
    
    const notification = await Notification.createReminderNotification(
      req.user._id,
      reminderTime
    )
    
    logger.info(`用户创建提醒: ${req.user.username} - ${reminderTime}`)
    
    res.status(201).json({
      success: true,
      message: '提醒设置成功',
      data: { notification }
    })
    
  } catch (error) {
    logger.error('创建提醒通知错误:', error)
    res.status(500).json({
      success: false,
      message: '设置提醒失败，请稍后重试'
    })
  }
})

export default router