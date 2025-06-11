/**
 * Express 错误处理中间件
 * 用于处理未捕获的错误，返回统一的错误响应格式
 */

// 错误状态码对应的消息映射
const errorMessages = {
  400: '请求参数错误',
  401: '未授权，请先登录',
  403: '无权限访问',
  404: '请求的资源不存在',
  500: '服务器内部错误',
  503: '服务暂时不可用',
}

// 自定义错误类
class AppError extends Error {
  constructor(status, message, error = null) {
    super(message)
    this.status = status
    this.error = error
  }
}

// 错误处理中间件
const handleError = (err, req, res, next) => {
  console.error('------Error begin------')
  console.error(`Request: ${req.method} ${req.originalUrl}`)
  console.error(err)
  console.error('------Error end------')

  // 如果是自定义错误，使用其状态码和消息
  if (err instanceof AppError) {
    return res.status(err.status).json({
      code: err.status,
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.error : undefined,
    })
  }

  // 如果是 JWT 验证错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的token',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
  }

  // 如果是 JWT 过期错误
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: '登录已过期，请重新登录',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
  }

  // 如果是 Mongoose 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
  }

  // 如果是 Mongoose 重复键错误
  if (err.code === 11000) {
    return res.status(400).json({
      code: 400,
      message: '数据已存在',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
  }

  // 默认错误处理
  const status = err.status || 500
  const message = err.message || errorMessages[status] || '未知错误'

  res.status(status).json({
    code: status,
    message,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
}

export { errorMessages, AppError }
export default handleError 