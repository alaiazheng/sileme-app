import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [2, '用户名至少2个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false // 默认查询时不返回密码
  },
  avatar: {
    type: String,
    default: null
  },
  profile: {
    nickname: {
      type: String,
      default: function() { return this.username }
    },
    bio: {
      type: String,
      maxlength: [200, '个人简介最多200个字符']
    },
    birthday: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other'
    }
  },
  settings: {
    notificationEnabled: {
      type: Boolean,
      default: true
    },
    checkInReminder: {
      type: Boolean,
      default: true
    },
    reminderTime: {
      type: String,
      default: '09:00'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    privacy: {
      profilePublic: {
        type: Boolean,
        default: false
      },
      statsPublic: {
        type: Boolean,
        default: false
      }
    }
  },
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    phone: String,
    email: String,
    relationship: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    totalCheckIns: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastCheckIn: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 索引
userSchema.index({ createdAt: -1 })

// 虚拟字段
userSchema.virtual('checkIns', {
  ref: 'CheckIn',
  localField: '_id',
  foreignField: 'user'
})

userSchema.virtual('notifications', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'user'
})

// 中间件 - 保存前加密密码
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// 中间件 - 更新时间戳
userSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// 实例方法 - 验证密码
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// 实例方法 - 更新登录时间
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date()
  return this.save()
}

// 实例方法 - 获取公开信息
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject()
  delete user.password
  delete user.email
  delete user.emergencyContacts
  if (!user.settings.privacy.profilePublic) {
    delete user.profile
  }
  if (!user.settings.privacy.statsPublic) {
    delete user.stats
  }
  return user
}

// 静态方法 - 根据邮箱或用户名查找用户
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select('+password')
}

export default mongoose.model('User', userSchema)