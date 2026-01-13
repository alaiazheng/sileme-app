import express from 'express'
import CheckIn from '../models/CheckIn.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.js'
import logger from '../config/logger.js'

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

// @desc    获取用户综合统计信息
// @route   GET /api/stats/overview
// @access  Private
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user._id
    
    // 打卡统计
    const checkInStats = await CheckIn.getUserStats(userId)
    
    // 通知统计
    const notificationStats = {
      total: await Notification.countDocuments({ 
        user: userId,
        expiresAt: { $gt: new Date() }
      }),
      unread: await Notification.getUnreadCount(userId)
    }
    
    // 用户基本信息
    const user = await User.findById(userId)
    const joinDays = Math.ceil((new Date() - user.createdAt) / (1000 * 60 * 60 * 24))
    
    // 本月打卡统计
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    
    const monthlyCheckIns = await CheckIn.countDocuments({
      user: userId,
      date: { $gte: monthStart, $lte: monthEnd }
    })
    
    // 本周打卡统计
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    const weeklyCheckIns = await CheckIn.countDocuments({
      user: userId,
      date: { $gte: weekStart, $lte: weekEnd }
    })
    
    res.json({
      success: true,
      data: {
        user: {
          joinDays,
          username: user.username,
          createdAt: user.createdAt
        },
        checkIns: {
          ...checkInStats,
          thisMonth: monthlyCheckIns,
          thisWeek: weeklyCheckIns
        },
        notifications: notificationStats
      }
    })
    
  } catch (error) {
    logger.error('获取综合统计错误:', error)
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    })
  }
})

// @desc    获取打卡趋势数据
// @route   GET /api/stats/checkin-trends
// @access  Private
router.get('/checkin-trends', async (req, res) => {
  try {
    const userId = req.user._id
    const days = parseInt(req.query.days) || 30
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)
    
    // 按日期聚合打卡数据
    const dailyStats = await CheckIn.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          count: { $sum: 1 },
          moods: { $push: '$mood' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ])
    
    // 按心情统计
    const moodTrends = await CheckIn.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])
    
    // 按星期几统计
    const weekdayStats = await CheckIn.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ])
    
    res.json({
      success: true,
      data: {
        period: `${days}天`,
        dailyStats,
        moodTrends,
        weekdayStats
      }
    })
    
  } catch (error) {
    logger.error('获取打卡趋势错误:', error)
    res.status(500).json({
      success: false,
      message: '获取趋势数据失败'
    })
  }
})

// @desc    获取月度统计报告
// @route   GET /api/stats/monthly-report/:year/:month
// @access  Private
router.get('/monthly-report/:year/:month', async (req, res) => {
  try {
    const userId = req.user._id
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
    const totalDays = endDate.getDate()
    
    // 该月打卡记录
    const checkIns = await CheckIn.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 })
    
    // 打卡天数
    const checkInDays = checkIns.length
    const checkInRate = ((checkInDays / totalDays) * 100).toFixed(1)
    
    // 心情分布
    const moodDistribution = {}
    checkIns.forEach(checkIn => {
      moodDistribution[checkIn.mood] = (moodDistribution[checkIn.mood] || 0) + 1
    })
    
    // 连续打卡天数分析
    let maxStreak = 0
    let currentStreak = 0
    let streaks = []
    
    for (let day = 1; day <= totalDays; day++) {
      const hasCheckIn = checkIns.some(checkIn => 
        checkIn.date.getDate() === day
      )
      
      if (hasCheckIn) {
        currentStreak++
      } else {
        if (currentStreak > 0) {
          streaks.push(currentStreak)
          maxStreak = Math.max(maxStreak, currentStreak)
        }
        currentStreak = 0
      }
    }
    
    if (currentStreak > 0) {
      streaks.push(currentStreak)
      maxStreak = Math.max(maxStreak, currentStreak)
    }
    
    // 标签统计
    const tagStats = {}
    checkIns.forEach(checkIn => {
      if (checkIn.tags && checkIn.tags.length > 0) {
        checkIn.tags.forEach(tag => {
          tagStats[tag] = (tagStats[tag] || 0) + 1
        })
      }
    })
    
    res.json({
      success: true,
      data: {
        period: `${year}年${month}月`,
        summary: {
          totalDays,
          checkInDays,
          checkInRate: parseFloat(checkInRate),
          maxStreak,
          avgStreakLength: streaks.length > 0 ? 
            (streaks.reduce((a, b) => a + b, 0) / streaks.length).toFixed(1) : 0
        },
        moodDistribution,
        tagStats,
        streaks,
        checkIns: checkIns.map(checkIn => ({
          date: checkIn.date,
          mood: checkIn.mood,
          note: checkIn.note,
          tags: checkIn.tags
        }))
      }
    })
    
  } catch (error) {
    logger.error('获取月度报告错误:', error)
    res.status(500).json({
      success: false,
      message: '获取月度报告失败'
    })
  }
})

// @desc    获取年度统计报告
// @route   GET /api/stats/yearly-report/:year
// @access  Private
router.get('/yearly-report/:year', async (req, res) => {
  try {
    const userId = req.user._id
    const year = parseInt(req.params.year)
    
    if (isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: '年份参数无效'
      })
    }
    
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)
    
    // 按月统计
    const monthlyStats = await CheckIn.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          count: { $sum: 1 },
          moods: { $push: '$mood' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ])
    
    // 总体统计
    const totalCheckIns = await CheckIn.countDocuments({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    })
    
    // 心情统计
    const yearlyMoodStats = await CheckIn.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])
    
    // 计算年度打卡率
    const totalDaysInYear = year % 4 === 0 ? 366 : 365
    const checkInRate = ((totalCheckIns / totalDaysInYear) * 100).toFixed(1)
    
    res.json({
      success: true,
      data: {
        year,
        summary: {
          totalCheckIns,
          totalDays: totalDaysInYear,
          checkInRate: parseFloat(checkInRate),
          activeMonths: monthlyStats.length
        },
        monthlyStats,
        moodStats: yearlyMoodStats
      }
    })
    
  } catch (error) {
    logger.error('获取年度报告错误:', error)
    res.status(500).json({
      success: false,
      message: '获取年度报告失败'
    })
  }
})

// @desc    获取个人成就数据
// @route   GET /api/stats/achievements
// @access  Private
router.get('/achievements', async (req, res) => {
  try {
    const userId = req.user._id
    const user = await User.findById(userId)
    const stats = await CheckIn.getUserStats(userId)
    
    // 定义成就规则
    const achievements = [
      {
        id: 'first_checkin',
        name: '初来乍到',
        description: '完成第一次打卡',
        icon: '🎉',
        unlocked: stats.totalCheckIns >= 1,
        progress: Math.min(stats.totalCheckIns, 1),
        target: 1
      },
      {
        id: 'week_warrior',
        name: '一周达人',
        description: '连续打卡7天',
        icon: '🔥',
        unlocked: stats.longestStreak >= 7,
        progress: Math.min(stats.longestStreak, 7),
        target: 7
      },
      {
        id: 'month_master',
        name: '月度大师',
        description: '连续打卡30天',
        icon: '👑',
        unlocked: stats.longestStreak >= 30,
        progress: Math.min(stats.longestStreak, 30),
        target: 30
      },
      {
        id: 'hundred_club',
        name: '百日俱乐部',
        description: '累计打卡100天',
        icon: '💯',
        unlocked: stats.totalCheckIns >= 100,
        progress: Math.min(stats.totalCheckIns, 100),
        target: 100
      },
      {
        id: 'year_veteran',
        name: '年度老兵',
        description: '连续打卡365天',
        icon: '🏆',
        unlocked: stats.longestStreak >= 365,
        progress: Math.min(stats.longestStreak, 365),
        target: 365
      },
      {
        id: 'early_bird',
        name: '早起鸟儿',
        description: '在早上6点前打卡10次',
        icon: '🐦',
        unlocked: false, // 需要额外查询
        progress: 0,
        target: 10
      }
    ]
    
    // 计算早起成就
    const earlyCheckIns = await CheckIn.countDocuments({
      user: userId,
      $expr: {
        $lt: [{ $hour: '$createdAt' }, 6]
      }
    })
    
    const earlyBirdAchievement = achievements.find(a => a.id === 'early_bird')
    earlyBirdAchievement.progress = Math.min(earlyCheckIns, 10)
    earlyBirdAchievement.unlocked = earlyCheckIns >= 10
    
    // 计算总体进度
    const unlockedCount = achievements.filter(a => a.unlocked).length
    const totalAchievements = achievements.length
    
    res.json({
      success: true,
      data: {
        summary: {
          unlockedCount,
          totalAchievements,
          completionRate: ((unlockedCount / totalAchievements) * 100).toFixed(1)
        },
        achievements
      }
    })
    
  } catch (error) {
    logger.error('获取成就数据错误:', error)
    res.status(500).json({
      success: false,
      message: '获取成就数据失败'
    })
  }
})

export default router