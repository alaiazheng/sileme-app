import User from '../models/User.js'
import CheckIn from '../models/CheckIn.js'
import Notification from '../models/Notification.js'
import logger from '../config/logger.js'

// 导出用户完整数据
export async function exportUserData(userId, format = 'json') {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    // 获取用户的所有数据
    const checkIns = await CheckIn.find({ user: userId }).sort({ date: -1 })
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 })
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        format,
        userId: user._id
      },
      user: {
        username: user.username,
        email: user.email,
        profile: user.profile,
        settings: user.settings,
        stats: user.stats,
        emergencyContacts: user.emergencyContacts,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      checkIns: checkIns.map(checkIn => ({
        id: checkIn._id,
        date: checkIn.date,
        mood: checkIn.mood,
        note: checkIn.note,
        location: checkIn.location,
        tags: checkIn.tags,
        isPublic: checkIn.isPublic,
        createdAt: checkIn.createdAt
      })),
      notifications: notifications.map(notification => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        category: notification.category,
        isRead: notification.isRead,
        readAt: notification.readAt,
        createdAt: notification.createdAt
      })),
      statistics: {
        totalCheckIns: checkIns.length,
        totalNotifications: notifications.length,
        accountAge: Math.ceil((new Date() - user.createdAt) / (1000 * 60 * 60 * 24)),
        dataSize: JSON.stringify({ checkIns, notifications }).length
      }
    }
    
    logger.info(`导出用户数据: ${user.username}`)
    
    if (format === 'csv') {
      return convertToCSV(exportData)
    }
    
    return exportData
    
  } catch (error) {
    logger.error('导出用户数据错误:', error)
    throw error
  }
}

// 导入用户数据
export async function importUserData(userId, importData, options = {}) {
  try {
    const { overwrite = false, skipExisting = true } = options
    
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    const results = {
      imported: {
        checkIns: 0,
        notifications: 0,
        settings: 0
      },
      skipped: {
        checkIns: 0,
        notifications: 0
      },
      errors: []
    }
    
    // 导入设置
    if (importData.user && importData.user.settings) {
      try {
        await User.findByIdAndUpdate(userId, {
          $set: {
            'settings': { ...user.settings, ...importData.user.settings }
          }
        })
        results.imported.settings = 1
      } catch (error) {
        results.errors.push(`设置导入失败: ${error.message}`)
      }
    }
    
    // 导入打卡记录
    if (importData.checkIns && Array.isArray(importData.checkIns)) {
      for (const checkInData of importData.checkIns) {
        try {
          const existingCheckIn = await CheckIn.findOne({
            user: userId,
            date: new Date(checkInData.date)
          })
          
          if (existingCheckIn) {
            if (overwrite) {
              await CheckIn.findByIdAndUpdate(existingCheckIn._id, {
                mood: checkInData.mood,
                note: checkInData.note,
                tags: checkInData.tags,
                location: checkInData.location,
                isPublic: checkInData.isPublic
              })
              results.imported.checkIns++
            } else {
              results.skipped.checkIns++
            }
          } else {
            await CheckIn.create({
              user: userId,
              date: new Date(checkInData.date),
              mood: checkInData.mood,
              note: checkInData.note,
              tags: checkInData.tags,
              location: checkInData.location,
              isPublic: checkInData.isPublic || false
            })
            results.imported.checkIns++
          }
        } catch (error) {
          results.errors.push(`打卡记录导入失败: ${error.message}`)
        }
      }
    }
    
    // 导入通知
    if (importData.notifications && Array.isArray(importData.notifications)) {
      for (const notificationData of importData.notifications) {
        try {
          // 检查是否已存在相同的通知
          const existingNotification = await Notification.findOne({
            user: userId,
            title: notificationData.title,
            message: notificationData.message,
            createdAt: new Date(notificationData.createdAt)
          })
          
          if (existingNotification) {
            results.skipped.notifications++
          } else {
            await Notification.create({
              user: userId,
              title: notificationData.title,
              message: notificationData.message,
              type: notificationData.type || 'info',
              priority: notificationData.priority || 3,
              category: notificationData.category || 'other',
              isRead: notificationData.isRead || false,
              readAt: notificationData.readAt ? new Date(notificationData.readAt) : null,
              createdAt: new Date(notificationData.createdAt)
            })
            results.imported.notifications++
          }
        } catch (error) {
          results.errors.push(`通知导入失败: ${error.message}`)
        }
      }
    }
    
    // 更新用户统计信息
    const stats = await CheckIn.getUserStats(userId)
    await User.findByIdAndUpdate(userId, {
      $set: {
        'stats.totalCheckIns': stats.totalCheckIns,
        'stats.currentStreak': stats.currentStreak,
        'stats.longestStreak': stats.longestStreak,
        'stats.lastCheckIn': stats.lastCheckIn
      }
    })
    
    logger.info(`导入用户数据完成: ${user.username}`, results)
    
    return results
    
  } catch (error) {
    logger.error('导入用户数据错误:', error)
    throw error
  }
}

// 转换为CSV格式
function convertToCSV(data) {
  const csvData = {
    checkIns: [],
    notifications: []
  }
  
  // 打卡记录CSV
  if (data.checkIns.length > 0) {
    const checkInHeaders = ['日期', '心情', '备注', '标签', '是否公开', '创建时间']
    csvData.checkIns.push(checkInHeaders.join(','))
    
    data.checkIns.forEach(checkIn => {
      const row = [
        checkIn.date,
        checkIn.mood,
        `"${(checkIn.note || '').replace(/"/g, '""')}"`,
        `"${(checkIn.tags || []).join(';')}"`,
        checkIn.isPublic ? '是' : '否',
        checkIn.createdAt
      ]
      csvData.checkIns.push(row.join(','))
    })
  }
  
  // 通知记录CSV
  if (data.notifications.length > 0) {
    const notificationHeaders = ['标题', '内容', '类型', '优先级', '分类', '是否已读', '创建时间']
    csvData.notifications.push(notificationHeaders.join(','))
    
    data.notifications.forEach(notification => {
      const row = [
        `"${notification.title.replace(/"/g, '""')}"`,
        `"${notification.message.replace(/"/g, '""')}"`,
        notification.type,
        notification.priority,
        notification.category,
        notification.isRead ? '是' : '否',
        notification.createdAt
      ]
      csvData.notifications.push(row.join(','))
    })
  }
  
  return csvData
}

// 验证导入数据格式
export function validateImportData(data) {
  const errors = []
  
  if (!data || typeof data !== 'object') {
    errors.push('数据格式错误')
    return { valid: false, errors }
  }
  
  // 验证打卡数据
  if (data.checkIns && !Array.isArray(data.checkIns)) {
    errors.push('打卡数据必须是数组格式')
  }
  
  // 验证通知数据
  if (data.notifications && !Array.isArray(data.notifications)) {
    errors.push('通知数据必须是数组格式')
  }
  
  // 验证用户设置
  if (data.user && data.user.settings && typeof data.user.settings !== 'object') {
    errors.push('用户设置必须是对象格式')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export default {
  exportUserData,
  importUserData,
  validateImportData
}