import mongoose from 'mongoose'
import { formatDateTime } from '../utils/dateFormatter.js'

const pushTaskSchema = new mongoose.Schema({
  // 基本信息
  title: {
    type: String,
    required: [true, '推送标题不能为空'],
    maxlength: [100, '标题不能超过100个字符'],
    trim: true
  },
  content: {
    type: String,
    required: [true, '推送内容不能为空'],
    maxlength: [1000, '内容不能超过1000个字符'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [200, '描述不能超过200个字符'],
    trim: true
  },
  type: {
    type: String,
    required: [true, '推送类型不能为空'],
    enum: {
      values: ['notification', 'message', 'announcement'],
      message: '无效的推送类型'
    },
    default: 'notification'
  },
  
  // 推送方式
  pushMode: {
    type: String,
    required: [true, '推送方式不能为空'],
    enum: {
      values: ['immediate', 'scheduled', 'recurring'],
      message: '无效的推送方式'
    },
    default: 'immediate'
  },
  
  // 定时推送配置
  scheduledTime: {
    type: Date,
    validate: {
      validator: function(value) {
        // 如果是定时推送模式但没有设置时间，返回false
        if (this.pushMode === 'scheduled' && !value) {
          return false
        }
        
        // 只有在设置scheduledTime值时才验证时间
        // 避免在系统更新任务状态时触发验证
        if (value && this.isModified('scheduledTime')) {
          return value > new Date()
        }
        
        return true
      },
      message: '定时推送时间必须大于当前时间'
    }
  },
  
  // 循环推送配置
  recurringConfig: {
    type: {
      type: String,
      enum: {
        values: ['interval', 'daily'],
        message: '无效的循环类型'
      }
    },
    interval: {
      type: Number,
      min: [1, '间隔时间必须大于0']
    },
    intervalUnit: {
      type: String,
      enum: {
        values: ['minutes', 'hours', 'days'],
        message: '无效的时间单位'
      }
    },
    dailyTime: {
      type: String,
      pattern: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, '时间格式无效，应为HH:mm']
    },
    nextExecutionTime: {
      type: Date
    },
    executedCount: {
      type: Number,
      default: 0,  // 初始执行次数为0
      min: [0, '执行次数不能为负数'],  // 修改最小值验证
      max: [100, '执行次数不能超过100'],
      validate: {
        validator: function(value) {
          return Number.isInteger(value)
        },
        message: '执行次数必须为整数'
      }
    },
    maxExecutions: {
      type: Number,
      required: [true, '循环任务必须设置最大执行次数'],
      min: [1, '最大执行次数必须大于0'],
      max: [1000, '最大执行次数不能超过1000']
    }
  },
  
  // 目标用户配置
  targetType: {
    type: String,
    required: [true, '目标用户类型不能为空'],
    enum: {
      values: ['all', 'specific', 'role'],
      message: '无效的目标用户类型'
    },
    default: 'all'
  },
  targetUserIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(value) {
        if (this.targetType === 'specific' && (!value || value.length === 0)) {
          return false
        }
        return true
      },
      message: '指定用户时必须选择至少一个用户'
    }
  }],
  targetRoleIds: [{
    type: String,
    validate: {
      validator: function(value) {
        if (this.targetType === 'role' && (!value || value.length === 0)) {
          return false
        }
        return true
      },
      message: '角色用户时必须选择至少一个角色'
    }
  }],
  
  // 推送成功通知配置
  notifyOnSuccess: {
    type: Boolean,
    default: false,
    description: '推送成功后是否推送消息给用户'
  },
  successNotificationTitle: {
    type: String,
    maxlength: [100, '成功通知标题不能超过100个字符'],
    trim: true,
    validate: {
      validator: function(value) {
        if (this.notifyOnSuccess && !value) {
          return false
        }
        return true
      },
      message: '启用成功通知时必须设置通知标题'
    }
  },
  successNotificationContent: {
    type: String,
    maxlength: [500, '成功通知内容不能超过500个字符'],
    trim: true,
    validate: {
      validator: function(value) {
        if (this.notifyOnSuccess && !value) {
          return false
        }
        return true
      },
      message: '启用成功通知时必须设置通知内容'
    }
  },
  
  // 启停状态
  status: {
    type: String,
    required: [true, '状态不能为空'],
    enum: {
      values: ['active', 'inactive'],
      message: '无效的状态'
    },
    default: 'active'
  },
  
  // 推送执行状态（系统自动控制，前端不可编辑）
  pushStatus: {
    type: String,
    required: [true, '推送状态不能为空'],
    enum: {
      values: ['draft', 'sending', 'sent', 'failed', 'completed'],
      message: '无效的推送状态'
    },
    default: 'draft'
  },
  
  // 执行历史
  executionHistory: [{
    executionTime: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true
    },
    sentCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    errorMessage: String,
    // 添加执行次数信息
    executionCount: {
      type: Number,
      description: '当前执行次数'
    },
    maxExecutions: {
      type: Number,
      description: '最大执行次数'
    }
  }],
  
  // 统计信息
  totalSent: {
    type: Number,
    default: 0,
    min: [0, '总发送数不能为负数']
  },
  totalRead: {
    type: Number,
    default: 0,
    min: [0, '总阅读数不能为负数']
  },
  
  // 创建者信息
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '创建者不能为空']
  },
  createdByUsername: {
    type: String,
    required: [true, '创建者用户名不能为空']
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastExecutedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 虚拟字段：格式化后的定时时间
pushTaskSchema.virtual('formattedScheduledTime').get(function() {
  if (this.scheduledTime) {
    return formatDateTime(this.scheduledTime)
  }
  return null
})

// 虚拟字段：下次执行时间
pushTaskSchema.virtual('formattedNextExecutionTime').get(function() {
  if (this.recurringConfig?.nextExecutionTime) {
    return formatDateTime(this.recurringConfig.nextExecutionTime)
  }
  return null
})

// 虚拟字段：循环配置描述
pushTaskSchema.virtual('recurringDescription').get(function() {
  if (this.pushMode !== 'recurring' || !this.recurringConfig) {
    return null
  }
  
  const config = this.recurringConfig
  if (config.type === 'interval') {
    const unitMap = {
      minutes: '分钟',
      hours: '小时',
      days: '天'
    }
    return `每${config.interval}${unitMap[config.intervalUnit] || '分钟'}`
  } else if (config.type === 'daily') {
    return `每日${config.dailyTime}`
  }
  return null
})

// 索引
pushTaskSchema.index({ createdBy: 1, createdAt: -1 })
pushTaskSchema.index({ status: 1, createdAt: -1 })
pushTaskSchema.index({ pushMode: 1, status: 1 })
pushTaskSchema.index({ scheduledTime: 1, status: 1 })
pushTaskSchema.index({ 'recurringConfig.nextExecutionTime': 1, status: 1 })

// 中间件：更新时自动更新updatedAt
pushTaskSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// 中间件：更新时自动更新updatedAt
pushTaskSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() })
  next()
})

// 静态方法：获取活跃的定时任务
pushTaskSchema.statics.getActiveScheduledTasks = function() {
  return this.find({
    pushMode: 'scheduled',
    status: 'active',
    pushStatus: 'draft',
    scheduledTime: { $lte: new Date() }
  }).populate('createdBy', 'username email')
}

// 静态方法：获取活跃的循环任务
pushTaskSchema.statics.getActiveRecurringTasks = function() {
  return this.find({
    pushMode: 'recurring',
    status: 'active',
    pushStatus: { $in: ['draft', 'sending'] }, // 只查询未完成的任务
    'recurringConfig.nextExecutionTime': { $lte: new Date() }
  }).populate('createdBy', 'username email')
}

// 实例方法：添加执行记录
pushTaskSchema.methods.addExecutionRecord = function(record) {
  this.executionHistory.push(record)
  this.lastExecutedAt = record.executionTime
  this.totalSent += record.sentCount || 0
  
  // 注意：执行次数的递增现在在服务层处理，这里不再重复递增
  // 这样可以确保执行次数的准确性和持久化
  
  // 使用findByIdAndUpdate避免触发验证器，但不更新pushStatus字段
  return this.constructor.findByIdAndUpdate(
    this._id,
    {
      $push: { executionHistory: record },
      lastExecutedAt: record.executionTime,
      $inc: { totalSent: record.sentCount || 0 },
      updatedAt: new Date()
    },
    { 
      new: true,
      // 确保不更新pushStatus字段
      runValidators: false
    }
  )
}

// 实例方法：计算下次执行时间
pushTaskSchema.methods.calculateNextExecutionTime = function() {
  if (this.pushMode !== 'recurring' || !this.recurringConfig) {
    return null
  }
  
  const now = new Date()
  const config = this.recurringConfig
  
  if (config.type === 'interval' && config.interval && config.intervalUnit) {
    const intervalMs = this.getIntervalMilliseconds(config.interval, config.intervalUnit)
    return new Date(now.getTime() + intervalMs)
  } else if (config.type === 'daily' && config.dailyTime) {
    const [hours, minutes] = config.dailyTime.split(':').map(Number)
    const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
    
    if (todayTime <= now) {
      todayTime.setDate(todayTime.getDate() + 1)
    }
    
    return todayTime
  }
  
  return null
}

// 实例方法：获取间隔时间的毫秒数
pushTaskSchema.methods.getIntervalMilliseconds = function(interval, unit) {
  switch (unit) {
    case 'minutes':
      return interval * 60 * 1000
    case 'hours':
      return interval * 60 * 60 * 1000
    case 'days':
      return interval * 24 * 60 * 60 * 1000
    default:
      return interval * 60 * 1000
  }
}

const PushTask = mongoose.model('PushTask', pushTaskSchema)

export default PushTask 