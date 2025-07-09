import mongoose from 'mongoose'
import ChatMessage from '../models/chatMessage.js'

class ChatHistoryService {
  constructor() {
    this.isInitialized = false
  }

  // 初始化服务
  async initialize() {
    if (this.isInitialized) {
      return
    }
    
    try {
      // 确保数据库连接
      if (ChatMessage.db.readyState !== 1) {
        throw new Error('数据库未连接')
      }
      
      this.isInitialized = true
      console.log('✅ 聊天记录服务初始化成功')
    } catch (error) {
      console.error('❌ 聊天记录服务初始化失败:', error)
      throw error
    }
  }

  // 生成会话ID
  generateSessionId(userId) {
    return `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 创建空会话
  async createEmptySession(userId, options = {}) {
    try {
      await this.initialize()
      
      const {
        title = '新会话',
        service = 'openrouter',
        model = null
      } = options

      // 如果服务类型是'auto'，转换为'openrouter'
      const finalService = service === 'auto' ? 'openrouter' : service

      // 生成会话ID
      const sessionId = this.generateSessionId(userId)
      
      // 创建一个系统消息作为会话的初始化
      const systemMessage = new ChatMessage({
        userId,
        sessionId,
        content: title,
        role: 'system',
        service: finalService,
        model,
        context: '',
        messageIndex: 0,
        status: 'completed',
        metadata: {
          sessionTitle: title,
          isSessionInit: true
        }
      })

      await systemMessage.save()
      console.log(`✅ 空会话已创建: ${userId} - ${sessionId} - 标题: ${title}`)
      
      // 返回与会话列表一致的数据结构
      return {
        sessionId,
        title: title,
        messageCount: 1,
        createdAt: systemMessage.createdAt,
        updatedAt: systemMessage.updatedAt,
        service: finalService,
        model: model
      }
    } catch (error) {
      console.error('❌ 创建空会话失败:', error)
      throw error
    }
  }

  // 保存用户消息
  async saveUserMessage(userId, sessionId, content, service = 'openrouter', model = null, messageIndex = null) {
    try {
      await this.initialize()
      
      // 如果没有提供messageIndex，自动计算
      if (messageIndex === null || messageIndex === undefined) {
        const count = await ChatMessage.countDocuments({ sessionId })
        messageIndex = count
      }
      
      const userMessage = new ChatMessage({
        userId,
        sessionId,
        content,
        role: 'user',
        service,
        model,
        context: '',
        messageIndex,
        status: 'completed'
      })

      await userMessage.save()
      console.log(`✅ 用户消息已保存: ${userId} - ${sessionId} - messageIndex: ${messageIndex}`)
      
      // 如果是会话的第一条用户消息，更新系统消息的标题
      if (messageIndex === 0) {
        // 检查是否已经有其他用户消息（除了系统消息）
        const existingUserMessages = await ChatMessage.countDocuments({
          sessionId,
          role: 'user'
        })
        
        // 只有当这是第一条用户消息时才更新标题
        if (existingUserMessages === 1) {
          const title = content.length > 50 ? content.substring(0, 50) + '...' : content
          await ChatMessage.findOneAndUpdate(
            { sessionId, role: 'system', 'metadata.isSessionInit': true },
            { 
              content: title,
              'metadata.sessionTitle': title
            }
          )
          console.log(`✅ 会话标题已更新: ${title}`)
        }
      }
      
      return userMessage
    } catch (error) {
      console.error('❌ 保存用户消息失败:', error)
      throw error
    }
  }

  // 保存AI回复消息
  async saveAssistantMessage(userId, sessionId, content, service = 'openrouter', model = null, options = {}) {
    try {
      await this.initialize()
      
      const {
        chunkCount = null,
        responseTime = null,
        status = 'completed',
        error = null,
        metadata = {},
        messageIndex = null
      } = options

      // 如果没有提供messageIndex，自动计算
      let finalMessageIndex = messageIndex
      if (finalMessageIndex === null || finalMessageIndex === undefined) {
        const count = await ChatMessage.countDocuments({ sessionId })
        finalMessageIndex = count
      }

      const assistantMessage = new ChatMessage({
        userId,
        sessionId,
        content,
        role: 'assistant',
        service,
        model,
        chunkCount,
        responseTime,
        status,
        error,
        metadata,
        messageIndex: finalMessageIndex
      })

      await assistantMessage.save()
      console.log(`✅ AI回复已保存: ${userId} - ${sessionId} - messageIndex: ${finalMessageIndex}`)
      return assistantMessage
    } catch (error) {
      console.error('❌ 保存AI回复失败:', error)
      throw error
    }
  }

  // 获取用户历史记录
  async getUserHistory(userId, options = {}) {
    try {
      await this.initialize()
      
      const {
        page = 1,
        limit = 20,
        sessionId = null,
        startDate = null,
        endDate = null,
        service = null,
        model = null
      } = options

      const messages = await ChatMessage.getUserHistory(userId, {
        page,
        limit,
        sessionId,
        startDate,
        endDate,
        service,
        model
      })

      // 按会话分组
      const sessions = {}
      messages.forEach(message => {
        if (!sessions[message.sessionId]) {
          sessions[message.sessionId] = []
        }
        sessions[message.sessionId].push(message)
      })

      // 按时间排序每个会话内的消息
      Object.keys(sessions).forEach(sessionId => {
        sessions[sessionId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      })

      return {
        messages,
        sessions,
        total: messages.length
      }
    } catch (error) {
      console.error('❌ 获取用户历史记录失败:', error)
      throw error
    }
  }

  // 获取用户会话列表
  async getUserSessions(userId, options = {}) {
    try {
      await this.initialize()
      
      const { page = 1, limit = 20 } = options
      const sessions = await ChatMessage.getUserSessions(userId, { page, limit })
      
      return sessions
    } catch (error) {
      console.error('❌ 获取用户会话列表失败:', error)
      throw error
    }
  }

  // 获取会话详情
  async getSessionDetails(userId, sessionId) {
    try {
      await this.initialize()
      
      const messages = await ChatMessage.find({
        userId,
        sessionId,
        role: { $ne: 'system' } // 排除系统消息，只返回用户和助手的对话
      }).sort({ createdAt: 1 }).lean()

      return messages
    } catch (error) {
      console.error('❌ 获取会话详情失败:', error)
      throw error
    }
  }

  // 清除用户历史记录
  async clearUserHistory(userId, sessionId = null) {
    try {
      await this.initialize()
      
      const result = await ChatMessage.clearUserHistory(userId, sessionId)
      console.log(`✅ 历史记录已清除: ${userId}${sessionId ? ` - ${sessionId}` : ''}`)
      return result
    } catch (error) {
      console.error('❌ 清除历史记录失败:', error)
      throw error
    }
  }

  // 获取用户统计信息
  async getUserStats(userId) {
    try {
      await this.initialize()
      
      const stats = await ChatMessage.getUserStats(userId)
      return stats[0] || {
        totalMessages: 0,
        totalSessions: 0,
        services: [],
        models: [],
        avgResponseTime: 0
      }
    } catch (error) {
      console.error('❌ 获取用户统计信息失败:', error)
      throw error
    }
  }

  // 搜索聊天记录
  async searchMessages(userId, searchTerm, options = {}) {
    try {
      await this.initialize()
      
      const {
        page = 1,
        limit = 20,
        service = null,
        startDate = null,
        endDate = null
      } = options

      const query = {
        userId,
        $or: [
          { content: { $regex: searchTerm, $options: 'i' } },
          { context: { $regex: searchTerm, $options: 'i' } }
        ]
      }

      if (service) {
        query.service = service
      }

      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
      }

      const messages = await ChatMessage.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()

      return messages
    } catch (error) {
      console.error('❌ 搜索聊天记录失败:', error)
      throw error
    }
  }

  // 更新消息状态
  async updateMessageStatus(messageId, status, error = null) {
    try {
      await this.initialize()
      
      const result = await ChatMessage.findByIdAndUpdate(
        messageId,
        { status, error },
        { new: true }
      )

      return result
    } catch (error) {
      console.error('❌ 更新消息状态失败:', error)
      throw error
    }
  }

  // 批量删除消息
  async deleteMessages(messageIds) {
    try {
      await this.initialize()
      
      const result = await ChatMessage.deleteMany({
        _id: { $in: messageIds }
      })

      console.log(`✅ 批量删除消息完成: ${result.deletedCount} 条`)
      return result
    } catch (error) {
      console.error('❌ 批量删除消息失败:', error)
      throw error
    }
  }

  // 导出用户数据
  async exportUserData(userId, format = 'json') {
    try {
      await this.initialize()
      
      const messages = await ChatMessage.find({ userId })
        .sort({ createdAt: 1 })
        .lean()

      if (format === 'json') {
        return {
          userId,
          exportTime: new Date().toISOString(),
          totalMessages: messages.length,
          messages
        }
      } else if (format === 'csv') {
        // 简单的CSV格式
        const csvHeader = '时间,角色,服务,模型,内容,状态\n'
        const csvRows = messages.map(msg => 
          `${msg.createdAt},${msg.role},${msg.service},${msg.model || ''},"${msg.content.replace(/"/g, '""')}",${msg.status}`
        ).join('\n')
        
        return csvHeader + csvRows
      }

      throw new Error('不支持的导出格式')
    } catch (error) {
      console.error('❌ 导出用户数据失败:', error)
      throw error
    }
  }
}

// 创建单例实例
const chatHistoryService = new ChatHistoryService()

export default chatHistoryService 