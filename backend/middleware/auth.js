import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import logger from '../config/logger.js'

// 验证JWT令牌
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，请提供有效的令牌'
      })
    }
    
    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，令牌不存在'
      })
    }
    
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 查找用户
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '令牌无效，用户不存在'
      })
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      })
    }
    
    req.user = user
    next()
    
  } catch (error) {
    logger.error('认证中间件错误:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '令牌无效'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期'
      })
    }
    
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

// 可选认证（用户可能已登录也可能未登录）
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }
    
    const token = authHeader.substring(7)
    
    if (!token) {
      return next()
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    
    if (user && user.isActive) {
      req.user = user
    }
    
    next()
    
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next()
  }
}

// 检查用户权限
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，请先登录'
      })
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }
    
    next()
  }
}

// 检查资源所有权
export const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam]
      const resource = await resourceModel.findById(resourceId)
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        })
      }
      
      if (resource.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: '无权访问此资源'
        })
      }
      
      req.resource = resource
      next()
      
    } catch (error) {
      logger.error('权限检查错误:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }
}

// 生成JWT令牌
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  )
}

// 验证令牌（不抛出异常）
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}