import jwt from 'jsonwebtoken'

/**
 * 检查字符串是否为空
 * @param {string} str - 要检查的字符串
 * @returns {boolean} - 如果字符串为空返回true，否则返回false
 */
export const isEmpty = (str) => {
  return !str || str.trim().length === 0
}

/**
 * 验证JWT token
 * @param {string} req - JWT token
 * @returns {object|null} - 解析后的token payload或null
 */
export const verifyToken = (req) => {
  try {
    const auth = req.headers.authorization
    const token = auth.replace('Bearer ', '')
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * 从请求头中获取并验证token
 * @param {object} req - Express请求对象
 * @returns {object|null} - 解析后的token payload或null
 */
export const getTokenFromHeader = (req) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return null
  }
  return verifyToken(auth.replace('Bearer ', ''))
}

/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidUsername = (username) => {
  return username && typeof username === 'string' && username.length >= 3 && username.length <= 32
}

/**
 * 验证密码格式
 * @param {string} password - 密码
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidPassword = (password) => {
  return password && typeof password === 'string' && password.length >= 6 && password.length <= 64
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidEmail = (email) => {
  if (!email) return true // 邮箱是可选的
  return typeof email === 'string' && /^[\w.-]+@[\w.-]+\.\w+$/.test(email)
}

/**
 * 验证手机号格式（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidPhone = (phone) => {
  return phone && typeof phone === 'string' && /^1\d{10}$/.test(phone)
}

/**
 * 验证分页参数
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @returns {object} - 处理后的分页参数
 */
export const validatePagination = (page = 1, limit = 10) => {
  const parsedPage = parseInt(page)
  const parsedLimit = parseInt(limit)

  return {
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    limit: isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit,
  }
}
