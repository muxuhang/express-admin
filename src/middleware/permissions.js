import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import Role from '../models/role.js'
import handleError from '../utils/handleError.js'
/**
 * 权限验证中间件
 * @param {string[]} requiredPermissions - 需要的权限列表
 */
const checkPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // 获取并验证 token
      const auth = req.headers.authorization
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ code: 401, message: '未授权，请先登录' })
      }
      const token = auth.replace('Bearer ', '')
      let payload
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET)
      } catch (error) {
        return res.status(401).json({ code: 401, message: '无效的token' })
      }
      
      // 获取用户信息
      const user = await User.findById(payload.id).select('username role status').lean().exec()
      if (!user) {
        return res.status(404).json({ code: 404, message: '用户不存在' })
      }

      // 检查用户状态
      if (user.status === 'inactive') {
        return res.status(403).json({ code: 403, message: '账户已被停用，无权限访问' })
      }

      // 获取用户角色
      const roleCode = user.role || payload.role
      const role = await Role.findOne({ code: roleCode, status: 'active' })

      if (!role) {
        return res.status(403).json({ code: 403, message: '用户角色无效或已被停用' })
      }

      // 检查权限
      // 如果角色拥有所有权限（*）或包含所需的所有权限，则允许访问
      const hasPermission =
        role.permissions.includes('*') ||
        requiredPermissions.every((permission) => role.permissions.includes(permission))

      if (!hasPermission) {
        return res.status(403).json({ code: 403, message: '无权限访问' })
      }

      // 将用户信息添加到请求对象中
      req.user = user
      next()
    } catch (error) {
      handleError(error, req, res)
    }
  }
}

export default checkPermissions
