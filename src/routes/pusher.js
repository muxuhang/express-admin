import express from 'express'
import pusherService from '../services/pusher.js'
import handleError from '../utils/handleError.js'
import authLogin from '../middleware/authLogin.js'

const router = express.Router()

// 发送消息
router.post('/api/pusher/message', authLogin, async (req, res) => {
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
router.get('/api/pusher/channels', authLogin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const allChannels = await pusherService.getChannels()
    
    // 计算分页
    const total = allChannels.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + parseInt(limit)
    const channels = allChannels.slice(startIndex, endIndex)
    
    res.json({
      code: 0,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        list: channels,
      },
      message: '获取频道列表成功'
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取频道在线用户
router.get('/api/pusher/channels/:channel/users', authLogin, async (req, res) => {
  try {
    const { channel } = req.params
    const { page = 1, limit = 10 } = req.query
    const allUsers = await pusherService.getOnlineUsers(channel)
    
    // 计算分页
    const total = allUsers.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + parseInt(limit)
    const users = allUsers.slice(startIndex, endIndex)
    
    res.json({
      code: 0,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        list: users,
      },
      message: '获取在线用户成功'
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

export default router 