import Statistics from '../../models/statistics.js'

/**
 * 活动记录服务
 * 负责记录用户活动、页面访问、API调用等统计信息
 */

class ActivityRecorder {
  /**
   * 判断状态码是否为错误
   * 2xx 状态码都是成功的，包括 200, 201, 202, 204, 304 等
   * 4xx 和 5xx 状态码是错误
   */
  static isErrorStatusCode(statusCode) {
    return statusCode >= 400
  }

  /**
   * 记录用户活动
   */
  static async recordActivity(data) {
    try {
      const {
        userId,
        username,
        type,
        action,
        path,
        method = 'GET',
        statusCode = 200,
        responseTime = 0,
        requestSize = 0,
        responseSize = 0,
        ipAddress,
        userAgent,
        referer = '',
        metadata = {},
        error = null,
        sessionId = ''
      } = data

      // 验证必需字段
      if (!type || !action || !path || !ipAddress || !userAgent) {
        console.error('记录统计信息失败: 缺少必需字段', { type, action, path, ipAddress, userAgent })
        return null
      }

      // 处理userId，如果为空或无效则设为null
      let validUserId = null
      if (userId && userId !== 'undefined' && userId !== 'null') {
        try {
          // 验证userId是否为有效的ObjectId
          if (typeof userId === 'string' && userId.length === 24) {
            validUserId = userId
          } else if (userId._id) {
            validUserId = userId._id?.toString() || null
          }
        } catch (err) {
          console.warn('无效的userId:', userId)
        }
      }

      // 如果没有有效的userId，使用匿名用户标识
      const finalUserId = validUserId || null
      const finalUsername = username || 'anonymous'

      const statistics = new Statistics({
        userId: finalUserId,
        username: finalUsername,
        type,
        action,
        path,
        method,
        statusCode,
        responseTime,
        requestSize,
        responseSize,
        ipAddress,
        userAgent,
        referer,
        metadata,
        error,
        sessionId
      })

      await statistics.save()
      return statistics
    } catch (error) {
      console.error('记录统计信息失败:', error)
      // 不抛出错误，避免影响主流程
      return null
    }
  }

  /**
   * 记录页面访问
   */
  static async recordPageView(req, res, next, userInfo = null) {
    try {
      const startTime = Date.now()
      
      // 重写 res.end 来捕获响应时间
      const originalEnd = res.end
      res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime
        
        // 使用传入的用户信息或从req.user中获取
        const user = userInfo || req.user || {}
        const userId = user.userId || user._id || user.id || null
        const username = user.username || 'anonymous'
        
        // 异步记录统计信息
        ActivityRecorder.recordActivity({
          userId,
          username,
          type: 'page_view',
          action: 'view',
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          requestSize: req.headers['content-length'] || 0,
          responseSize: chunk ? chunk.length : 0,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'] || '',
          referer: req.headers.referer || '',
          sessionId: req.sessionID || ''
        }).catch(err => {
          console.error('记录页面访问统计失败:', err)
        })
        
        originalEnd.call(this, chunk, encoding)
      }
      
      next()
    } catch (error) {
      console.error('页面访问统计中间件错误:', error)
      next()
    }
  }

  /**
   * 记录API调用
   */
  static async recordApiCall(req, res, next, userInfo = null) {
    try {
      const startTime = Date.now()
      
      // 重写 res.end 来捕获响应时间
      const originalEnd = res.end
      res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime
        
        // 使用传入的用户信息或从req.user中获取
        const user = userInfo || req.user || {}
        const userId = user.userId || user._id || user.id || null
        const username = user.username || 'anonymous'
        
        // 异步记录统计信息
        ActivityRecorder.recordActivity({
          userId,
          username,
          type: 'api_call',
          action: req.method.toLowerCase(),
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          requestSize: req.headers['content-length'] || 0,
          responseSize: chunk ? chunk.length : 0,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'] || '',
          referer: req.headers.referer || '',
          metadata: {
            query: req.query,
            body: req.body,
            params: req.params
          },
          sessionId: req.sessionID || ''
        }).catch(err => {
          console.error('记录API调用统计失败:', err)
        })
        
        originalEnd.call(this, chunk, encoding)
      }
      
      next()
    } catch (error) {
      console.error('API调用统计中间件错误:', error)
      next()
    }
  }

  /**
   * 记录用户登录
   */
  static async recordLogin(userId, username, req) {
    try {
      await ActivityRecorder.recordActivity({
        userId,
        username,
        type: 'login',
        action: 'login',
        path: '/api/login',
        method: 'POST',
        statusCode: 200,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        referer: req.headers.referer || '',
        sessionId: req.sessionID || ''
      })
    } catch (error) {
      console.error('记录登录统计失败:', error)
    }
  }

  /**
   * 记录用户登出
   */
  static async recordLogout(userId, username, req) {
    try {
      await ActivityRecorder.recordActivity({
        userId,
        username,
        type: 'logout',
        action: 'logout',
        path: '/api/logout',
        method: 'POST',
        statusCode: 200,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        referer: req.headers.referer || '',
        sessionId: req.sessionID || ''
      })
    } catch (error) {
      console.error('记录登出统计失败:', error)
    }
  }

  /**
   * 记录错误
   */
  static async recordError(error, req, res) {
    try {
      const user = req.user || {}
      const userId = user._id || user.id
      const username = user.username || 'anonymous'
      
      await ActivityRecorder.recordActivity({
        userId,
        username,
        type: 'error',
        action: 'error',
        path: req.path,
        method: req.method,
        statusCode: res.statusCode || 500,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        referer: req.headers.referer || '',
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code
        },
        sessionId: req.sessionID || ''
      })
    } catch (err) {
      console.error('记录错误统计失败:', err)
    }
  }
}

export default ActivityRecorder 