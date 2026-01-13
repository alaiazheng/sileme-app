import logger from '../config/logger.js'

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // 记录错误日志
  logger.error(`错误: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = {
      message,
      statusCode: 400
    }
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field} 已存在`
    error = {
      message,
      statusCode: 400
    }
  }

  // Mongoose 无效ObjectId错误
  if (err.name === 'CastError') {
    const message = '资源不存在'
    error = {
      message,
      statusCode: 404
    }
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    const message = '令牌无效'
    error = {
      message,
      statusCode: 401
    }
  }

  // JWT过期错误
  if (err.name === 'TokenExpiredError') {
    const message = '令牌已过期'
    error = {
      message,
      statusCode: 401
    }
  }

  // 文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = '文件大小超出限制'
    error = {
      message,
      statusCode: 400
    }
  }

  // 数据库连接错误
  if (err.name === 'MongoNetworkError') {
    const message = '数据库连接失败'
    error = {
      message,
      statusCode: 500
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  })
}

export default errorHandler