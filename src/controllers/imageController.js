import aiServiceManager from '../services/aiServiceManager.js'
import { validationResult } from 'express-validator'
import mongoose from 'mongoose'

class ImageController {
  // 检查数据库连接状态
  checkConnection = () => {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('数据库未连接')
    }
  }

  // 生成图片（流式）
  generateImage = async (req, res) => {
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

      const { prompt, model, size, quality, style, service } = req.body
      const userId = req.body?.userId || req.query.userId || 'anonymous'
      
      console.log(`开始处理用户 ${userId} 的图片生成请求`)
      console.log(`提示词: ${prompt}`)
      console.log(`使用服务: ${service || '默认'}, 模型: ${model || '默认'}`)

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })

      console.log('响应头已设置，开始生成图片...')

      const options = {
        service: service,
        model: model,
        size: size,
        quality: quality,
        style: style,
      }

      const stream = aiServiceManager.generateImage(userId, prompt, options)
      let chunkCount = 0

      for await (const chunk of stream) {
        chunkCount++
        console.log(`控制器接收到第 ${chunkCount} 个数据块:`, JSON.stringify(chunk, null, 2))

        // 确保数据块有内容才发送
        if (chunk && (chunk.url || chunk.error)) {
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

      console.log(`控制器图片生成响应完成，共处理 ${chunkCount} 个数据块`)
    } catch (error) {
      console.error('图片生成控制器流错误:', error.message)

      // 根据错误类型提供不同的错误信息
      let errorMessage = '图片生成时发生未知错误'
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
        errorMessage = '图片生成已被用户取消'
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
      } else if (error.message.includes('图片生成失败')) {
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

  // 获取图片生成模型列表
  getImageModels = async (req, res) => {
    try {
      this.checkConnection()

      const { service } = req.query
      const models = await aiServiceManager.getImageModels(service)

      res.json({
        code: 0,
        data: models,
        message: '获取图片生成模型列表成功',
      })
    } catch (error) {
      console.error('获取图片生成模型列表失败:', error)
      res.status(500).json({
        code: 500,
        message: '获取图片生成模型列表失败',
        error: error.message,
      })
    }
  }

  // 取消图片生成
  cancelImageGeneration = async (req, res) => {
    try {
      const userId = req.body?.userId || req.query.userId || 'anonymous'
      const { service } = req.body

      aiServiceManager.cancelMessage(userId, service)

      res.json({
        code: 0,
        message: '图片生成已取消',
      })
    } catch (error) {
      console.error('取消图片生成失败:', error)
      res.status(500).json({
        code: 500,
        message: '取消图片生成失败',
        error: error.message,
      })
    }
  }

  // 检查是否有活跃的图片生成请求
  checkActiveImageGeneration = async (req, res) => {
    try {
      const userId = req.body?.userId || req.query.userId || 'anonymous'
      const { service } = req.query

      const hasActive = aiServiceManager.hasActiveRequest(userId, service)

      res.json({
        code: 0,
        data: {
          hasActive,
          userId,
          service: service || 'default',
        },
        message: hasActive ? '有活跃的图片生成请求' : '没有活跃的图片生成请求',
      })
    } catch (error) {
      console.error('检查活跃图片生成请求失败:', error)
      res.status(500).json({
        code: 500,
        message: '检查活跃图片生成请求失败',
        error: error.message,
      })
    }
  }
}

export default new ImageController() 