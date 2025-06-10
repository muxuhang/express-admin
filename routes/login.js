import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import User from '../models/user.js'
import LoginLog from '../models/loginLog.js'
import handleError from '../middleware/handleError.js'
import { isValidUsername, isValidPassword } from '../utils/auth.js'
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

// 判断登录来源
const getLoginSource = (userAgent) => {
  const mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'Windows Phone']
  return mobileKeywords.some((keyword) => userAgent.includes(keyword)) ? 'h5' : 'pc'
}

router.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body
    // 基本校验
    if (!isValidUsername(username) || !isValidPassword(password)) {
      try {
        // 记录失败的登录日志
        await LoginLog.create({
          username,
          ip_address: getClientIP(req),
          user_agent: req.headers['user-agent'],
          login_source: getLoginSource(req.headers['user-agent']),
          status: 'failed',
          fail_reason: '用户名或密码格式不正确',
        })
      } catch (err) {
        console.error('记录登录日志失败:', err)
      }

      return res.status(400).json({
        code: 400,
        message: '用户名或密码格式不正确',
      })
    }

    // 查找用户
    const user = await User.findOne({ username })
    // 密码校验统一返回
    if (!user) {
      try {
        // 记录失败的登录日志
        await LoginLog.create({
          username,
          ip_address: getClientIP(req),
          user_agent: req.headers['user-agent'],
          login_source: getLoginSource(req.headers['user-agent']),
          status: 'failed',
          fail_reason: '用户不存在',
        })
      } catch (err) {
        console.error('记录登录日志失败:', err)
      }

      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      try {
        // 记录失败的登录日志
        await LoginLog.create({
          username,
          ip_address: getClientIP(req),
          user_agent: req.headers['user-agent'],
          login_source: getLoginSource(req.headers['user-agent']),
          status: 'failed',
          fail_reason: '密码错误',
        })
      } catch (err) {
        console.error('记录登录日志失败:', err)
      }

      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
      })
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

    // 记录成功的登录日志
    await LoginLog.create({
      username: user.username,
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      login_source: getLoginSource(req.headers['user-agent']),
      status: 'success',
    })

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
router.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, phone } = req.body

    // 基本校验
    if (
      !username ||
      !password ||
      !phone ||
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof phone !== 'string' ||
      username.length < 3 ||
      username.length > 32 ||
      password.length < 6 ||
      password.length > 64
    ) {
      return res.status(400).json({
        code: 400,
        message: '用户名、密码或手机号格式不正确',
      })
    }

    // 手机号校验（中国大陆手机号11位，以1开头）
    if (!/^1\d{10}$/.test(phone)) {
      return res.status(400).json({
        code: 400,
        message: '手机号格式不正确',
      })
    }

    // 邮箱可选校验
    if (email && (typeof email !== 'string' || !/^[\w.-]+@[\w.-]+\.\w+$/.test(email))) {
      return res.status(400).json({
        code: 400,
        message: '邮箱格式不正确',
      })
    }

    // 检查用户名是否已存在
    const existUser = await User.findOne({ username })
    if (existUser) {
      return res.status(409).json({
        code: 409,
        message: '用户名已存在',
      })
    }

    // 检查手机号是否已存在
    const existPhone = await User.findOne({ phone })
    if (existPhone) {
      return res.status(409).json({
        code: 409,
        message: '手机号已注册',
      })
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
router.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        code: 400,
        message: '邮箱不能为空',
      })
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
    handleError(err, req, res)
  }
})

// 重置密码（通过邮箱+验证码）
router.post('/api/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body
    if (!email || !code || !password || typeof password !== 'string' || password.length < 6 || password.length > 64) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
      })
    }
    const user = await User.findOne({
      email,
      reset_password_code: code,
      reset_password_expires: { $gt: Date.now() },
    })
    if (!user) {
      return res.status(400).json({
        code: 400,
        message: '验证码无效或已过期',
      })
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
    handleError(err, req, res)
  }
})

// 已登录用户修改密码
router.post('/api/change-password', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: '未授权' })
    }
    let payload
    try {
      payload = verifyToken(req)
    } catch (e) {
      return res.status(401).json({ code: 401, message: '无效的token' })
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
      return res.status(400).json({ code: 400, message: '参数错误' })
    }
    const user = await User.findById(payload.id)
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ code: 400, message: '原密码错误' })
    }
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.json({ code: 0, message: '密码修改成功' })
  } catch (err) {
    handleError(err, req, res)
  }
})

export default router
