import express from 'express'
import { body } from 'express-validator'
import imageController from '../../controllers/imageController.js'

const router = express.Router()

// 验证规则
const imageGenerationValidation = [
  body('prompt').trim().isLength({ min: 1, max: 1000 }).withMessage('提示词长度必须在1-1000字符之间'),
  body('userId').optional().isString().withMessage('用户ID必须是字符串'),
  body('service').optional().isIn(['openrouter', 'auto']).withMessage('服务类型必须是openrouter或auto'),
  body('model').optional().isString().withMessage('模型名称必须是字符串'),
  body('size').optional().isIn(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']).withMessage('图片尺寸必须是支持的格式'),
  body('quality').optional().isIn(['standard', 'hd']).withMessage('图片质量必须是standard或hd'),
  body('style').optional().isIn(['vivid', 'natural']).withMessage('图片风格必须是vivid或natural'),
]

const modelValidation = [
  body('model').isString().withMessage('模型名称必须是字符串'),
  body('service').optional().isIn(['openrouter', 'auto']).withMessage('服务类型必须是openrouter或auto'),
]

// 图片生成相关接口路由
router.post('/api/image/generate', imageGenerationValidation, imageController.generateImage)
router.get('/api/image/models', imageController.getImageModels)

// 取消图片生成相关接口
router.post('/api/image/cancel', imageController.cancelImageGeneration)
router.get('/api/image/active', imageController.checkActiveImageGeneration)

export default router 