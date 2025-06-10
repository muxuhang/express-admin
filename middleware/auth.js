import jwt from 'jsonwebtoken';
import User from '../models/user'

/**
 * 权限检查中间件
 * 用于检查用户是否具有特定权限
 */
export const checkPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // 从请求头中获取并处理 Bearer token
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({
          code: 401,
          message: '未授权'
        });
      }

      const token = auth.replace('Bearer ', '');
      console.log('Token:', token);
      
      // 验证 token 并解码用户信息
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      
      // 获取用户信息
      const user = await User.findOne({ _id: decoded.id }).select('username role permissions');
      console.log('Found user:', user);
      console.log('User:', User);
      
      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户不存在'
        });
      }

      // 如果用户是管理员，直接放行
      if (user.role === 'admin') {
        req.user = user;
        return next();
      }

      // 检查用户是否具有所需权限
      const hasPermission = requiredPermissions.every(permission => 
        user.permissions && user.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          code: 403,
          message: '没有权限执行此操作'
        });
      }

      // 将用户信息添加到请求对象中
      req.user = user;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        code: 500,
        message: '权限检查失败'
      });
    }
  };
};

/**
 * 身份验证中间件
 * 用于验证用户请求中的 JWT token
 * 如果验证失败，将返回 401 未授权错误
 */
const auth = async (req, res, next) => {
  // 允许访问首页和 index.html，无需验证
  if (req.path === '/' || req.path === '/index.html') {
    return next();
  }

  try {
    // 从请求头中获取并处理 Bearer token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // 检查 token 是否存在
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    // 验证 token 并解码用户信息
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查 token 是否过期
    const currentTime = new Date();
    const expTime = new Date(decoded.exp * 1000);
    if (currentTime > expTime) {
      return res.status(401).json({
        code: 401,
        message: '登录已过期，请重新登录'
      });
    }

    // 验证用户是否存在且 token 是否有效
    const user = await User.findOne({
      _id: decoded.id,
      'tokens.token': token,
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或 token 已失效'
      });
    }

    // 将用户信息添加到请求对象中
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      code: 401,
      message: '登录已过期，请重新登录'
    });
  }
};

export default auth; 