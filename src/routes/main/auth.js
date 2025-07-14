import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../../models/user.js'
import LoginLog from '../../models/loginLog.js'
import handleError from '../../utils/handleError.js'

const router = express.Router()

// 用户登录
router.post('/api/login', async (req, res) => {
  try {
    const { username, password, loginSource = 'pc' } = req.body

    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名/手机号和密码不能为空'
      })
    }

    // 查找用户 - 支持用户名或手机号登录
    let user = await User.findOne({ username }).select('+password')
    
    // 如果用户名没找到，尝试用手机号查找
    if (!user && /^1\d{10}$/.test(username)) {
      user = await User.findOne({ phone: username }).select('+password')
    }

    if (!user) {
      // 记录登录失败日志
      await LoginLog.create({
        username,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        loginSource,
        status: 'failed',
        failReason: '用户不存在'
      })

      return res.status(401).json({
        code: 401,
        message: '用户名/手机号或密码错误'
      })
    }

    // 检查用户状态
    if (user.status !== 'active') {
      // 记录登录失败日志
      await LoginLog.create({
        userId: user._id,
        username: user.username,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        loginSource,
        status: 'failed',
        failReason: '用户已被停用'
      })

      return res.status(403).json({
        code: 403,
        message: '账户已被停用，请联系管理员'
      })
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      // 记录登录失败日志
      await LoginLog.create({
        userId: user._id,
        username: user.username,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        loginSource,
        status: 'failed',
        failReason: '密码错误'
      })

      return res.status(401).json({
        code: 401,
        message: '用户名/手机号或密码错误'
      })
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date()
    await user.save()

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    // 记录登录成功日志
    await LoginLog.create({
      userId: user._id,
      username: user.username,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      loginSource,
      status: 'success'
    })

    // 返回用户信息（不包含密码）
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt
    }

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: userResponse
      }
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取当前用户信息
router.get('/api/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }

    res.json({
      code: 0,
      message: '获取用户信息成功',
      data: user
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的认证令牌'
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已过期'
      })
    }
    handleError(error, req, res)
  }
})

export default router 