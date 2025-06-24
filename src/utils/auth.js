import jwt from 'jsonwebtoken'

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
