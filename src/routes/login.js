import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import LoginLog from '../models/loginLog.js'
import handleError from '../utils/handleError.js'
import { isValidUsername, isValidPassword, isEmpty, isValidEmail, isValidPhone } from '../utils/valid.js'
import { verifyToken } from '../utils/auth.js'
import authLogin from '../middleware/authLogin.js'

const router = express.Router()

// 使用内存存储验证码
const emailCodeStore = new Map()

// 获取验证码
const getCode = (email) => {
  return emailCodeStore.get(email)
}

// 设置验证码
const setCode = (email, code) => {
  emailCodeStore.set(email, code)
  // 60秒后自动删除
  setTimeout(() => emailCodeStore.delete(email), 60000)
}

// 获取客户端IP地址
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  )
}

// 记录登录日志
const journaling = ({ req, res }, { code = 400, status = 'failed', failReason }) => {
  try {
    LoginLog.create({
      username: req?.body?.username,
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'],
      loginSource: getLoginSource(req.headers['user-agent']),
      status: status || 'failed',
      failReason: failReason,
    })
    console.log(status)
    if (status === 'failed') {
      return res.status(400).json({ code, message: failReason })
    }
  } catch (err) {
    console.error('记录登录日志失败:', err)
  }
}

// 判断登录来源
const getLoginSource = (userAgent) => {
  const mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'Windows Phone']
  return mobileKeywords.some((keyword) => userAgent.includes(keyword)) ? 'h5' : 'pc'
}

// 登录账号
router.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (isEmpty(username)) {
      return journaling({ req, res }, { failReason: '用户名/手机号不能为空' })
    }
    if (isEmpty(password)) {
      return journaling({ req, res }, { failReason: '密码不能为空' })
    }
    // 基本校验
    if (!isValidUsername(username) || !isValidPassword(password)) {
      return journaling({ req, res }, { failReason: '用户名/手机号或密码格式不正确' })
    }
    
    // 查找用户 - 支持用户名或手机号登录
    let user = await User.findOne({ username })
    
    // 如果用户名没找到，尝试用手机号查找
    if (!user && /^1\d{10}$/.test(username)) {
      user = await User.findOne({ phone: username })
    }
    
    // 用户名错误
    if (!user) {
      return journaling({ req, res }, { code: 401, failReason: '用户名/手机号或密码错误' })
    }
    
    // 检查用户状态
    if (user.status === 'inactive') {
      return journaling({ req, res }, { code: 403, failReason: '账户已被停用，请联系管理员' })
    }
    
    // 密码错误
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return journaling({ req, res }, { code: 401, failReason: '用户名/手机号或密码错误' })
    }
    // 生成 JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' } // 设置为365天有效期
    )
    // 更新最后登录时间
    user.lastLoginAt = new Date()
    await user.save()
    journaling({ req, res }, { status: 'success' })
    res.json({
      code: 0,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
        },
      },
      message: '登录成功',
    })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 查询登录日志
router.get('/api/login-logs', authLogin, async (req, res) => {
  try {
    // 获取查询参数
    const { username, startDate, endDate, status, loginSource, page = 1, limit = 10 } = req.query

    // 构建查询条件
    const query = {}
    if (username) query.username = new RegExp(username, 'i')
    if (status) query.status = status
    if (loginSource) query.loginSource = loginSource
    if (startDate || endDate) {
      query.loginTime = {}
      if (startDate) query.loginTime.$gte = new Date(startDate)
      if (endDate) query.loginTime.$lte = new Date(endDate)
    }

    // 执行查询
    const total = await LoginLog.countDocuments(query)
    const logs = await LoginLog.find(query)
      .sort({ loginTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'username email')

    res.json({
      code: 0,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        list: logs,
      },
      message: '获取登录日志成功',
    })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 注册接口
router.post('/api/register', async (req, res, next) => {
  try {
    const { username, password, email, phone } = req.body
    // 基本校验
    if (
      !username ||
      !password ||
      !email ||
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof email !== 'string'
    ) {
      return res.status(400).json({ code: 400, message: '用户名、密码和邮箱不能为空' })
    }
    
    // 手机号可选校验
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ code: 400, message: '手机号格式不正确' })
    }
    
    // 邮箱校验
    if (!isValidEmail(email)) {
      return res.status(400).json({ code: 400, message: '邮箱格式不正确' })
    }
    
    // 检查用户名是否已存在
    const existUser = await User.findOne({ username })
    if (existUser) {
      return res.status(400).json({ code: 409, message: '用户名已存在' })
    }
    
    // 检查邮箱是否已存在
    const existEmail = await User.findOne({ email })
    if (existEmail) {
      return res.status(400).json({ code: 409, message: '邮箱已注册' })
    }
    
    // 检查手机号是否已存在（如果提供了手机号）
    if (phone) {
      const existPhone = await User.findOne({ phone })
      if (existPhone) {
        return res.status(400).json({ code: 409, message: '手机号已注册' })
      }
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    // 创建用户
    const user = new User({
      username,
      password: hashedPassword,
      email,
      phone: phone || undefined, // 如果手机号为空，则不设置该字段
      role: 'user',
      status: 'active',
    })
    await user.save()
    res.json({ code: 0, message: '注册成功' })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 获取用户信息
router.get('/api/profile', authLogin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    res.json({
      code: 0,
      data: user,
      message: '获取用户信息成功',
    })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 修改用户信息
router.put('/api/profile', authLogin, async (req, res) => {
  try {
    const { email, phone } = req.body
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    // 检查手机号是否已被其他用户使用
    if (phone && phone !== user.phone) {
      const existPhone = await User.findOne({ phone, _id: { $ne: req.user.id } })
      if (existPhone) {
        return res.status(400).json({ code: 400, message: '手机号已被其他用户使用' })
      }
    }
    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existEmail = await User.findOne({ email, _id: { $ne: req.user.id } })
      if (existEmail) {
        return res.status(400).json({ code: 400, message: '邮箱已被其他用户使用' })
      }
    }
    // 更新用户信息
    if (email) user.email = email
    if (phone) user.phone = phone
    await user.save()
    res.json({
      code: 0,
      data: { ...user.toObject(), password: undefined },
      message: '更新用户信息成功',
    })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 修改密码
router.put('/api/change-password', authLogin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ code: 400, message: '旧密码和新密码不能为空' })
    }
    const user = await User.findById(req.user.id).select('+password')
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    // 验证旧密码
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ code: 400, message: '旧密码错误' })
    }
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()
    res.json({ code: 0, message: '密码修改成功' })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 发送邮箱验证码
router.post('/api/send-email-code', async (req, res) => {
  try {
    const { email } = req.body
    if (!isValidEmail(email)) {
      return res.status(400).json({ code: 400, message: '邮箱格式不正确' })
    }
    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    // 存储验证码
    setCode(email, code)
    // 这里应该发送邮件，暂时打印到控制台
    console.log(`验证码: ${code}`)
    res.json({ code: 0, message: '验证码发送成功' })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 重置密码
router.post('/api/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body
    if (!email || !code || !newPassword) {
      return res.status(400).json({ code: 400, message: '邮箱、验证码和新密码不能为空' })
    }
    // 验证验证码
    const storedCode = getCode(email)
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ code: 400, message: '验证码错误或已过期' })
    }
    // 查找用户
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()
    // 删除验证码
    emailCodeStore.delete(email)
    res.json({ code: 0, message: '密码重置成功' })
  } catch (err) {
    handleError(err, req, res)
  }
})

export default router
