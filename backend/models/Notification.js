import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, '通知标题不能为空'],
    maxlength: [100, '标题最多100个字符'],
    trim: true
  },
  message: {
    type: String,
    required: [true, '通知内容不能为空'],
    maxlength: [500, '内容最多500个字符'],
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'emergency', 'success', 'system'],
    default: 'info'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  category: {
    type: String,
    enum: ['checkin', 'reminder', 'system', 'social', 'emergency', 'other'],
    default: 'other'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  scheduledFor: {
    type: Date,
    default: null
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  isSent: {
    type: Boolean,
    default: false
  },
  sentAt: Date,
  channels: [{
    type: String,
    enum: ['push', 'email', 'sms', 'websocket'],
    default: 'push'
  }],
  metadata: {
    source: String,
    actionUrl: String,
    imageUrl: String,
    sound: String
  },
  expiresAt: {
    type: Date,
    default: function() {
      // 默认30天后过期
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 索引
notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, isRead: 1 })
notificationSchema.index({ type: 1, priority: -1 })
notificationSchema.index({ scheduledFor: 1, isScheduled: 1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// 虚拟字段
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date()
})

notificationSchema.virtual('isOverdue').get(function() {
  return this.scheduledFor && this.scheduledFor < new Date() && !this.isSent
})

// 中间件 - 标记为已读时设置读取时间
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date()
  }
  
  if (this.isModified('isSent') && this.isSent && !this.sentAt) {
    this.sentAt = new Date()
  }
  
  next()
})

// 实例方法 - 标记为已读
notificationSchema.methods.markAsRead = function() {
  this.isRead = true
  this.readAt = new Date()
  return this.save()
}

// 实例方法 - 标记为已发送
notificationSchema.methods.markAsSent = function() {
  this.isSent = true
  this.sentAt = new Date()
  return this.save()
}

// 静态方法 - 获取用户未读通知数量
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    user: userId,
    isRead: false,
    expiresAt: { $gt: new Date() }
  })
}

// 静态方法 - 获取待发送的通知
notificationSchema.statics.getPendingNotifications = function() {
  return this.find({
    isScheduled: true,
    isSent: false,
    scheduledFor: { $lte: new Date() },
    expiresAt: { $gt: new Date() }
  }).populate('user', 'username email settings.notificationEnabled')
}

// 静态方法 - 批量标记为已读
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  )
}

// 静态方法 - 清理过期通知
notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  })
}

// 静态方法 - 创建系统通知
notificationSchema.statics.createSystemNotification = function(userId, title, message, data = {}) {
  return this.create({
    user: userId,
    title,
    message,
    type: 'system',
    category: 'system',
    data,
    channels: ['push', 'websocket']
  })
}

// 静态方法 - 创建提醒通知
notificationSchema.statics.createReminderNotification = function(userId, scheduledFor) {
  return this.create({
    user: userId,
    title: '打卡提醒',
    message: '别忘了今天的打卡哦！保持良好的习惯。',
    type: 'info',
    category: 'reminder',
    isScheduled: true,
    scheduledFor,
    channels: ['push', 'websocket'],
    metadata: {
      source: 'system',
      sound: 'default'
    }
  })
}

export default mongoose.model('Notification', notificationSchema)