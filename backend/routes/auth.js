import express from 'express'
import User from '../models/User.js'
import { generateToken, authenticate } from '../middleware/auth.js'
import { validateRegister, validateLogin } from '../middleware/validation.js'
import logger from '../config/logger.js'

const router = express.Router()

// @desc    用户注册
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username }
      ]
    })
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase() ? '邮箱已被注册' : '用户名已被使用'
      })
    }
    
    // 创建新用户
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password
    })
    
    // 生成令牌
    const token = generateToken(user._id)
    
    // 更新登录时间
    await user.updateLastLogin()
    
    logger.info(`新用户注册: ${user.username} (${user.email})`)
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          settings: user.settings,
          stats: user.stats,
          createdAt: user.createdAt
        }
      }
    })
    
  } catch (error) {
    logger.error('用户注册错误:', error)
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    })
  }
})

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { identifier, password } = req.body
    
    // 查找用户（通过邮箱或用户名）
    const user = await User.findByEmailOrUsername(identifier)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }
    
    // 检查账户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      })
    }
    
    // 验证密码
    const isPasswordValid = await user.comparePassword(password)
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }
    
    // 生成令牌
    const token = generateToken(user._id)
    
    // 更新登录时间
    await user.updateLastLogin()
    
    logger.info(`用户登录: ${user.username}`)
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          settings: user.settings,
          stats: user.stats,
          lastLoginAt: user.lastLoginAt
        }
      }
    })
    
  } catch (error) {
    logger.error('用户登录错误:', error)
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    })
  }
})

// @desc    获取当前用户信息
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('checkIns', null, null, { sort: { createdAt: -1 }, limit: 10 })
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          settings: user.settings,
          stats: user.stats,
          emergencyContacts: user.emergencyContacts,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      }
    })
    
  } catch (error) {
    logger.error('获取用户信息错误:', error)
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    })
  }
})

// @desc    刷新令牌
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const token = generateToken(req.user._id)
    
    res.json({
      success: true,
      message: '令牌刷新成功',
      data: { token }
    })
    
  } catch (error) {
    logger.error('令牌刷新错误:', error)
    res.status(500).json({
      success: false,
      message: '令牌刷新失败'
    })
  }
})

// @desc    用户登出
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    // 这里可以实现令牌黑名单机制
    // 目前只是简单返回成功消息
    
    logger.info(`用户登出: ${req.user.username}`)
    
    res.json({
      success: true,
      message: '登出成功'
    })
    
  } catch (error) {
    logger.error('用户登出错误:', error)
    res.status(500).json({
      success: false,
      message: '登出失败'
    })
  }
})

// @desc    检查用户名是否可用
// @route   GET /api/auth/check-username/:username
// @access  Public
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params
    
    const existingUser = await User.findOne({ username })
    
    res.json({
      success: true,
      data: {
        available: !existingUser,
        message: existingUser ? '用户名已被使用' : '用户名可用'
      }
    })
    
  } catch (error) {
    logger.error('检查用户名错误:', error)
    res.status(500).json({
      success: false,
      message: '检查失败'
    })
  }
})

// @desc    检查邮箱是否可用
// @route   GET /api/auth/check-email/:email
// @access  Public
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params
    
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    
    res.json({
      success: true,
      data: {
        available: !existingUser,
        message: existingUser ? '邮箱已被注册' : '邮箱可用'
      }
    })
    
  } catch (error) {
    logger.error('检查邮箱错误:', error)
    res.status(500).json({
      success: false,
      message: '检查失败'
    })
  }
})

export default router