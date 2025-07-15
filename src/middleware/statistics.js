import StatisticsService from '../services/statistics.js'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'

/**
 * 获取用户信息
 */
const getUserInfo = async (req) => {
  try {
    // 如果已经有用户信息，直接返回
    if (req.user) {
      return {
        userId: req.user._id || req.user.id,
        username: req.user.username
      }
    }

    // 尝试从token中获取用户信息
    const auth = req.headers.authorization
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.replace('Bearer ', '')
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      if (decoded && decoded.userId) {
        // 从数据库获取用户信息
        const user = await User.findById(decoded.userId).select('username')
        if (user) {
          return {
            userId: user._id,
            username: user.username
          }
        }
      }
    }

    // 返回匿名用户信息
    return {
      userId: null,
      username: 'anonymous'
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      userId: null,
      username: 'anonymous'
    }
  }
}

/**
 * 统计中间件 - 记录API调用
 */
export const statisticsMiddleware = async (req, res, next) => {
  // 跳过静态文件和健康检查
  if (req.path.startsWith('/static/') || 
      req.path.startsWith('/public/') || 
      req.path === '/health' ||
      req.path === '/favicon.ico') {
    return next()
  }
  
  // 获取用户信息
  const userInfo = await getUserInfo(req)
  
  // 只记录API调用
  if (req.path.startsWith('/api/')) {
    return StatisticsService.recordApiCall(req, res, next, userInfo)
  }
  
  // 记录页面访问
  return StatisticsService.recordPageView(req, res, next, userInfo)
}

/**
 * 错误统计中间件
 */
export const errorStatisticsMiddleware = (error, req, res, next) => {
  // 记录错误统计
  StatisticsService.recordError(error, req, res).catch(err => {
    console.error('记录错误统计失败:', err)
  })
  
  next(error)
}

/**
 * 登录统计中间件
 */
export const loginStatisticsMiddleware = (req, res, next) => {
  const originalJson = res.json
  
  res.json = function(data) {
    // 如果是登录成功响应
    if (req.path === '/api/login' && data.success && data.user) {
      StatisticsService.recordLogin(
        data.user._id || data.user.id,
        data.user.username,
        req
      ).catch(err => {
        console.error('记录登录统计失败:', err)
      })
    }
    
    originalJson.call(this, data)
  }
  
  next()
}

/**
 * 登出统计中间件
 */
export const logoutStatisticsMiddleware = (req, res, next) => {
  const originalJson = res.json
  
  res.json = function(data) {
    // 如果是登出成功响应
    if (req.path === '/api/logout' && data.success && req.user) {
      StatisticsService.recordLogout(
        req.user._id || req.user.id,
        req.user.username,
        req
      ).catch(err => {
        console.error('记录登出统计失败:', err)
      })
    }
    
    originalJson.call(this, data)
  }
  
  next()
}

/**
 * 性能监控中间件
 */
export const performanceMiddleware = (req, res, next) => {
  const startTime = process.hrtime()
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime)
    const responseTime = seconds * 1000 + nanoseconds / 1000000 // 转换为毫秒
    
    // 记录慢请求
    if (responseTime > 1000) { // 超过1秒的请求
      console.warn(`慢请求: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`)
    }
  })
  
  next()
}

/**
 * 请求大小限制中间件
 */
export const requestSizeMiddleware = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0')
  
  // 限制请求大小为10MB
  if (contentLength > 10 * 1024 * 1024) {
    return res.status(413).json({
      success: false,
      message: '请求体过大，最大支持10MB'
    })
  }
  
  next()
}

/**
 * 统计中间件配置
 */
export const configureStatisticsMiddleware = (app) => {
  // 添加性能监控
  app.use(performanceMiddleware)
  
  // 添加请求大小限制
  app.use(requestSizeMiddleware)
  
  // 添加统计中间件
  app.use(statisticsMiddleware)
  
  // 添加登录统计
  app.use('/api/login', loginStatisticsMiddleware)
  
  // 添加登出统计
  app.use('/api/logout', logoutStatisticsMiddleware)
  
  // 添加错误统计（需要在错误处理之前）
  app.use(errorStatisticsMiddleware)
}

export default {
  statisticsMiddleware,
  errorStatisticsMiddleware,
  loginStatisticsMiddleware,
  logoutStatisticsMiddleware,
  performanceMiddleware,
  requestSizeMiddleware,
  configureStatisticsMiddleware
} 