import express from 'express'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.js'
import { 
  validateProfileUpdate, 
  validateSettingsUpdate, 
  validateEmergencyContact,
  validateObjectId 
} from '../middleware/validation.js'
import logger from '../config/logger.js'

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

// @desc    更新用户资料
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', validateProfileUpdate, async (req, res) => {
  try {
    const updates = {}
    
    // 只更新提供的字段
    if (req.body.profile) {
      Object.keys(req.body.profile).forEach(key => {
        if (req.body.profile[key] !== undefined) {
          updates[`profile.${key}`] = req.body.profile[key]
        }
      })
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    
    logger.info(`用户更新资料: ${user.username}`)
    
    res.json({
      success: true,
      message: '资料更新成功',
      data: {
        profile: user.profile
      }
    })
    
  } catch (error) {
    logger.error('更新用户资料错误:', error)
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    })
  }
})

// @desc    更新用户设置
// @route   PUT /api/users/settings
// @access  Private
router.put('/settings', validateSettingsUpdate, async (req, res) => {
  try {
    const updates = {}
    
    // 只更新提供的字段
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key])) {
          // 处理嵌套对象
          Object.keys(req.body[key]).forEach(subKey => {
            if (req.body[key][subKey] !== undefined) {
              updates[`settings.${key}.${subKey}`] = req.body[key][subKey]
            }
          })
        } else {
          updates[`settings.${key}`] = req.body[key]
        }
      }
    })
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    
    logger.info(`用户更新设置: ${user.username}`)
    
    res.json({
      success: true,
      message: '设置更新成功',
      data: {
        settings: user.settings
      }
    })
    
  } catch (error) {
    logger.error('更新用户设置错误:', error)
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    })
  }
})

// @desc    添加紧急联系人
// @route   POST /api/users/emergency-contacts
// @access  Private
router.post('/emergency-contacts', validateEmergencyContact, async (req, res) => {
  try {
    const { name, phone, email, relationship } = req.body
    
    const user = await User.findById(req.user._id)
    
    // 检查是否已达到最大数量限制
    if (user.emergencyContacts.length >= 5) {
      return res.status(400).json({
        success: false,
        message: '最多只能添加5个紧急联系人'
      })
    }
    
    // 检查是否已存在相同的联系人
    const existingContact = user.emergencyContacts.find(
      contact => contact.phone === phone || contact.email === email
    )
    
    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: '该联系人已存在'
      })
    }
    
    const newContact = {
      name,
      phone,
      email,
      relationship
    }
    
    user.emergencyContacts.push(newContact)
    await user.save()
    
    logger.info(`用户添加紧急联系人: ${user.username} -> ${name}`)
    
    res.status(201).json({
      success: true,
      message: '紧急联系人添加成功',
      data: {
        contact: user.emergencyContacts[user.emergencyContacts.length - 1]
      }
    })
    
  } catch (error) {
    logger.error('添加紧急联系人错误:', error)
    res.status(500).json({
      success: false,
      message: '添加失败，请稍后重试'
    })
  }
})

// @desc    更新紧急联系人
// @route   PUT /api/users/emergency-contacts/:contactId
// @access  Private
router.put('/emergency-contacts/:contactId', validateObjectId('contactId'), validateEmergencyContact, async (req, res) => {
  try {
    const { contactId } = req.params
    const { name, phone, email, relationship } = req.body
    
    const user = await User.findById(req.user._id)
    const contact = user.emergencyContacts.id(contactId)
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在'
      })
    }
    
    // 更新联系人信息
    contact.name = name
    contact.phone = phone
    contact.email = email
    contact.relationship = relationship
    
    await user.save()
    
    logger.info(`用户更新紧急联系人: ${user.username} -> ${name}`)
    
    res.json({
      success: true,
      message: '联系人更新成功',
      data: {
        contact
      }
    })
    
  } catch (error) {
    logger.error('更新紧急联系人错误:', error)
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    })
  }
})

// @desc    删除紧急联系人
// @route   DELETE /api/users/emergency-contacts/:contactId
// @access  Private
router.delete('/emergency-contacts/:contactId', validateObjectId('contactId'), async (req, res) => {
  try {
    const { contactId } = req.params
    
    const user = await User.findById(req.user._id)
    const contact = user.emergencyContacts.id(contactId)
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在'
      })
    }
    
    contact.deleteOne()
    await user.save()
    
    logger.info(`用户删除紧急联系人: ${user.username} -> ${contact.name}`)
    
    res.json({
      success: true,
      message: '联系人删除成功'
    })
    
  } catch (error) {
    logger.error('删除紧急联系人错误:', error)
    res.status(500).json({
      success: false,
      message: '删除失败，请稍后重试'
    })
  }
})

// @desc    获取用户统计信息
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    // 这里可以添加更多统计计算逻辑
    const stats = {
      ...user.stats,
      joinDays: Math.ceil((new Date() - user.createdAt) / (1000 * 60 * 60 * 24)),
      emergencyContactsCount: user.emergencyContacts.length
    }
    
    res.json({
      success: true,
      data: { stats }
    })
    
  } catch (error) {
    logger.error('获取用户统计错误:', error)
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    })
  }
})

// @desc    导出用户数据
// @route   GET /api/users/export
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('checkIns')
      .populate('notifications')
    
    const exportData = {
      user: {
        username: user.username,
        email: user.email,
        profile: user.profile,
        settings: user.settings,
        stats: user.stats,
        emergencyContacts: user.emergencyContacts,
        createdAt: user.createdAt
      },
      checkIns: user.checkIns,
      notifications: user.notifications,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
    
    logger.info(`用户导出数据: ${user.username}`)
    
    res.json({
      success: true,
      data: exportData
    })
    
  } catch (error) {
    logger.error('导出用户数据错误:', error)
    res.status(500).json({
      success: false,
      message: '导出数据失败'
    })
  }
})

// @desc    删除用户账户
// @route   DELETE /api/users/account
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    // 软删除：标记为不活跃而不是真正删除
    user.isActive = false
    user.email = `deleted_${Date.now()}_${user.email}`
    user.username = `deleted_${Date.now()}_${user.username}`
    
    await user.save()
    
    logger.info(`用户删除账户: ${req.user.username}`)
    
    res.json({
      success: true,
      message: '账户删除成功'
    })
    
  } catch (error) {
    logger.error('删除用户账户错误:', error)
    res.status(500).json({
      success: false,
      message: '删除账户失败'
    })
  }
})

export default router