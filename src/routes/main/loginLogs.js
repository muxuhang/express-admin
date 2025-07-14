import express from 'express'
import LoginLog from '../../models/loginLog.js'
import handleError from '../../utils/handleError.js'
import authLogin from '../../middleware/authLogin.js'

const router = express.Router()

// 获取登录日志列表
router.get('/api/login-logs', authLogin, async (req, res) => {
  try {
    const { keyword, status, loginSource, startDate, endDate, page = 1, limit = 10 } = req.query
    const query = {}
    
    if (keyword) {
      query.$or = [
        { username: new RegExp(keyword, 'i') }, 
        { ipAddress: new RegExp(keyword, 'i') }
      ]
    }
    
    if (status) {
      query.status = status
    }
    
    if (loginSource) {
      query.loginSource = loginSource
    }
    
    if (startDate || endDate) {
      query.loginTime = {}
      if (startDate) {
        query.loginTime.$gte = new Date(startDate)
      }
      if (endDate) {
        query.loginTime.$lte = new Date(endDate + ' 23:59:59')
      }
    }
    
    const total = await LoginLog.countDocuments(query)
    const logs = await LoginLog.find(query)
      .populate('userId', 'username email')
      .sort({ loginTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
    
    res.json({ 
      code: 0, 
      message: '获取登录日志成功', 
      data: { 
        total, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        list: logs 
      } 
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 删除登录日志
router.delete('/api/login-logs/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const log = await LoginLog.findById(id)
    if (!log) {
      return res.status(404).json({ code: 404, message: '日志不存在' })
    }
    await log.deleteOne()
    res.json({ code: 0, message: '删除日志成功' })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 批量删除登录日志
router.delete('/api/login-logs', authLogin, async (req, res) => {
  try {
    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择要删除的日志' })
    }
    
    await LoginLog.deleteMany({ _id: { $in: ids } })
    res.json({ code: 0, message: '批量删除日志成功' })
  } catch (error) {
    handleError(error, req, res)
  }
})

export default router 