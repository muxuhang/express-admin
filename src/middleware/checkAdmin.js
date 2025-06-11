import User from '../models/user.js'
import handleError from '../utils/handleError.js'

/**
 * 管理员权限验证中间件
 * 用于验证请求是否来自具有管理员权限的用户
 *
 * 验证流程：
 * 1. 检查请求头中是否包含有效的 Bearer token
 * 2. 验证 token 的有效性并解析用户信息
 * 3. 查询用户信息并验证是否具有管理员角色
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
 * - 验证用户角色
 * - 不暴露敏感信息
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express 下一个中间件函数
 * @returns {void}
 *
 * @throws {401} 未授权 - 当请求头中没有有效的 Bearer token 时
 * @throws {401} 无效的token - 当 token 验证失败时
 * @throws {403} 无权限访问 - 当用户不是管理员时
 * @throws {500} 服务器错误 - 当数据库查询失败时
 */
const checkAdmin = async (req, res, next) => {
  try {
    // 检查请求头中的 Bearer token
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        error: 'Missing or invalid authorization header',
      })
    }

    // 提取并验证 token
    const token = auth.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        error: 'Empty token',
      })
    }
    let payload
    try {
      payload = verifyToken(req)
    } catch (jwtError) {
      return res.status(401).json({
        code: 401,
        message: '无效的token',
        error: jwtError.message,
      })
    }

    // 查询用户信息
    const user = await User.findById(payload.id).select('username role').lean().exec()

    // 验证用户是否存在且具有管理员角色
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在',
        error: 'User not found',
      })
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权限访问',
        error: 'User is not an admin',
      })
    }

    // 将用户信息添加到请求对象中
    req.user = user
    next()
  } catch (err) {
    handleError(err, req, res)
  }
}

export default checkAdmin
