import mongoose from 'mongoose'

const StatisticsSchema = new mongoose.Schema({
  // 用户活动统计
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // 允许为空，支持匿名用户
    default: null
  },
  username: {
    type: String,
    required: true,
    default: 'anonymous'
  },
  
  // 统计类型
  type: {
    type: String,
    enum: ['page_view', 'api_call', 'login', 'logout', 'action', 'error'],
    required: true
  },
  
  // 具体操作
  action: {
    type: String,
    required: true
  },
  
  // 资源路径
  path: {
    type: String,
    required: true
  },
  
  // HTTP方法
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    default: 'GET'
  },
  
  // 响应状态码
  statusCode: {
    type: Number,
    default: 200
  },
  
  // 响应时间（毫秒）
  responseTime: {
    type: Number,
    default: 0
  },
  
  // 请求大小（字节）
  requestSize: {
    type: Number,
    default: 0
  },
  
  // 响应大小（字节）
  responseSize: {
    type: Number,
    default: 0
  },
  
  // IP地址
  ipAddress: {
    type: String,
    required: true
  },
  
  // 用户代理
  userAgent: {
    type: String,
    required: true
  },
  
  // 来源页面
  referer: {
    type: String,
    default: ''
  },
  
  // 额外数据
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // 错误信息（如果有）
  error: {
    message: String,
    stack: String,
    code: String
  },
  
  // 会话ID
  sessionId: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  // 添加索引以提高查询性能
  indexes: [
    { userId: 1, createdAt: -1 },
    { type: 1, createdAt: -1 },
    { action: 1, createdAt: -1 },
    { path: 1, createdAt: -1 },
    { statusCode: 1, createdAt: -1 }
  ]
})

// 创建复合索引
StatisticsSchema.index({ userId: 1, type: 1, createdAt: -1 })
StatisticsSchema.index({ type: 1, action: 1, createdAt: -1 })

// 静态方法：获取用户统计
StatisticsSchema.statics.getUserStats = async function(userId, startDate, endDate) {
  // 如果userId为null或无效，返回空结果
  if (!userId) {
    return []
  }

  const match = { userId: new mongoose.Types.ObjectId(userId) }
  
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }
  
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          type: '$type',
          action: '$action'
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        totalResponseTime: { $sum: '$responseTime' },
        errors: {
          $sum: {
            $cond: [{ $ne: ['$statusCode', 200] }, 1, 0]
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count',
            avgResponseTime: '$avgResponseTime',
            totalResponseTime: '$totalResponseTime',
            errors: '$errors'
          }
        },
        totalCount: { $sum: '$count' },
        totalErrors: { $sum: '$errors' }
      }
    }
  ])
}

// 静态方法：获取系统总体统计
StatisticsSchema.statics.getSystemStats = async function(startDate, endDate) {
  const match = {}
  
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }
  
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          type: '$type',
          action: '$action'
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        avgResponseTime: { $avg: '$responseTime' },
        errors: {
          $sum: {
            $cond: [{ $ne: ['$statusCode', 200] }, 1, 0]
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count',
            uniqueUsers: { $size: '$uniqueUsers' },
            avgResponseTime: '$avgResponseTime',
            errors: '$errors'
          }
        },
        totalCount: { $sum: '$count' },
        totalUniqueUsers: { $addToSet: '$uniqueUsers' }
      }
    },
    {
      $project: {
        _id: 1,
        actions: 1,
        totalCount: 1,
        totalUniqueUsers: { $size: '$totalUniqueUsers' }
      }
    }
  ])
}

// 静态方法：获取热门页面
StatisticsSchema.statics.getPopularPages = async function(startDate, endDate, limit = 10) {
  // 确保参数为数字类型
  const limitNum = parseInt(limit) || 10
  
  const match = { type: 'page_view' }
  
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }
  
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$path',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $project: {
        path: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        avgResponseTime: 1
      }
    },
    { $sort: { count: -1 } },
    { $limit: limitNum }
  ])
}

// 静态方法：获取API性能统计
StatisticsSchema.statics.getApiPerformance = async function(startDate, endDate) {
  const match = { type: 'api_call' }
  
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }
  
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          path: '$path',
          method: '$method'
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' },
        errors: {
          $sum: {
            $cond: [{ $ne: ['$statusCode', 200] }, 1, 0]
          }
        },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        path: '$_id.path',
        method: '$_id.method',
        count: 1,
        avgResponseTime: 1,
        minResponseTime: 1,
        maxResponseTime: 1,
        errorRate: {
          $cond: [
            { $gt: ['$count', 0] },
            {
              $multiply: [
                { $divide: ['$errors', '$count'] },
                100
              ]
            },
            0
          ]
        },
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { count: -1 } }
  ])
}

// 检查模型是否已经存在
const Statistics = mongoose.models.Statistics || mongoose.model('Statistics', StatisticsSchema)

export default Statistics 