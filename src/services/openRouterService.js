import dotenv from 'dotenv'
import chatHistoryService from './chatHistoryService.js'
import { getCurrentDateTime } from '../utils/dateFormatter.js'

dotenv.config()

class OpenRouterService {
  constructor() {
    this.client = null
    this.isInitialized = false
    this.conversationHistory = new Map()
    this.cancelTokens = new Map()
    
    // OpenRouter免费模型列表
    this.freeModels = [
      'mistralai/mistral-7b-instruct',
      'meta-llama/llama-2-7b-chat',
      'google/gemma-7b-it',
      'microsoft/phi-2',
      'nousresearch/nous-hermes-llama2-7b',
      'openchat/openchat-3.5',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-2-13b-chat',
      'microsoft/phi-3-mini-4k-instruct',
      'microsoft/phi-3-mini-128k-instruct'
    ]
    
    // 默认使用免费模型
    this.defaultModel = 'mistralai/mistral-7b-instruct'
  }

  // 初始化OpenRouter客户端
  async initialize() {
    if (this.isInitialized) {
      return
    }

    try {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) {
        throw new Error('未配置OPENROUTER_API_KEY环境变量')
      }

      // 使用fetch API直接调用OpenRouter
      this.apiKey = apiKey
      this.baseURL = 'https://openrouter.ai/api/v1'
      this.headers = {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:8888',
        'X-Title': 'Express Admin Chat',
        'Content-Type': 'application/json'
      }

      this.isInitialized = true
      console.log('✅ OpenRouter 客户端初始化成功')
      console.log(`默认模型: ${this.defaultModel}`)
    } catch (error) {
      console.error('❌ OpenRouter 客户端初始化失败:', error)
      throw new Error(`OpenRouter 连接失败: ${error.message}`)
    }
  }

  // 测试OpenRouter连接
  async testConnection() {
    try {
      console.log('测试 OpenRouter 连接...')
      const response = await fetch(`${this.baseURL}/models`, {
        headers: this.headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ OpenRouter 连接成功')
      console.log(`可用模型数量: ${data.data.length}`)
      return true
    } catch (error) {
      console.error('❌ OpenRouter 连接失败:', error.message)
      throw new Error(`OpenRouter 服务不可用: ${error.message}`)
    }
  }

  // 获取可用的免费模型
  async getAvailableModels() {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const response = await fetch(`${this.baseURL}/models`, {
        headers: this.headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const freeModels = data.data.filter(model => 
        this.freeModels.includes(model.id)
      ).map(model => ({
        id: model.id,  // 保持完整的模型ID
        name: model.id.split('/').pop(),  // 显示名称（截断版本）
        displayName: model.id,  // 完整显示名称
        provider: model.id.split('/')[0],
        description: model.description || '免费AI模型',
        pricing: {
          prompt: '免费',
          completion: '免费'
        }
      }))

      return freeModels
    } catch (error) {
      console.error('获取模型列表失败:', error)
      throw new Error(`获取模型列表失败: ${error.message}`)
    }
  }

  // 初始化用户对话历史
  initializeConversation(userId) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, [])
    }
  }

  // 发送消息给AI（流式输出）
  async *sendMessage(userId, message, modelName = null, sessionId = null) {
    try {
      // 确保客户端已初始化
      if (!this.isInitialized) {
        await this.initialize()
      }
      if (!this.apiKey) { // 改为检查 this.apiKey
        throw new Error('OpenRouter 服务未配置，请检查API密钥')
      }
      this.initializeConversation(userId)
      const history = this.conversationHistory.get(userId)
      // 生成取消令牌
      const cancelToken = `${userId}_${Date.now()}`
      this.cancelTokens.set(userId, cancelToken)
      
      // 获取或创建 sessionId
      let finalSessionId = sessionId
      
      if (!finalSessionId) {
        // 如果没有指定sessionId，尝试获取用户最近的会话
        try {
          const sessions = await chatHistoryService.getUserSessions(userId, { page: 1, limit: 1 })
          if (sessions && sessions.length > 0) {
            finalSessionId = sessions[0].sessionId
            console.log(`使用最近活跃的会话: ${finalSessionId}`)
          }
        } catch (error) {
          console.log('未找到现有会话')
        }
      } else {
        console.log(`使用指定的会话: ${finalSessionId}`)
      }
      
      // 如果没有会话，创建新会话
      if (!finalSessionId) {
        finalSessionId = chatHistoryService.generateSessionId(userId)
        console.log(`创建新会话: ${finalSessionId}`)
      }
      
      // 获取当前会话最大 messageIndex
      let messageIndex = 0
      try {
        const lastMsg = await chatHistoryService.getSessionDetails(userId, finalSessionId)
        messageIndex = lastMsg.length
      } catch (error) {
        console.log('无法获取会话详情，使用默认值')
      }
      
      // 存储用户消息（可选，如果数据库不可用则跳过）
      try {
        await chatHistoryService.saveUserMessage(userId, finalSessionId, message, 'openrouter', modelName, messageIndex)
      } catch (error) {
        console.log('无法保存用户消息到数据库，继续处理')
      }

      // 处理模型ID，确保使用完整的模型ID
      let model = modelName || this.defaultModel
      
      // 如果传入的是截断的模型名称，尝试找到完整的模型ID
      if (model && !model.includes('/')) {
        const fullModelId = this.freeModels.find(fullId => fullId.endsWith(model))
        if (fullModelId) {
          model = fullModelId
          console.log(`模型名称已转换: ${modelName} -> ${model}`)
        } else {
          // 检查是否是本地模型ID（不包含/的格式）
          if (model.includes(':')) {
            // 这是本地模型ID格式，直接使用
            console.log(`使用本地模型ID: ${model}`)
          } else {
            console.warn(`未找到模型 "${model}" 的完整ID，使用默认模型`)
            model = this.defaultModel
          }
        }
      }

      // 验证模型是否在支持的列表中（对于OpenRouter模型）
      if (model.includes('/') && !this.freeModels.includes(model)) {
        throw new Error(`不支持的OpenRouter模型: ${model}。支持的模型: ${this.freeModels.join(', ')}`)
      }

      const systemPrompt = `
      你是一个智能助手，专门帮助用户解决前端开发相关的问题，包括但不限于 HTML、CSS、JavaScript、React、Vue、TypeScript、前端性能优化、组件设计、调试技巧、跨域处理等。

      请用中文回答，保持简洁、友好、专业的态度。回答中尽可能提供清晰的代码示例和解决思路，避免使用难以理解的术语。

      如果用户输入无意义的内容，介绍你的功能。

      回答结束后要增加一个总结性的句子。
      `

      // 构建消息历史
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ]

      console.log(`向 OpenRouter 发送流式请求，模型: ${model}`)
      
      // 增加重试机制
      let retryCount = 0
      const maxRetries = 2
      let stream = null
      
      while (retryCount <= maxRetries) {
        try {
          const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
              model: model,
              messages: messages,
              stream: true,
              temperature: 0.7,
              max_tokens: 1000,
              top_p: 0.9,
              frequency_penalty: 0.1,
              presence_penalty: 0.1,
              // 增加更多默认参数
              n: 1,
              stop: null,
              logprobs: null,
              echo: false,
              logit_bias: null,
              user: userId
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          stream = response.body
          break // 成功获取流，跳出重试循环
        } catch (error) {
          retryCount++
          console.error(`OpenRouter 请求失败 (尝试 ${retryCount}/${maxRetries + 1}):`, error.message)
          
          if (retryCount > maxRetries) {
            if (error.message.includes('rate limit')) {
              throw new Error('API调用频率超限，请稍后重试')
            } else if (error.message.includes('quota')) {
              throw new Error('API配额已用完，请稍后重试')
            } else if (error.message.includes('timeout')) {
              throw new Error('请求超时，请稍后重试')
            } else {
              throw new Error(`OpenRouter 请求失败: ${error.message}`)
            }
          }
          
          // 等待一段时间后重试
          console.log(`等待 ${retryCount} 秒后重试...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        }
      }

      let fullResponse = ''
      let chunkCount = 0
      
      // 使用fetch API处理流式响应
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            break
          }
          
          // 检查是否被取消
          if (this.cancelTokens.get(userId) !== cancelToken) {
            throw new Error('请求已被用户取消')
          }
          
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                break
              }
              
              try {
                const parsed = JSON.parse(data)
                chunkCount++
                
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const content = parsed.choices[0].delta.content
                  if (content) {
                    fullResponse += content
                    
                    yield {
                      message: {
                        content: content,
                        role: 'assistant'
                      },
                      chunk: chunkCount
                    }
                  }
                }
              } catch (e) {
                // 忽略解析错误
                console.warn('解析流式数据时出错:', e.message)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      // 保存对话历史
      if (fullResponse) {
        history.push({ role: 'user', content: message })
        history.push({ role: 'assistant', content: fullResponse })
        
        // 限制历史记录长度，保留最近10轮对话
        if (history.length > 20) {
          history.splice(0, history.length - 20)
        }
        
        this.conversationHistory.set(userId, history)
        
        // 存储AI回复（可选，如果数据库不可用则跳过）
        try {
          await chatHistoryService.saveAssistantMessage(userId, finalSessionId, fullResponse, 'openrouter', modelName, {
            chunkCount,
            status: 'completed',
            messageIndex: messageIndex + 1
          })
        } catch (error) {
          console.log('无法保存AI回复到数据库')
        }
      }

      // 发送完成信号
      yield {
        message: {
          content: '',
          role: 'assistant'
        },
        chunk: chunkCount,
        done: true,
        fullResponse: fullResponse
      }

      // 清理取消令牌
      if (this.cancelTokens.get(userId) === cancelToken) {
        this.cancelTokens.delete(userId)
      }

    } catch (error) {
      console.error('OpenRouter 流式响应错误:', error)
      
      // 清理取消令牌
      this.cancelTokens.delete(userId)
      
      throw error
    }
  }

  // 生成图片
  async *generateImage(userId, prompt, options = {}) {
    try {
      // 确保客户端已初始化
      if (!this.isInitialized) {
        await this.initialize()
      }
      if (!this.apiKey) { // 改为检查 this.apiKey
        throw new Error('OpenRouter 服务未配置，请检查API密钥')
      }

      const {
        model = 'dall-e-3',
        size = '1024x1024',
        quality = 'standard',
        style = 'vivid'
      } = options

      console.log(`开始生成图片，用户: ${userId}, 提示词: ${prompt}`)
      console.log(`使用模型: ${model}, 尺寸: ${size}, 质量: ${quality}, 风格: ${style}`)

      // 生成取消令牌
      const cancelToken = `${userId}_image_${Date.now()}`
      this.cancelTokens.set(userId, cancelToken)

      // 检查是否被取消
      if (this.cancelTokens.get(userId) !== cancelToken) {
        throw new Error('图片生成被取消')
      }

      // 调用 OpenRouter 的图片生成 API
      const response = await fetch(`${this.baseURL}/images/generations`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          size: size,
          quality: quality,
          style: style,
          n: 1
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // 检查是否被取消
      if (this.cancelTokens.get(userId) !== cancelToken) {
        throw new Error('图片生成被取消')
      }

      const imageUrl = data.data[0].url
      console.log(`图片生成成功: ${imageUrl}`)

      // 返回图片信息
      yield {
        type: 'image',
        url: imageUrl,
        prompt: prompt,
        model: model,
        size: size,
        quality: quality,
        style: style,
        timestamp: getCurrentDateTime()
      }

    } catch (error) {
      console.error('图片生成失败:', error)
      
      if (error.message.includes('被取消')) {
        throw new Error('图片生成被取消')
      }
      
      throw new Error(`图片生成失败: ${error.message}`)
    }
  }

  // 获取支持的图片生成模型
  async getImageModels() {
    return [
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        description: 'OpenRouter 支持的 DALL-E 3 模型，支持高质量图片生成',
        sizes: ['1024x1024', '1792x1024', '1024x1792'],
        qualities: ['standard', 'hd'],
        styles: ['vivid', 'natural']
      },
      {
        id: 'dall-e-2',
        name: 'DALL-E 2',
        description: 'OpenRouter 支持的 DALL-E 2 模型，经典图片生成',
        sizes: ['256x256', '512x512', '1024x1024'],
        qualities: ['standard'],
        styles: ['vivid', 'natural']
      }
    ]
  }

  // 取消消息
  cancelMessage(userId) {
    console.log(`取消用户 ${userId} 的 OpenRouter 请求`)
    this.cancelTokens.delete(userId)
  }

  // 检查是否有活跃请求
  hasActiveRequest(userId) {
    return this.cancelTokens.has(userId)
  }

  // 清除对话历史
  clearHistory(userId) {
    this.conversationHistory.delete(userId)
    this.cancelTokens.delete(userId)
  }

  // 获取对话历史
  getHistory(userId) {
    return this.conversationHistory.get(userId) || []
  }

  // 获取当前使用的模型
  getCurrentModel() {
    return this.defaultModel
  }

  // 设置默认模型
  setDefaultModel(modelName) {
    if (this.freeModels.includes(modelName)) {
      this.defaultModel = modelName
      console.log(`默认模型已更改为: ${modelName}`)
    } else {
      throw new Error(`不支持的模型: ${modelName}`)
    }
  }
}

// 创建单例实例
const openRouterService = new OpenRouterService()

export default openRouterService 