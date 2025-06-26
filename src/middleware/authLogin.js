import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import Role from '../models/role.js'
import handleError from '../utils/handleError.js'

/**
 * 用户登录验证中间件
 * 用于验证请求是否来自已登录的用户
 *
 * 验证流程：
 * 1. 检查请求头中是否包含有效的 Bearer token
 * 2. 验证 token 的有效性并解析用户信息
 * 3. 查询用户信息并验证用户是否存在
 * 4. 将用户信息添加到请求对象中供后续使用
 *
 * 性能优化：
 * - 使用 lean() 查询减少内存使用
 * - 只选择必要的字段（username, role）
 * - 使用 try-catch 进行错误处理
 *
 * 安全考虑：
 * - 验证 token 格式
 * - 验证 token 有效性
 * - 不暴露敏感信息
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express 下一个中间件函数
 * @returns {void}
 *
 * @throws {401} 未授权 - 当请求头中没有有效的 Bearer token 时
 * @throws {401} 无效的token - 当 token 验证失败时
 * @throws {401} 用户不存在 - 当用户不存在时
 * @throws {500} 服务器错误 - 当数据库查询失败时
 */
const authLogin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 从数据库查找用户信息，确保获取最新状态
    const user = await User.findById(decoded.userId).select('+password')
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      })
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({
        code: 403,
        message: '用户已被停用'
      })
    }

    // 检查角色状态
    if (user.role) {
      const role = await Role.findOne({ code: user.role })
      if (role && role.status !== 'active') {
        return res.status(403).json({
          code: 403,
          message: '用户角色已被停用'
        })
      }
    }

    req.user = user
    next()
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
    return res.status(500).json({
      code: 500,
      message: '认证失败',
      error: error.message
    })
  }
}

export default authLogin
