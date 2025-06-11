import express from 'express'
import pusherService from '../services/pusher.js'
import handleError from '../utils/handleError.js'

const router = express.Router()

// 发送消息
router.post('/api/pusher/message', async (req, res) => {
  try {
    const { message, channel, event } = req.body

    if (!message || !channel || !event) {
      return res.status(400).json({
        code: 400,
        message: '参数不完整'
      })
    }

    // 触发 Pusher 事件
    await pusherService.trigger(channel, event, {
      message,
      from: 'server',
      timestamp: new Date().toISOString()
    })

    res.json({
      code: 0,
      message: '消息发送成功'
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取频道信息
router.get('/api/pusher/channels', async (req, res) => {
  try {
    const channels = await pusherService.getChannels()
    res.json({
      code: 0,
      data: channels,
      message: '获取频道列表成功'
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取频道在线用户
router.get('/api/pusher/channels/:channel/users', async (req, res) => {
  try {
    const { channel } = req.params
    const users = await pusherService.getOnlineUsers(channel)
    res.json({
      code: 0,
      data: users,
      message: '获取在线用户成功'
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

export default router 