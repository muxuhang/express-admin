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

const getErrorMessage = (err) => {
  return process.env.NODE_ENV === 'development' ? err.error : undefined
}

// 提取 Mongoose 验证错误详情
const extractValidationErrors = (err) => {
  const errors = {}
  
  if (err.errors) {
    Object.keys(err.errors).forEach(field => {
      const error = err.errors[field]
      errors[field] = {
        message: error.message,
        value: error.value,
        kind: error.kind
      }
    })
  }
  
  return errors
}

// 处理未检测到的错误
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
      error: getErrorMessage(err),
    })
  }

  // 如果是 JWT 验证错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的token',
      error: getErrorMessage(err),
    })
  }

  // 如果是 JWT 过期错误
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: '登录已过期，请重新登录',
      error: getErrorMessage(err),
    })
  }

  // 如果是 Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const validationErrors = extractValidationErrors(err)
    const errorFields = Object.keys(validationErrors)
    
    let message = '数据验证失败'
    if (errorFields.length > 0) {
      const fieldMessages = errorFields.map(field => {
        const error = validationErrors[field]
        // 提供更友好的字段名映射
        const fieldNames = {
          title: '标题',
          content: '内容',
          category: '文章类型',
          author: '作者',
          tags: '标签',
          status: '状态'
        }
        const fieldName = fieldNames[field] || field
        return `${fieldName}: ${error.message}`
      })
      message = `数据验证失败: ${fieldMessages.join(', ')}`
    }

    return res.status(400).json({
      code: 400,
      message,
      error: getErrorMessage(err),
    })
  }

  // 如果是 Mongoose 重复键错误
  if (err.code === 11000) {
    // 检查是否是 slug 相关的错误
    const field = Object.keys(err.keyPattern)[0]
    
    if (field === 'slug') {
      // 如果是 slug 重复，忽略这个错误
      console.log('忽略 slug 重复错误:', err.message)
      return res.status(200).json({
        code: 0,
        message: '操作成功'
      })
    }
    
    // 提供更友好的字段名映射
    const fieldNames = {
      title: '标题',
      username: '用户名',
      email: '邮箱'
    }
    const fieldName = fieldNames[field] || field
    const message = `${fieldName} 已存在，请使用其他值`
    
    return res.status(400).json({
      code: 400,
      message,
      error: getErrorMessage(err),
    })
  }

  // 如果是 Mongoose Cast 错误（类型转换失败）
  if (err.name === 'CastError') {
    const field = err.path
    const value = err.value
    
    // 提供更友好的字段名映射
    const fieldNames = {
      _id: 'ID',
      author: '作者',
      category: '文章类型'
    }
    const fieldName = fieldNames[field] || field
    
    let message = `${fieldName} 格式错误`
    if (field === 'author') {
      message = '作者字段格式错误，请使用用户名或用户ID'
    } else if (field === 'category') {
      message = '文章类型格式错误，必须是 article、news、announcement 或 tutorial 中的一个'
    }
    
    return res.status(400).json({
      code: 400,
      message,
      error: getErrorMessage(err),
    })
  }

  // 默认错误处理
  const status = err.status || 500
  const message = err.message || errorMessages[status] || '未知错误'

  res.status(status).json({
    code: status,
    message,
    error: getErrorMessage(err),
  })
}

export { errorMessages, AppError }
export default handleError
