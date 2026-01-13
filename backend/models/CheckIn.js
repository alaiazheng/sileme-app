import mongoose from 'mongoose'

const checkInSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mood: {
    type: String,
    enum: ['很好', '开心', '一般', '不好', '正常'],
    default: '正常'
  },
  note: {
    type: String,
    maxlength: [200, '备注最多200个字符'],
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    },
    address: String
  },
  weather: {
    temperature: Number,
    condition: String,
    humidity: Number
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 索引
checkInSchema.index({ user: 1, date: -1 })
checkInSchema.index({ user: 1, createdAt: -1 })
checkInSchema.index({ date: -1 })
checkInSchema.index({ location: '2dsphere' })

// 复合索引 - 确保每个用户每天只能打卡一次
checkInSchema.index(
  { 
    user: 1, 
    date: 1 
  }, 
  { 
    unique: true,
    partialFilterExpression: {
      date: { $type: 'date' }
    }
  }
)

// 虚拟字段 - 格式化日期
checkInSchema.virtual('dateFormatted').get(function() {
  return this.date.toISOString().split('T')[0]
})

// 中间件 - 保存前处理日期（确保是当天的开始时间）
checkInSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('date')) {
    const date = new Date(this.date)
    // 设置为当天的开始时间（00:00:00）
    date.setHours(0, 0, 0, 0)
    this.date = date
  }
  next()
})

// 静态方法 - 获取用户的打卡统计
checkInSchema.statics.getUserStats = async function(userId) {
  const checkIns = await this.find({ user: userId }).sort({ date: 1 })
  
  if (checkIns.length === 0) {
    return {
      totalCheckIns: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastCheckIn: null
    }
  }
  
  const totalCheckIns = checkIns.length
  const lastCheckIn = checkIns[checkIns.length - 1].date
  
  // 计算连续天数
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // 检查最后一次打卡是否是今天或昨天
  const lastCheckInDate = new Date(lastCheckIn)
  lastCheckInDate.setHours(0, 0, 0, 0)
  
  if (lastCheckInDate.getTime() === today.getTime() || 
      lastCheckInDate.getTime() === yesterday.getTime()) {
    currentStreak = 1
    
    // 向前计算连续天数
    for (let i = checkIns.length - 2; i >= 0; i--) {
      const currentDate = new Date(checkIns[i + 1].date)
      const prevDate = new Date(checkIns[i].date)
      
      currentDate.setHours(0, 0, 0, 0)
      prevDate.setHours(0, 0, 0, 0)
      
      const diffTime = currentDate.getTime() - prevDate.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      
      if (diffDays === 1) {
        currentStreak++
      } else {
        break
      }
    }
  }
  
  // 计算最长连续天数
  for (let i = 1; i < checkIns.length; i++) {
    const currentDate = new Date(checkIns[i].date)
    const prevDate = new Date(checkIns[i - 1].date)
    
    currentDate.setHours(0, 0, 0, 0)
    prevDate.setHours(0, 0, 0, 0)
    
    const diffTime = currentDate.getTime() - prevDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    
    if (diffDays === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)
  
  return {
    totalCheckIns,
    currentStreak,
    longestStreak,
    lastCheckIn
  }
}

// 静态方法 - 检查今天是否已打卡
checkInSchema.statics.hasCheckedInToday = async function(userId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const checkIn = await this.findOne({
    user: userId,
    date: {
      $gte: today,
      $lt: tomorrow
    }
  })
  
  return !!checkIn
}

export default mongoose.model('CheckIn', checkInSchema)