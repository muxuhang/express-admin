import jwt from 'jsonwebtoken'
import User from '../models/user.js'

/**
 * 验证JWT token并设置用户信息
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件函数
 */
export const verifyToken = async (req, res, next) => {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未授权，缺少认证令牌' })
    }

    const token = auth.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: '无效的认证令牌' })
    }

    // 从数据库获取用户信息
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: '用户已被停用' })
    }

    // 将用户信息添加到请求对象
    req.user = user
    next()
  } catch (error) {
    console.error('Token验证失败:', error)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: '无效的认证令牌' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '认证令牌已过期' })
    }
    return res.status(500).json({ success: false, message: '认证失败' })
  }
}

// 检查用户角色权限
export function checkRole(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles]
  }
  return (req, res, next) => {
    const user = req.user
    if (!user || !user.role) {
      return res.status(401).json({ success: false, message: '未授权，缺少用户信息' })
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ success: false, message: '无权限访问' })
    }
    next()
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
  try {
    const token = auth.replace('Bearer ', '')
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}
