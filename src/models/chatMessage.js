import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema({
  // 用户信息
  userId: {
    type: String,
    required: [true, '用户ID不能为空'],
    index: true
  },
  
  // 消息内容
  content: {
    type: String,
    required: [true, '消息内容不能为空'],
    maxlength: [10000, '消息内容不能超过10000字符']
  },
  
  // 消息角色
  role: {
    type: String,
    required: [true, '消息角色不能为空'],
    enum: {
      values: ['user', 'assistant', 'system'],
      message: '无效的消息角色'
    }
  },
  
  // AI服务信息
  service: {
    type: String,
    required: [true, 'AI服务不能为空'],
    enum: {
      values: ['openrouter', 'auto'],
      message: '无效的AI服务'
    }
  },
  
  // 模型信息
  model: {
    type: String,
    default: null,
    description: '使用的AI模型名称'
  },
  
  // 对话上下文
  context: {
    type: String,
    default: '',
    maxlength: [1000, '上下文不能超过1000字符']
  },
  
  // 对话会话ID（用于分组对话）
  sessionId: {
    type: String,
    required: [true, '会话ID不能为空'],
    index: true
  },
  
  // 消息序号（在会话中的顺序）
  messageIndex: {
    type: Number,
    required: [true, '消息序号不能为空'],
    min: [0, '消息序号不能为负数']
  },
  
  // 流式响应信息
  chunkCount: {
    type: Number,
    default: null,
    description: '流式响应的块数'
  },
  
  // 响应时间
  responseTime: {
    type: Number,
    default: null,
    description: '响应时间（毫秒）'
  },
  
  // 状态信息
  status: {
    type: String,
    required: [true, '状态不能为空'],
    enum: {
      values: ['sending', 'completed', 'failed', 'cancelled'],
      message: '无效的状态'
    },
    default: 'completed'
  },
  
  // 错误信息
  error: {
    type: String,
    default: null,
    description: '错误信息（如果有）'
  },
  
  // 元数据
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    description: '额外的元数据信息'
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  collection: 'chat_messages' // 指定集合名称
})

// 创建复合索引
chatMessageSchema.index({ userId: 1, sessionId: 1, messageIndex: 1 })
chatMessageSchema.index({ userId: 1, createdAt: -1 })
chatMessageSchema.index({ sessionId: 1, createdAt: -1 })

// 虚拟字段：完整对话内容
chatMessageSchema.virtual('fullContent').get(function() {
  return this.content
})

// 实例方法：获取对话伙伴的消息
chatMessageSchema.methods.getPartnerMessage = function() {
  const partnerRole = this.role === 'user' ? 'assistant' : 'user'
  return this.model('ChatMessage').findOne({
    sessionId: this.sessionId,
    role: partnerRole,
    messageIndex: this.messageIndex
  })
}

// 静态方法：获取用户的完整对话历史
chatMessageSchema.statics.getUserHistory = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sessionId = null,
    startDate = null,
    endDate = null,
    service = null,
    model = null
  } = options

  const query = { userId }
  
  if (sessionId) {
    query.sessionId = sessionId
  }
  
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }
  
  if (service) {
    query.service = service
  }
  
  if (model) {
    query.model = model
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
}

// 静态方法：获取会话列表
chatMessageSchema.statics.getUserSessions = function(userId, options = {}) {
  const { page = 1, limit = 20 } = options

  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$sessionId',
        lastMessage: { $last: '$$ROOT' },
        messageCount: { $sum: 1 },
        firstMessage: { $first: '$$ROOT' },
        systemMessage: {
          $first: {
            $cond: [
              { $eq: ['$role', 'system'] },
              '$$ROOT',
              null
            ]
          }
        }
      }
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $project: {
        sessionId: '$_id',
        title: {
          $cond: [
            { $ne: ['$systemMessage', null] },
            '$systemMessage.content',
            { $substr: ['$firstMessage.content', 0, 50] }
          ]
        },
        messageCount: 1,
        createdAt: '$firstMessage.createdAt',
        updatedAt: '$lastMessage.updatedAt',
        service: '$firstMessage.service',
        model: '$firstMessage.model',
        _id: 0
      }
    }
  ])
}

// 静态方法：清除用户历史记录
chatMessageSchema.statics.clearUserHistory = function(userId, sessionId = null) {
  const query = { userId }
  if (sessionId) {
    query.sessionId = sessionId
  }
  return this.deleteMany(query)
}

// 静态方法：获取统计信息
chatMessageSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        totalSessions: { $addToSet: '$sessionId' },
        services: { $addToSet: '$service' },
        models: { $addToSet: '$model' },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $project: {
        _id: 0,
        totalMessages: 1,
        totalSessions: { $size: '$totalSessions' },
        services: 1,
        models: 1,
        avgResponseTime: 1
      }
    }
  ])
}

// 中间件：保存前处理
chatMessageSchema.pre('save', function(next) {
  // 验证messageIndex是否存在
  if (this.messageIndex === undefined || this.messageIndex === null) {
    return next(new Error('消息序号不能为空，请在保存前设置messageIndex'))
  }
  next()
})

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema)

export default ChatMessage 