import express from 'express'
import { body } from 'express-validator'
import chatController from '../controllers/chatController.js'

const router = express.Router()

// 验证规则
const messageValidation = [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('消息长度必须在1-1000字符之间'),
  body('context').optional().isString().withMessage('上下文必须是字符串'),
  body('userId').optional().isString().withMessage('用户ID必须是字符串'),
]

// 聊天核心接口路由
router.post('/send', messageValidation, chatController.sendMessage)
router.get('/history', chatController.getHistory)
router.delete('/history', chatController.clearHistory)

export default router
