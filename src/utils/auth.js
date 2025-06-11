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
    console.log('verifyToken', error)
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
