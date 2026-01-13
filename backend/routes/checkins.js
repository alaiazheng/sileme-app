import express from 'express'
import CheckIn from '../models/CheckIn.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'
import { authenticate } from '../middleware/auth.js'
import { validateCheckIn, validatePagination, validateObjectId } from '../middleware/validation.js'
import logger from '../config/logger.js'

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

// @desc    创建打卡记录
// @route   POST /api/checkins
// @access  Private
router.post('/', validateCheckIn, async (req, res) => {
  try {
    const { mood, note, location, tags, isPublic } = req.body
    
    // 检查今天是否已经打卡
    const hasCheckedIn = await CheckIn.hasCheckedInToday(req.user._id)
    
    if (hasCheckedIn) {
      return res.status(400).json({
        success: false,
        message: '今天已经打卡过了'
      })
    }
    
    // 创建打卡记录
    const checkIn = await CheckIn.create({
      user: req.user._id,
      mood: mood || '正常',
      note,
      location,
      tags,
      isPublic: isPublic || false
    })
    
    // 更新用户统计信息
    const stats = await CheckIn.getUserStats(req.user._id)
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'stats.totalCheckIns': stats.totalCheckIns,
        'stats.currentStreak': stats.currentStreak,
        'stats.longestStreak': stats.longestStreak,
        'stats.lastCheckIn': stats.lastCheckIn
      }
    })
    
    // 创建成功通知
    await Notification.createSystemNotification(
      req.user._id,
      '打卡成功',
      `今日打卡完成，心情：${checkIn.mood}`,
      { checkInId: checkIn._id, type: 'checkin_success' }
    )
    
    // 通过WebSocket发送实时通知
    const io = req.app.get('io')
    if (io) {
      io.to(`user_${req.user._id}`).emit('checkin_success', {
        checkIn,
        stats
      })
    }
    
    logger.info(`用户打卡: ${req.user.username} - ${checkIn.mood}`)
    
    res.status(201).json({
      success: true,
      message: '打卡成功',
      data: {
        checkIn,
        stats
      }
    })
    
  } catch (error) {
    logger.error('创建打卡记录错误:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '今天已经打卡过了'
      })
    }
    
    res.status(500).json({
      success: false,
      message: '打卡失败，请稍后重试'
    })
  }
})

// @desc    获取打卡记录列表
// @route   GET /api/checkins
// @access  Private
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const sort = req.query.sort || '-createdAt'
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = { user: req.user._id }
    
    // 日期范围过滤
    if (req.query.startDate || req.query.endDate) {
      query.date = {}
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate)
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate)
      }
    }
    
    // 心情过滤
    if (req.query.mood) {
      query.mood = req.query.mood
    }
    
    // 标签过滤
    if (req.query.tags) {
      const tags = req.query.tags.split(',')
      query.tags = { $in: tags }
    }
    
    const checkIns = await CheckIn.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await CheckIn.countDocuments(query)
    
    res.json({
      success: true,
      data: {
        checkIns,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    })
    
  } catch (error) {
    logger.error('获取打卡记录错误:', error)
    res.status(500).json({
      success: false,
      message: '获取打卡记录失败'
    })
  }
})

// @desc    获取单个打卡记录
// @route   GET /api/checkins/:id
// @access  Private
router.get('/:id', validateObjectId(), async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    
    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: '打卡记录不存在'
      })
    }
    
    res.json({
      success: true,
      data: { checkIn }
    })
    
  } catch (error) {
    logger.error('获取打卡记录错误:', error)
    res.status(500).json({
      success: false,
      message: '获取打卡记录失败'
    })
  }
})

// @desc    更新打卡记录
// @route   PUT /api/checkins/:id
// @access  Private
router.put('/:id', validateObjectId(), validateCheckIn, async (req, res) => {
  try {
    const { mood, note, tags, isPublic } = req.body
    
    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    
    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: '打卡记录不存在'
      })
    }
    
    // 检查是否是今天的打卡记录（只允许修改今天的记录）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkInDate = new Date(checkIn.date)
    checkInDate.setHours(0, 0, 0, 0)
    
    if (checkInDate.getTime() !== today.getTime()) {
      return res.status(400).json({
        success: false,
        message: '只能修改今天的打卡记录'
      })
    }
    
    // 更新字段
    if (mood !== undefined) checkIn.mood = mood
    if (note !== undefined) checkIn.note = note
    if (tags !== undefined) checkIn.tags = tags
    if (isPublic !== undefined) checkIn.isPublic = isPublic
    
    await checkIn.save()
    
    logger.info(`用户更新打卡记录: ${req.user.username} - ${checkIn._id}`)
    
    res.json({
      success: true,
      message: '打卡记录更新成功',
      data: { checkIn }
    })
    
  } catch (error) {
    logger.error('更新打卡记录错误:', error)
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    })
  }
})

// @desc    删除打卡记录
// @route   DELETE /api/checkins/:id
// @access  Private
router.delete('/:id', validateObjectId(), async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    
    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: '打卡记录不存在'
      })
    }
    
    await checkIn.deleteOne()
    
    // 重新计算用户统计信息
    const stats = await CheckIn.getUserStats(req.user._id)
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'stats.totalCheckIns': stats.totalCheckIns,
        'stats.currentStreak': stats.currentStreak,
        'stats.longestStreak': stats.longestStreak,
        'stats.lastCheckIn': stats.lastCheckIn
      }
    })
    
    logger.info(`用户删除打卡记录: ${req.user.username} - ${checkIn._id}`)
    
    res.json({
      success: true,
      message: '打卡记录删除成功',
      data: { stats }
    })
    
  } catch (error) {
    logger.error('删除打卡记录错误:', error)
    res.status(500).json({
      success: false,
      message: '删除失败，请稍后重试'
    })
  }
})

// @desc    检查今天是否已打卡
// @route   GET /api/checkins/today/status
// @access  Private
router.get('/today/status', async (req, res) => {
  try {
    const hasCheckedIn = await CheckIn.hasCheckedInToday(req.user._id)
    
    let todayCheckIn = null
    if (hasCheckedIn) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      todayCheckIn = await CheckIn.findOne({
        user: req.user._id,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      })
    }
    
    res.json({
      success: true,
      data: {
        hasCheckedIn,
        checkIn: todayCheckIn
      }
    })
    
  } catch (error) {
    logger.error('检查打卡状态错误:', error)
    res.status(500).json({
      success: false,
      message: '检查打卡状态失败'
    })
  }
})

// @desc    获取打卡统计信息
// @route   GET /api/checkins/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await CheckIn.getUserStats(req.user._id)
    
    // 获取最近7天的打卡情况
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentCheckIns = await CheckIn.find({
      user: req.user._id,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 })
    
    // 按心情统计
    const moodStats = await CheckIn.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    
    // 按月份统计
    const monthlyStats = await CheckIn.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ])
    
    res.json({
      success: true,
      data: {
        ...stats,
        recentCheckIns,
        moodStats,
        monthlyStats
      }
    })
    
  } catch (error) {
    logger.error('获取打卡统计错误:', error)
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    })
  }
})

// @desc    获取打卡日历数据
// @route   GET /api/checkins/calendar/:year/:month
// @access  Private
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year)
    const month = parseInt(req.params.month)
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: '年份或月份参数无效'
      })
    }
    
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    
    const checkIns = await CheckIn.find({
      user: req.user._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 })
    
    // 按日期组织数据
    const calendar = {}
    checkIns.forEach(checkIn => {
      const day = checkIn.date.getDate()
      calendar[day] = {
        mood: checkIn.mood,
        note: checkIn.note,
        tags: checkIn.tags
      }
    })
    
    res.json({
      success: true,
      data: {
        year,
        month,
        calendar,
        totalDays: endDate.getDate(),
        checkInDays: Object.keys(calendar).length
      }
    })
    
  } catch (error) {
    logger.error('获取日历数据错误:', error)
    res.status(500).json({
      success: false,
      message: '获取日历数据失败'
    })
  }
})

export default router