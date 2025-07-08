import { Ollama } from 'ollama'
import dotenv from 'dotenv'
import chatHistoryService from './chatHistoryService.js'

dotenv.config()

// 锁定唯一的本地模型
const LOCAL_MODEL_NAME = 'qwen2.5:7b'

class LocalAIChatService {
  constructor() {
    this.ollama = null
    this.conversationHistory = new Map()
    this.isInitialized = false
    this.modelName = LOCAL_MODEL_NAME
    // 添加取消标记映射
    this.cancelTokens = new Map()
  }

  // 初始化 Ollama 客户端
  async initialize() {
    if (this.isInitialized) {
      return
    }

    try {
      // 支持多种环境变量名称
      const ollamaHost = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST || 'http://localhost:11434'
      
      console.log(`尝试连接 Ollama 服务: ${ollamaHost}`)
      
      this.ollama = new Ollama({
        host: ollamaHost,
        // 增加超时配置
        request: {
          timeout: 30000, // 30秒超时
          keepAlive: true,
          keepAliveMsecs: 1000,
        }
      })
      
      // 测试连接
      await this.testConnection()
      
      this.isInitialized = true
      console.log('Ollama 客户端初始化成功')
      console.log(`连接地址: ${ollamaHost}`)
      console.log(`固定使用本地模型: ${this.modelName}`)
    } catch (error) {
      console.error('Ollama 客户端初始化失败:', error)
      throw new Error(`Ollama 连接失败: ${error.message}`)
    }
  }

  // 测试 Ollama 连接
  async testConnection() {
    try {
      console.log('测试 Ollama 连接...')
      const response = await this.ollama.list()
      console.log('✅ Ollama 连接成功')
      return true
    } catch (error) {
      console.error('❌ Ollama 连接失败:', error.message)
      console.error('请确保 Ollama 服务正在运行:')
      console.error('1. 检查 Ollama 是否已安装')
      console.error('2. 启动 Ollama 服务: ollama serve')
      console.error('3. 检查端口 11434 是否被占用')
      throw new Error(`Ollama 服务不可用: ${error.message}`)
    }
  }

  // 初始化用户对话历史
  initializeConversation(userId) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, [])
    }
  }

  // 检查并确保唯一的模型可用
  async checkModel() {
    try {
      console.log('开始检查模型可用性...')
      console.log(`目标模型: ${this.modelName}`)
      
      const models = await this.ollama.list()
      console.log('已安装的模型列表:', models.models.map(m => m.name))
      
      const modelExists = models.models.some((model) => model.name === this.modelName)

      if (!modelExists) {
        console.log(`模型 ${this.modelName} 不存在，正在为您自动下载...`)
        console.log('这可能需要一些时间，请耐心等待。')
        
        try {
          await this.ollama.pull({ name: this.modelName })
          console.log(`✅ 模型 ${this.modelName} 下载完成`)
        } catch (pullError) {
          console.error(`❌ 模型下载失败: ${pullError.message}`)
          console.error('请手动运行以下命令下载模型:')
          console.error(`ollama pull ${this.modelName}`)
          return false
        }
      } else {
        console.log(`✅ 模型 ${this.modelName} 已存在`)
      }

      return true
    } catch (error) {
      console.error(`检查或下载模型失败: ${error.message}`)
      console.error('请确保 Ollama 服务正在运行，并且可以访问网络。')
      console.error('检查步骤:')
      console.error('1. 确保 Ollama 服务已启动')
      console.error('2. 检查网络连接')
      console.error('3. 手动下载模型: ollama pull qwen2.5:7b')
      return false
    }
  }

  // 发送消息给AI（流式输出）
  async *sendMessage(userId, message, context = '') {
    try {
      // 确保 Ollama 客户端已初始化
      if (!this.isInitialized) {
        await this.initialize()
      }

      if (!this.ollama) {
        throw new Error('本地 AI 服务未配置，请检查 Ollama 是否已安装并运行')
      }

      // 检查并确保模型可用
      const modelAvailable = await this.checkModel()
      if (!modelAvailable) {
        throw new Error('AI 模型不可用，请检查模型是否正确下载')
      }

      this.initializeConversation(userId)
      const history = this.conversationHistory.get(userId)

      // 生成取消令牌
      const cancelToken = `${userId}_${Date.now()}`
      this.cancelTokens.set(userId, cancelToken)

      // 生成/获取 sessionId（同一天同一用户为同一会话）
      const today = new Date().toISOString().slice(0, 10)
      const sessionId = `${userId}_${today}`

      // 获取当前会话最大 messageIndex
      let messageIndex = 0
      try {
        const lastMsg = await chatHistoryService.getSessionDetails(userId, sessionId)
        messageIndex = lastMsg.length
      } catch {}

      // 存储用户消息
      await chatHistoryService.saveUserMessage(userId, sessionId, message, context, 'local', this.modelName, messageIndex)

      const systemPrompt = `
      你是一个智能助手，专门帮助用户解决前端开发相关的问题，包括但不限于 HTML、CSS、JavaScript、React、Vue、TypeScript、前端性能优化、组件设计、调试技巧、跨域处理等。

      系统上下文：${context}

      请用中文回答，保持简洁、友好、专业的态度。回答中尽可能提供清晰的代码示例和解决思路，避免使用难以理解的术语。
      `
      const messages = [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }]

      console.log(`向本地 AI 发送流式请求...`)
      
      // 增加重试机制
      let retryCount = 0
      const maxRetries = 1  // 只重试一次
      let stream = null
      
      while (retryCount <= maxRetries) {
        try {
          stream = await this.ollama.chat({
            model: this.modelName,
            messages: messages,
            stream: true,
            options: {
              temperature: 0.5,        // 降低创造性，提高响应速度
              num_predict: 500,        // 减少最大生成长度
              top_k: 20,              // 减少词汇选择范围
              top_p: 0.8,             // 调整核采样
              repeat_penalty: 1.1,     // 轻微惩罚重复
              num_ctx: 2048,          // 减少上下文长度
            }
          })
          break // 成功获取流，跳出重试循环
        } catch (error) {
          retryCount++
          console.error(`Ollama 请求失败 (尝试 ${retryCount}/${maxRetries + 1}):`, error.message)
          
          if (retryCount > maxRetries) {
            // 重试一次后仍然失败，抛出详细错误信息
            if (error.message.includes('fetch failed') || error.message.includes('Headers Timeout')) {
              throw new Error('AI服务连接超时，请稍后重试')
            } else if (error.message.includes('ECONNREFUSED')) {
              throw new Error('AI服务不可用，请检查Ollama服务是否启动')
            } else if (error.message.includes('ENOTFOUND')) {
              throw new Error('无法连接到AI服务，请检查网络连接')
            } else {
              throw new Error(`AI服务请求失败: ${error.message}`)
            }
          }
          
          // 等待一段时间后重试
          console.log(`等待 ${retryCount} 秒后重试...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        }
      }

      let fullResponse = ''
      let chunkCount = 0
      
      console.log('开始处理流式响应...')
      
      // 增加超时检测
      const startTime = Date.now()
      const maxProcessingTime = 60000 // 60秒最大处理时间
      
      try {
        for await (const chunk of stream) {
          // 检查处理时间是否超时
          if (Date.now() - startTime > maxProcessingTime) {
            console.warn('流式响应处理超时，强制结束')
            break
          }
          
          // 检查是否被取消
          if (this.cancelTokens.get(userId) !== cancelToken) {
            console.log(`用户 ${userId} 的请求已被取消`)
            break
          }

          chunkCount++
          
          if (chunk.message && chunk.message.content) {
            fullResponse += chunk.message.content
            
            // 转换为前端期望的数据格式
            const frontendChunk = {
              message: {
                content: chunk.message.content
              },
              done: chunk.done || false
            }
            
            console.log(`yield 转换后的数据块 ${chunkCount}:`, frontendChunk)
            yield frontendChunk
          } else {
            // 如果没有内容但有其他信息，也传递下去
            console.log(`yield 原始数据块 ${chunkCount}:`, chunk)
            yield chunk
          }
        }
      } catch (streamError) {
        console.error('流式处理过程中发生错误:', streamError)
        throw new Error(`流式响应处理失败: ${streamError.message}`)
      }

      console.log(`流式响应处理完成，共接收 ${chunkCount} 个数据块`)
      console.log(`完整响应内容: ${fullResponse}`)

      // 检查是否被取消
      const wasCancelled = this.cancelTokens.get(userId) !== cancelToken
      
      // 清理取消令牌
      this.cancelTokens.delete(userId)

      // 只有在成功完成、没有被取消、且有有效内容的情况下才保存对话历史
      if (!wasCancelled && fullResponse && fullResponse.trim().length > 0) {
        const timestamp = new Date().toISOString()
        history.push(
          { role: 'user', content: message, timestamp },
          { role: 'assistant', content: fullResponse, timestamp }
        )

        if (history.length > 40) {
          history.splice(0, 20)
        }
        // 存储AI回复
        await chatHistoryService.saveAssistantMessage(userId, sessionId, fullResponse, 'local', this.modelName, {
          chunkCount,
          responseTime: Date.now() - startTime,
          status: 'completed',
          messageIndex: messageIndex + 1
        })
        console.log('流式响应完成，历史记录已更新。')
      } else if (wasCancelled) {
        console.log('流式响应被取消，不保存历史记录。')
      } else {
        console.log('流式响应完成，但内容为空，不保存历史记录。')
      }
    } catch (error) {
      // 清理取消令牌
      this.cancelTokens.delete(userId)
      console.error('本地 AI 聊天流错误:', error)
      // 抛出错误，让控制器能够捕获并处理
      throw error
    }
  }

  // 取消用户正在进行的聊天请求
  cancelMessage(userId) {
    console.log(`取消用户 ${userId} 的聊天请求`)
    
    // 检查是否有活跃请求
    if (!this.hasActiveRequest(userId)) {
      console.log(`用户 ${userId} 没有正在进行的请求`)
      return false
    }
    
    // 通过更新取消令牌来标记取消
    this.cancelTokens.set(userId, `${userId}_${Date.now()}_cancelled`)
    console.log(`用户 ${userId} 的请求已标记为取消`)
    return true
  }

  // 检查用户是否有正在进行的请求
  hasActiveRequest(userId) {
    return this.cancelTokens.has(userId)
  }

  // 清除用户对话历史
  clearHistory(userId) {
    this.conversationHistory.delete(userId)
  }

  // 获取用户对话历史
  getHistory(userId) {
    return this.conversationHistory.get(userId) || []
  }

  // 获取可用的模型列表
  async getAvailableModels() {
    try {
      // 确保 Ollama 客户端已初始化
      if (!this.isInitialized) {
        await this.initialize()
      }

      if (!this.ollama) {
        throw new Error('Ollama 客户端未初始化')
      }

      console.log('获取 Ollama 模型列表...')
      const response = await this.ollama.list()
      
      const models = response.models.map(model => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at,
        digest: model.digest,
        details: model.details || {}
      }))

      console.log(`找到 ${models.length} 个可用模型`)
      return models
    } catch (error) {
      console.error('获取模型列表失败:', error.message)
      throw new Error(`获取模型列表失败: ${error.message}`)
    }
  }

  // 获取当前使用的模型
  getCurrentModel() {
    return {
      name: this.modelName,
      description: '当前使用的本地模型',
      type: 'local'
    }
  }
}

// 创建单例实例，但不立即初始化
const localAIChatService = new LocalAIChatService()

export default localAIChatService
