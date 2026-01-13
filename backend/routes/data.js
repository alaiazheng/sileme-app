import express from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth.js'
import { exportUserData, importUserData, validateImportData } from '../utils/dataExport.js'
import logger from '../config/logger.js'

const router = express.Router()

// 配置文件上传
const upload = multer({
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true)
    } else {
      cb(new Error('只支持JSON格式文件'), false)
    }
  }
})

// 所有路由都需要认证
router.use(authenticate)

// @desc    导出用户数据
// @route   GET /api/data/export
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format || 'json'
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: '不支持的导出格式'
      })
    }
    
    const exportData = await exportUserData(req.user._id, format)
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="sileme-data-${Date.now()}.zip"`)
      
      // 这里应该创建ZIP文件包含多个CSV文件
      // 为简化，直接返回JSON格式的CSV数据
      return res.json({
        success: true,
        message: 'CSV导出功能开发中，请使用JSON格式',
        data: exportData
      })
    }
    
    // JSON格式导出
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="sileme-data-${Date.now()}.json"`)
    
    res.json(exportData)
    
  } catch (error) {
    logger.error('导出数据错误:', error)
    res.status(500).json({
      success: false,
      message: '导出失败，请稍后重试'
    })
  }
})

// @desc    导入用户数据
// @route   POST /api/data/import
// @access  Private
router.post('/import', upload.single('dataFile'), async (req, res) => {
  try {
    let importData
    
    if (req.file) {
      // 从上传的文件读取数据
      try {
        importData = JSON.parse(req.file.buffer.toString())
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'JSON文件格式错误'
        })
      }
    } else if (req.body.data) {
      // 从请求体读取数据
      importData = typeof req.body.data === 'string' 
        ? JSON.parse(req.body.data) 
        : req.body.data
    } else {
      return res.status(400).json({
        success: false,
        message: '请提供要导入的数据'
      })
    }
    
    // 验证数据格式
    const validation = validateImportData(importData)
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: '数据格式验证失败',
        errors: validation.errors
      })
    }
    
    // 导入选项
    const options = {
      overwrite: req.body.overwrite === 'true' || req.body.overwrite === true,
      skipExisting: req.body.skipExisting !== 'false' && req.body.skipExisting !== false
    }
    
    const results = await importUserData(req.user._id, importData, options)
    
    logger.info(`用户导入数据: ${req.user.username}`, results)
    
    res.json({
      success: true,
      message: '数据导入完成',
      data: results
    })
    
  } catch (error) {
    logger.error('导入数据错误:', error)
    res.status(500).json({
      success: false,
      message: error.message || '导入失败，请稍后重试'
    })
  }
})

// @desc    验证导入数据格式
// @route   POST /api/data/validate
// @access  Private
router.post('/validate', upload.single('dataFile'), async (req, res) => {
  try {
    let importData
    
    if (req.file) {
      try {
        importData = JSON.parse(req.file.buffer.toString())
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'JSON文件格式错误'
        })
      }
    } else if (req.body.data) {
      importData = typeof req.body.data === 'string' 
        ? JSON.parse(req.body.data) 
        : req.body.data
    } else {
      return res.status(400).json({
        success: false,
        message: '请提供要验证的数据'
      })
    }
    
    const validation = validateImportData(importData)
    
    // 统计数据信息
    const stats = {
      checkIns: importData.checkIns ? importData.checkIns.length : 0,
      notifications: importData.notifications ? importData.notifications.length : 0,
      hasSettings: !!(importData.user && importData.user.settings),
      dataSize: JSON.stringify(importData).length
    }
    
    res.json({
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        stats
      }
    })
    
  } catch (error) {
    logger.error('验证数据错误:', error)
    res.status(500).json({
      success: false,
      message: '验证失败，请稍后重试'
    })
  }
})

// @desc    获取数据导出历史
// @route   GET /api/data/export-history
// @access  Private
router.get('/export-history', async (req, res) => {
  try {
    // 这里可以实现导出历史记录功能
    // 目前返回空数组
    res.json({
      success: true,
      data: {
        exports: [],
        message: '导出历史功能开发中'
      }
    })
    
  } catch (error) {
    logger.error('获取导出历史错误:', error)
    res.status(500).json({
      success: false,
      message: '获取导出历史失败'
    })
  }
})

// @desc    清除所有用户数据
// @route   DELETE /api/data/clear-all
// @access  Private
router.delete('/clear-all', async (req, res) => {
  try {
    const { confirm } = req.body
    
    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        message: '请确认删除操作'
      })
    }
    
    // 删除用户的所有数据
    const CheckIn = (await import('../models/CheckIn.js')).default
    const Notification = (await import('../models/Notification.js')).default
    const User = (await import('../models/User.js')).default
    
    const checkInResult = await CheckIn.deleteMany({ user: req.user._id })
    const notificationResult = await Notification.deleteMany({ user: req.user._id })
    
    // 重置用户统计信息
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'stats.totalCheckIns': 0,
        'stats.currentStreak': 0,
        'stats.longestStreak': 0,
        'stats.lastCheckIn': null
      },
      $unset: {
        emergencyContacts: 1
      }
    })
    
    logger.info(`用户清除所有数据: ${req.user.username}`, {
      checkIns: checkInResult.deletedCount,
      notifications: notificationResult.deletedCount
    })
    
    res.json({
      success: true,
      message: '所有数据已清除',
      data: {
        deletedCheckIns: checkInResult.deletedCount,
        deletedNotifications: notificationResult.deletedCount
      }
    })
    
  } catch (error) {
    logger.error('清除用户数据错误:', error)
    res.status(500).json({
      success: false,
      message: '清除数据失败，请稍后重试'
    })
  }
})

export default router