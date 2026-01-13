import mongoose from 'mongoose'
import logger from './logger.js'
import memoryDB from './memoryDB.js'

const connectDB = async () => {
  // 如果配置使用内存数据库
  if (process.env.USE_MEMORY_DB === 'true') {
    try {
      await memoryDB.connect()
      return memoryDB
    } catch (error) {
      logger.error('内存数据库连接失败:', error.message)
      process.exit(1)
    }
  }

  // 使用MongoDB
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)

    logger.info(`MongoDB 连接成功: ${conn.connection.host}`)
    
    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB 连接错误:', err)
    })
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB 连接断开')
    })
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB 重新连接成功')
    })
    
  } catch (error) {
    logger.error('数据库连接失败:', error.message)
    
    // 如果MongoDB连接失败，回退到内存数据库
    logger.info('回退到内存数据库模式')
    try {
      await memoryDB.connect()
      return memoryDB
    } catch (memError) {
      logger.error('内存数据库启动失败:', memError.message)
      process.exit(1)
    }
  }
}

export default connectDB