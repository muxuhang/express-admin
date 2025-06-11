import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import User from '../models/user.js'
import LoginLog from '../models/loginLog.js'
import handleError, { AppError } from '../utils/handleError.js'
import { isValidUsername, isValidPassword } from '../utils/valid.js'
import { verifyToken } from '../utils/auth.js'
import checkAdmin from '../middleware/checkAdmin.js'

const router = express.Router()

// 获取客户端IP地址
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  )
}
// 记录失败的登录日志
const journaling = ({ req, res }, { code = 400, status = 'failed', fail_reason }) => {
  try {
    LoginLog.create({
      username: req?.body?.username,
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      login_source: getLoginSource(req.headers['user-agent']),
      status: status || 'failed',
      fail_reason: fail_reason,
    })
    console.log(status)
    if (status === 'failed') {
      return res.status(400).json({ code, message: fail_reason })
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
    // 基本校验
    if (!isValidUsername(username) || !isValidPassword(password)) {
      return journaling({ req, res }, { fail_reason: '用户名或密码格式不正确' })
    }
    // 查找用户
    const user = await User.findOne({ username })
    // 用户名错误
    if (!user) {
      return journaling({ req, res }, { code: 401, fail_reason: '用户名或密码错误' })
    }
    // 密码错误
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return journaling({ req, res }, { code: 401, fail_reason: '用户名或密码错误' })
    }

    // 生成 JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' } // 设置为365天有效期
    )

    // 更新最后登录时间
    user.last_login_at = new Date()
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
          role: user.role,
          last_login_at: user.last_login_at,
        },
      },
      message: '登录成功',
    })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 查询登录日志
router.get('/api/login-logs', checkAdmin, async (req, res) => {
  try {
    // 获取查询参数
    const { username, start_date, end_date, status, login_source, page = 1, limit = 10 } = req.query

    // 构建查询条件
    const query = {}
    if (username) query.username = new RegExp(username, 'i')
    if (status) query.status = status
    if (login_source) query.login_source = login_source
    if (start_date || end_date) {
      query.login_time = {}
      if (start_date) query.login_time.$gte = new Date(start_date)
      if (end_date) query.login_time.$lte = new Date(end_date)
    }

    // 执行查询
    const total = await LoginLog.countDocuments(query)
    const logs = await LoginLog.find(query)
      .sort({ login_time: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user_id', 'username email')

    res.json({
      code: 0,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        logs,
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
      !phone ||
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof phone !== 'string'
    ) {
      return next(new AppError(400, '用户名、密码或手机号格式不正确'))
    }

    // 手机号校验（中国大陆手机号11位，以1开头）
    if (!/^1\d{10}$/.test(phone)) {
      return next(new AppError(400, '手机号格式不正确'))
    }

    // 邮箱可选校验
    if (email && (typeof email !== 'string' || !/^[\w.-]+@[\w.-]+\.\w+$/.test(email))) {
      return next(new AppError(400, '邮箱格式不正确'))
    }

    // 检查用户名是否已存在
    const existUser = await User.findOne({ username })
    if (existUser) {
      return next(new AppError(409, '用户名已存在'))
    }

    // 检查手机号是否已存在
    const existPhone = await User.findOne({ phone })
    if (existPhone) {
      return next(new AppError(409, '手机号已注册'))
    }

    // 密码加密
    const hash = await bcrypt.hash(password, 10)

    // 创建用户
    const user = new User({
      username,
      password: hash,
      email: email || '',
      phone,
      role: 'user',
      last_login_at: null,
    })
    await user.save()

    res.json({
      code: 0,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      message: '注册成功',
    })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 发送重置密码验证码邮件
router.post('/api/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email || typeof email !== 'string') {
      return next(new AppError(400, '邮箱不能为空'))
    }
    const user = await User.findOne({ email })
    if (!user) {
      // 不泄露邮箱是否存在
      return res.json({
        code: 0,
        message: '如果该邮箱已注册，将收到验证码邮件',
      })
    }

    // 生成6位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    user.reset_password_code = code
    user.reset_password_expires = Date.now() + 1000 * 60 * 30 // 30分钟有效
    await user.save()

    // 配置邮件发送
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: '密码重置验证码',
      text: `您的密码重置验证码为：${code}，30分钟内有效。`,
      html: `<p>您的密码重置验证码为：<b>${code}</b>，30分钟内有效。</p>`,
    })

    res.json({
      code: 0,
      message: '如果该邮箱已注册，将收到验证码邮件',
    })
  } catch (err) {
    next(err)
  }
})

// 重置密码（通过邮箱+验证码）
router.post('/api/reset-password', async (req, res, next) => {
  try {
    const { email, code, password } = req.body
    if (!email || !code || !password || typeof password !== 'string' || password.length < 6 || password.length > 64) {
      return next(new AppError(400, '参数错误'))
    }
    const user = await User.findOne({
      email,
      reset_password_code: code,
      reset_password_expires: { $gt: Date.now() },
    })
    if (!user) {
      return next(new AppError(400, '验证码无效或已过期'))
    }
    user.password = await bcrypt.hash(password, 10)
    user.reset_password_code = undefined
    user.reset_password_expires = undefined
    await user.save()
    res.json({
      code: 0,
      message: '密码重置成功',
    })
  } catch (err) {
    next(err)
  }
})

// 已登录用户修改密码
router.post('/api/change-password', async (req, res, next) => {
  try {
    try {
      const payload = verifyToken(req)
    } catch (e) {
      return next(new AppError(401, '无效的token'))
    }
    const { oldPassword, newPassword } = req.body
    if (
      !oldPassword ||
      !newPassword ||
      typeof oldPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      newPassword.length < 6 ||
      newPassword.length > 64
    ) {
      return next(new AppError(400, '参数错误'))
    }
    const user = await User.findById(payload.id)
    if (!user) {
      return next(new AppError(404, '用户不存在'))
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return next(new AppError(400, '原密码错误'))
    }
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.json({ code: 0, message: '密码修改成功' })
  } catch (err) {
    next(err)
  }
})

// 已登录用户，获取个人信息
router.get('/api/profile', async (req, res) => {
  try {
    const payload = verifyToken(req)
    const user = await User.findById(payload.id, { password: 0 })
    res.json({ code: 0, message: '获取个人信息成功', data: user })
  } catch (error) {
    console.log('error', error)
    return res.json({ code: 0, data: {} })
  }
})

export default router
