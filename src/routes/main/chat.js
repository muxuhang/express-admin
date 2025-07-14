import express from 'express'
import { body } from 'express-validator'
import chatController from '../../controllers/chatController.js'

const router = express.Router()

// 验证规则
const messageValidation = [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('消息长度必须在1-1000字符之间'),
  body('userId').optional().isString().withMessage('用户ID必须是字符串'),
  body('service').optional().isIn(['openrouter', 'auto']).withMessage('服务类型必须是openrouter或auto'),
  body('model').optional().isString().withMessage('模型名称必须是字符串'),
  body('sessionId').optional().isString().withMessage('会话ID必须是字符串'),
]

const modelValidation = [
  body('model').isString().withMessage('模型名称必须是字符串'),
  body('service').optional().isIn(['openrouter', 'auto']).withMessage('服务类型必须是openrouter或auto'),
]

// 用户管理相关接口
router.post('/api/chat/user/generate', chatController.generateUserId)

// 聊天核心接口路由
router.post('/api/chat/send', messageValidation, chatController.sendMessage)
router.get('/api/chat/history', chatController.getHistory)
router.delete('/api/chat/history', chatController.clearHistory)

// 会话管理相关接口
router.get('/api/chat/sessions', chatController.getUserSessions)
router.post('/api/chat/session/create', chatController.createEmptySession)
router.get('/api/chat/session/:sessionId', chatController.getSessionDetails)
router.delete('/api/chat/session/:sessionId', chatController.deleteSession)

// 取消发送相关接口
router.post('/api/chat/cancel', chatController.cancelMessage)
router.get('/api/chat/active', chatController.checkActiveRequest)

// 模型相关接口
router.get('/api/chat/models', chatController.getAvailableModels)

// 服务管理相关接口
router.get('/api/chat/service/status', chatController.getServiceStatus)
router.post('/api/chat/service/model', modelValidation, chatController.setModel)

export default router
