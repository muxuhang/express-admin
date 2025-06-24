import { Ollama } from 'ollama'
import dotenv from 'dotenv'

dotenv.config()

// 锁定唯一的本地模型
const LOCAL_MODEL_NAME = 'qwen2.5:7b'

class LocalAIChatService {
  constructor() {
    this.ollama = null
    this.conversationHistory = new Map()
    this.isInitialized = false
    this.modelName = LOCAL_MODEL_NAME
  }

  // 初始化 Ollama 客户端
  initialize() {
    if (this.isInitialized) {
      return
    }

    try {
      this.ollama = new Ollama({
        host: process.env.OLLAMA_HOST || 'http://localhost:11434',
      })
      this.isInitialized = true
      console.log('Ollama 客户端初始化成功')
      console.log(`固定使用本地模型: ${this.modelName}`)
    } catch (error) {
      console.error('Ollama 客户端初始化失败:', error)
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
      const models = await this.ollama.list()
      const modelExists = models.models.some((model) => model.name === this.modelName)

      if (!modelExists) {
        console.log(`模型 ${this.modelName} 不存在，正在为您自动下载...`)
        console.log('这可能需要一些时间，请耐心等待。')
        await this.ollama.pull({ name: this.modelName })
        console.log(`✅ 模型 ${this.modelName} 下载完成`)
      }

      return true
    } catch (error) {
      console.error(`检查或下载模型失败: ${error.message}`)
      console.error('请确保 Ollama 服务正在运行，并且可以访问网络。')
      return false
    }
  }

  // 发送消息给AI（流式输出）
  async *sendMessage(userId, message, context = '') {
    try {
      // 确保 Ollama 客户端已初始化
      if (!this.isInitialized) {
        this.initialize()
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

      const systemPrompt = `
      你是一个智能助手，专门帮助用户解决前端开发相关的问题，包括但不限于 HTML、CSS、JavaScript、React、Vue、TypeScript、前端性能优化、组件设计、调试技巧、跨域处理等。

      系统上下文：${context}

      请用中文回答，保持简洁、友好、专业的态度。回答中尽可能提供清晰的代码示例和解决思路，避免使用难以理解的术语。
      `
      const messages = [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }]

      console.log(`向本地 AI 发送流式请求...`)
      const stream = await this.ollama.chat({
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

      let fullResponse = ''
      for await (const chunk of stream) {
        if (chunk.message && chunk.message.content) {
          fullResponse += chunk.message.content
        }
        yield chunk // 将原始数据块传递给控制器
      }

      // 流结束后，更新对话历史
      const timestamp = new Date().toISOString()
      history.push(
        { role: 'user', content: message, timestamp },
        { role: 'assistant', content: fullResponse, timestamp }
      )

      if (history.length > 40) {
        history.splice(0, 20)
      }
      console.log('流式响应完成，历史记录已更新。')
    } catch (error) {
      console.error('本地 AI 聊天流错误:', error)
      // 抛出错误，让控制器能够捕获并处理
      throw error
    }
  }

  // 清除用户对话历史
  clearHistory(userId) {
    this.conversationHistory.delete(userId)
  }

  // 获取用户对话历史
  getHistory(userId) {
    return this.conversationHistory.get(userId) || []
  }
}

// 创建单例实例，但不立即初始化
const localAIChatService = new LocalAIChatService()

export default localAIChatService
