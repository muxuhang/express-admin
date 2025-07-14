import aiServiceManager from '../services/aiServiceManager.js'
import { validationResult } from 'express-validator'
import mongoose from 'mongoose'
import { getCurrentDateTime } from '../utils/dateFormatter.js'

class ChatController {
  // 检查数据库连接状态
  checkConnection = () => {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('数据库未连接')
    }
  }

  // 发送消息（流式）
  sendMessage = async (req, res) => {
    try {
      this.checkConnection()

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: '请求参数错误',
          errors: errors.array(),
        })
      }

      const { message, service, model, sessionId } = req.body
      const userId = req.body?.userId || req.query.userId || 'anonymous'
      console.log(req.body,req.query)
      console.log(`开始处理用户 ${userId} 的AI聊天流式请求`)
      console.log(`使用服务: ${service || '默认'}, 模型: ${model || '默认'}`)
      if (sessionId) {
        console.log(`指定会话ID: ${sessionId}`)
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })

      console.log('响应头已设置，开始获取流式数据...')

      const options = {
        service: service,
        model: model,
        sessionId: sessionId,
      }

      const stream = aiServiceManager.sendMessage(userId, message, options)
      let chunkCount = 0

      for await (const chunk of stream) {
        chunkCount++
        // console.log(`控制器接收到第 ${chunkCount} 个数据块:`, JSON.stringify(chunk, null, 2));

        // 确保数据块有内容才发送
        if (chunk && (chunk.message?.content || chunk.error)) {
          const dataString = `data: ${JSON.stringify(chunk)}\n\n`

          res.write(dataString)

          // 确保数据立即发送
          if (res.flush) {
            res.flush()
          }
        } else {
          console.log(`跳过空数据块 ${chunkCount}`)
        }
      }

      console.log(`控制器流式响应完成，共处理 ${chunkCount} 个数据块`)
    } catch (error) {
      console.error('聊天控制器流错误:', error.message)

      // 根据错误类型提供不同的错误信息
      let errorMessage = '处理流时发生未知错误'
      let errorCode = 500

      if (error.message.includes('fetch failed') || error.message.includes('Headers Timeout')) {
        errorMessage = 'AI服务连接超时，请稍后重试'
        errorCode = 504
      } else if (error.message.includes('AI服务连接超时')) {
        errorMessage = 'AI服务连接超时，请稍后重试'
        errorCode = 504
      } else if (error.message.includes('AI服务不可用') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'AI服务不可用，请检查服务配置'
        errorCode = 503
      } else if (error.message.includes('无法连接到AI服务') || error.message.includes('ENOTFOUND')) {
        errorMessage = '无法连接到AI服务，请检查网络连接'
        errorCode = 503
      } else if (error.message.includes('OpenRouter 连接失败')) {
        errorMessage = 'OpenRouter服务不可用，请检查API密钥配置'
        errorCode = 503
      } else if (error.message.includes('未配置OPENROUTER_API_KEY')) {
        errorMessage = 'OpenRouter API密钥未配置，请在环境变量中设置OPENROUTER_API_KEY'
        errorCode = 503
      } else if (error.message.includes('模型不可用')) {
        errorMessage = 'AI模型未正确加载，请检查模型状态'
        errorCode = 503
      } else if (error.message.includes('被取消')) {
        errorMessage = '请求已被用户取消'
        errorCode = 499
      } else if (error.message.includes('超时')) {
        errorMessage = '响应时间过长，请稍后重试'
        errorCode = 504
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'API调用频率超限，请稍后重试'
        errorCode = 429
      } else if (error.message.includes('quota')) {
        errorMessage = 'API配额已用完，请稍后重试'
        errorCode = 429
      } else if (error.message.includes('AI服务请求失败')) {
        errorMessage = error.message
        errorCode = 503
      }

      // 如果连接尚未关闭，发送错误事件
      if (!res.writableEnded) {
        const errorPayload = {
          error: true,
          code: errorCode,
          message: errorMessage,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        }
        console.log('发送错误响应:', JSON.stringify(errorPayload, null, 2))
        res.write(`data: ${JSON.stringify(errorPayload)}\n\n`)
      }
    } finally {
      // 确保在任何情况下都关闭连接
      if (!res.writableEnded) {
        console.log('关闭响应流')
        res.end()
      }
    }
  }

  // 获取对话历史
  getHistory = async (req, res) => {
    try {
      // 检查数据库连接
      this.checkConnection()

      const userId = req.body?.userId || req.query.userId || req.body.userId
      const { page = 1, limit = 10, service, sessionId } = req.query

      if (!userId || userId === 'anonymous') {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的用户ID',
        })
      }

      console.log(`获取用户 ${userId} 的历史记录`)

      // 从数据库获取历史记录
      const historyData = await aiServiceManager.getUserHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        service,
        sessionId,
      })

      // 设置缓存控制头，确保每次都获取最新数据
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      })

      res.json({
        code: 0,
        data: {
          userId: userId,
          total: historyData.total,
          page: parseInt(page),
          limit: parseInt(limit),
          messages: historyData.messages,
        },
        message: '获取历史记录成功',
      })
    } catch (error) {
      console.error('获取历史记录错误:', error)

      if (error.message === '数据库未连接') {
        return res.status(503).json({
          code: 503,
          message: '数据库服务暂时不可用，请稍后重试',
        })
      }

      res.status(500).json({
        code: 500,
        message: '获取历史记录失败',
      })
    }
  }

  // 清除对话历史
  clearHistory = async (req, res) => {
    try {
      // 检查数据库连接
      this.checkConnection()

      const userId = req.body?.userId || req.query.userId || 'anonymous'
      const { service } = req.query

      aiServiceManager.clearHistory(userId, service)

      res.json({
        code: 0,
        message: '对话历史已清除',
      })
    } catch (error) {
      console.error('清除历史记录错误:', error)

      if (error.message === '数据库未连接') {
        return res.status(503).json({
          code: 503,
          message: '数据库服务暂时不可用，请稍后重试',
        })
      }

      res.status(500).json({
        code: 500,
        message: '清除历史记录失败',
      })
    }
  }

  // 取消发送消息
  cancelMessage = async (req, res) => {
    try {
      const userId = req.body?.userId || req.query.userId || 'anonymous'
      const { service } = req.query

      console.log(`用户 ${userId} 请求取消消息`)

      aiServiceManager.cancelMessage(userId, service)

      res.json({
        code: 0,
        message: '消息已取消',
      })
    } catch (error) {
      console.error('取消消息错误:', error)
      res.status(500).json({
        code: 500,
        message: '取消消息失败',
      })
    }
  }

  // 检查活跃请求
  checkActiveRequest = async (req, res) => {
    try {
      const userId = req.body?.userId || req.query.userId || 'anonymous'
      const { service } = req.query

      const hasActive = aiServiceManager.hasActiveRequest(userId, service)

      res.json({
        code: 0,
        data: {
          hasActiveRequest: hasActive,
        },
        message: hasActive ? '有活跃请求' : '无活跃请求',
      })
    } catch (error) {
      console.error('检查活跃请求错误:', error)
      res.status(500).json({
        code: 500,
        message: '检查活跃请求失败',
      })
    }
  }

  // 获取可用模型
  getAvailableModels = async (req, res) => {
    try {
      const { service } = req.query
      if (service === 'all') {
        // 合并所有服务模型
        const models = await aiServiceManager.getAllModels()
        res.json({
          code: 0,
          data: {
            models: models,
            currentModel: null,
            currentService: 'all',
          },
          message: '获取全部模型成功',
        })
        return
      }
      const currentService = service || aiServiceManager.getCurrentService()
      console.log(`获取 ${currentService} 服务的可用模型`)
      const models = await aiServiceManager.getAvailableModels(currentService)
      const currentModel = aiServiceManager.getCurrentModel(currentService)
      res.json({
        code: 0,
        data: {
          models: models,
          currentModel: currentModel,
          currentService: currentService,
        },
        message: '获取模型列表成功',
      })
    } catch (error) {
      console.error('获取模型列表错误:', error)
      res.status(500).json({
        code: 500,
        message: '获取模型列表失败',
        error: error.message,
      })
    }
  }

  // 获取服务状态
  getServiceStatus = async (req, res) => {
    try {
      const status = await aiServiceManager.getServiceStatus()
      const currentService = aiServiceManager.getCurrentService()
      const availableServices = aiServiceManager.getAvailableServices()

      res.json({
        code: 0,
        data: {
          status: status,
          currentService: currentService,
          availableServices: availableServices,
        },
        message: '获取服务状态成功',
      })
    } catch (error) {
      console.error('获取服务状态错误:', error)
      res.status(500).json({
        code: 500,
        message: '获取服务状态失败',
        error: error.message,
      })
    }
  }

  // 设置模型
  setModel = async (req, res) => {
    try {
      const { model, service } = req.body

      if (!model) {
        return res.status(400).json({
          code: 400,
          message: '请指定要设置的模型',
        })
      }

      const currentService = service || aiServiceManager.getCurrentService()
      aiServiceManager.setModel(model, currentService)

      res.json({
        code: 0,
        data: {
          model: model,
          service: currentService,
        },
        message: '模型设置成功',
      })
    } catch (error) {
      console.error('设置模型错误:', error)
      res.status(500).json({
        code: 500,
        message: '设置模型失败',
        error: error.message,
      })
    }
  }

  // 生成唯一用户ID
  generateUserId = async (req, res) => {
    try {
      // 生成一个唯一的用户ID（使用时间戳+随机数）
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 10000)
      const userId = `user_${timestamp}_${random}`

      console.log(`生成新用户ID: ${userId}`)

      res.json({
        code: 0,
        data: {
          userId: userId,
          createdAt: getCurrentDateTime(),
        },
        message: '用户ID生成成功',
      })
    } catch (error) {
      console.error('生成用户ID错误:', error)
      res.status(500).json({
        code: 500,
        message: '生成用户ID失败',
      })
    }
  }

  // 获取用户会话列表
  getUserSessions = async (req, res) => {
    try {
      this.checkConnection()

      const userId = req.body?.userId || req.query.userId || req.body.userId

      if (!userId || userId === 'anonymous') {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的用户ID',
        })
      }

      const { page = 1, limit = 10 } = req.query

      console.log(`获取用户 ${userId} 的会话列表`)

      const sessions = await aiServiceManager.getUserSessions(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
      })

      res.json({
        code: 0,
        data: {
          userId: userId,
          list: sessions,
          page: parseInt(page),
          limit: parseInt(limit),
        },
        message: '获取会话列表成功',
      })
    } catch (error) {
      console.error('获取会话列表错误:', error)

      if (error.message === '数据库未连接') {
        return res.status(503).json({
          code: 503,
          message: '数据库服务暂时不可用，请稍后重试',
        })
      }

      res.status(500).json({
        code: 500,
        message: '获取会话列表失败',
      })
    }
  }

  // 获取会话详情
  getSessionDetails = async (req, res) => {
    try {
      this.checkConnection()

      const { sessionId } = req.params
      const userId = req.body?.userId || req.query.userId || req.body.userId

      if (!userId || userId === 'anonymous') {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的用户ID',
        })
      }

      if (!sessionId) {
        return res.status(400).json({
          code: 400,
          message: '请提供会话ID',
        })
      }

      console.log(`获取用户 ${userId} 的会话 ${sessionId} 详情`)

      const messages = await aiServiceManager.getSessionDetails(userId, sessionId)

      res.json({
        code: 0,
        data: {
          sessionId: sessionId,
          userId: userId,
          messages: messages,
          total: messages.length,
        },
        message: '获取会话详情成功',
      })
    } catch (error) {
      console.error('获取会话详情错误:', error)

      if (error.message === '数据库未连接') {
        return res.status(503).json({
          code: 503,
          message: '数据库服务暂时不可用，请稍后重试',
        })
      }

      res.status(500).json({
        code: 500,
        message: '获取会话详情失败',
      })
    }
  }

  // 删除指定会话
  deleteSession = async (req, res) => {
    try {
      this.checkConnection()

      const { sessionId } = req.params
      const userId = req.body?.userId || req.query.userId || req.body.userId

      if (!userId || userId === 'anonymous') {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的用户ID',
        })
      }

      if (!sessionId) {
        return res.status(400).json({
          code: 400,
          message: '请提供会话ID',
        })
      }

      console.log(`删除用户 ${userId} 的会话 ${sessionId}`)

      await aiServiceManager.deleteSession(userId, sessionId)

      res.json({
        code: 0,
        data: {
          sessionId: sessionId,
          userId: userId,
        },
        message: '会话删除成功',
      })
    } catch (error) {
      console.error('删除会话错误:', error)

      if (error.message === '数据库未连接') {
        return res.status(503).json({
          code: 503,
          message: '数据库服务暂时不可用，请稍后重试',
        })
      }

      res.status(500).json({
        code: 500,
        message: '删除会话失败',
      })
    }
  }

  // 创建空会话
  createEmptySession = async (req, res) => {
    try {
      this.checkConnection()

      const userId = req.body?.userId || req.query.userId || req.body.userId
      const { title, service, model, context } = req.body

      if (!userId || userId === 'anonymous') {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的用户ID',
        })
      }

      console.log(`用户 ${userId} 请求创建空会话`)

      const sessionData = await aiServiceManager.createEmptySession(userId, {
        title: title || '新会话',
        service: service || 'openrouter',
        model: model || null,
        context: context || ''
      })

      res.json({
        code: 0,
        data: {
          sessionId: sessionData.sessionId,
          title: sessionData.title,
          messageCount: sessionData.messageCount,
          createdAt: sessionData.createdAt,
          updatedAt: sessionData.updatedAt,
          service: sessionData.service,
          model: sessionData.model
        },
        message: '空会话创建成功',
      })
    } catch (error) {
      console.error('创建空会话错误:', error)

      if (error.message === '数据库未连接') {
        return res.status(503).json({
          code: 503,
          message: '数据库服务暂时不可用，请稍后重试',
        })
      }

      res.status(500).json({
        code: 500,
        message: '创建空会话失败',
      })
    }
  }
}

export default new ChatController()
