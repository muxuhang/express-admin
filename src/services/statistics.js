import Statistics from '../models/statistics.js'
import User from '../models/user.js'

class StatisticsService {
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
        StatisticsService.recordActivity({
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
        StatisticsService.recordActivity({
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
      await StatisticsService.recordActivity({
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
      await StatisticsService.recordActivity({
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
      
      await StatisticsService.recordActivity({
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

  /**
   * 获取用户统计
   */
  static async getUserStats(userId, startDate = null, endDate = null) {
    try {
      const stats = await Statistics.getUserStats(userId, startDate, endDate)
      
      // 获取用户基本信息
      const user = await User.findById(userId).select('username email role status createdAt lastLoginAt')
      
      return {
        user,
        stats,
        summary: {
          totalActions: stats.reduce((sum, stat) => sum + stat.totalCount, 0),
          totalErrors: stats.reduce((sum, stat) => sum + stat.totalErrors, 0),
          errorRate: (() => {
            const totalActions = stats.reduce((sum, stat) => sum + stat.totalCount, 0)
            const totalErrors = stats.reduce((sum, stat) => sum + stat.totalErrors, 0)
            return totalActions > 0 ? parseFloat(((totalErrors / totalActions) * 100).toFixed(2)) : 0
          })()
        }
      }
    } catch (error) {
      console.error('获取用户统计失败:', error)
      throw error
    }
  }

  /**
   * 获取系统总体统计
   */
  static async getSystemStats(startDate = null, endDate = null) {
    try {
      const stats = await Statistics.getSystemStats(startDate, endDate)
      
      // 获取用户总数
      const totalUsers = await User.countDocuments()
      const activeUsers = await User.countDocuments({ status: 'active' })
      
      return {
        stats,
        summary: {
          totalUsers,
          activeUsers,
          totalActions: stats.reduce((sum, stat) => sum + stat.totalCount, 0),
          totalUniqueUsers: stats.reduce((sum, stat) => sum + stat.totalUniqueUsers, 0)
        }
      }
    } catch (error) {
      console.error('获取系统统计失败:', error)
      throw error
    }
  }

  /**
   * 获取用户统计列表
   */
  static async getUsersStatsList(startDate = null, endDate = null, page = 1, limit = 10) {
    try {
      // 确保参数为数字类型
      const pageNum = parseInt(page) || 1
      const limitNum = parseInt(limit) || 10
      
      // 构建时间过滤条件
      const timeFilter = {}
      if (startDate && endDate) {
        timeFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }

      const skip = (pageNum - 1) * limitNum

      // 获取用户统计数据
      const [usersWithStats, total] = await Promise.all([
        Statistics.aggregate([
          { $match: timeFilter },
          {
            $group: {
              _id: '$userId',
              totalActions: { $sum: 1 },
              totalErrors: {
                $sum: {
                  $cond: [{ $ne: ['$statusCode', 200] }, 1, 0]
                }
              },
              avgResponseTime: { $avg: '$responseTime' },
              pageViews: {
                $sum: {
                  $cond: [{ $eq: ['$type', 'page_view'] }, 1, 0]
                }
              },
              apiCalls: {
                $sum: {
                  $cond: [{ $eq: ['$type', 'api_call'] }, 1, 0]
                }
              },
              logins: {
                $sum: {
                  $cond: [{ $eq: ['$type', 'login'] }, 1, 0]
                }
              },
              lastActivity: { $max: '$createdAt' },
              firstActivity: { $min: '$createdAt' }
            }
          },
          {
            $project: {
              _id: 1,
              totalActions: 1,
              totalErrors: 1,
              errorRate: {
                $cond: [
                  { $gt: ['$totalActions', 0] },
                  {
                    $round: [
                      { $multiply: [{ $divide: ['$totalErrors', '$totalActions'] }, 100] },
                      2
                    ]
                  },
                  0
                ]
              },
              avgResponseTime: { $round: ['$avgResponseTime', 2] },
              pageViews: 1,
              apiCalls: 1,
              logins: 1,
              lastActivity: 1,
              firstActivity: 1
            }
          },
          { $sort: { totalActions: -1 } },
          { $skip: skip },
          { $limit: limitNum }
        ]),
        Statistics.aggregate([
          { $match: timeFilter },
          {
            $group: {
              _id: '$userId'
            }
          },
          {
            $count: 'total'
          }
        ])
      ])

      // 获取用户详细信息
      const userIds = usersWithStats.map(user => user._id).filter(id => id != null)
      const users = await User.find({ _id: { $in: userIds } }).select('username email role status createdAt lastLoginAt')

      // 合并用户信息和统计数据
      const usersMap = new Map(users.map(user => [user._id?.toString() || '', user]))
      const result = usersWithStats.map(stat => ({
        _id: stat._id?.toString() || '',
        username: usersMap.get(stat._id?.toString() || '')?.username || 'unknown',
        email: usersMap.get(stat._id?.toString() || '')?.email || '',
        role: usersMap.get(stat._id?.toString() || '')?.role || '',
        status: usersMap.get(stat._id?.toString() || '')?.status || '',
        totalActions: stat.totalActions,
        totalErrors: stat.totalErrors,
        errorRate: stat.errorRate,
        avgResponseTime: stat.avgResponseTime,
        pageViews: stat.pageViews,
        apiCalls: stat.apiCalls,
        logins: stat.logins,
        lastActivity: stat.lastActivity,
        firstActivity: stat.firstActivity,
        createdAt: usersMap.get(stat._id?.toString() || '')?.createdAt || null,
        lastLoginAt: usersMap.get(stat._id?.toString() || '')?.lastLoginAt || null
      }))

      return {
        total: total[0]?.total || 0,
        list: result
      }
    } catch (error) {
      console.error('获取用户统计列表失败:', error)
      throw error
    }
  }

  /**
   * 获取热门页面
   */
  static async getPopularPages(startDate = null, endDate = null, page = 1, limit = 10) {
    try {
      // 确保参数为数字类型
      const pageNum = parseInt(page) || 1
      const limitNum = parseInt(limit) || 10
      
      const match = { type: 'page_view' }
      
      if (startDate && endDate) {
        match.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
      
      const skip = (pageNum - 1) * limitNum
      
      const [pages, total] = await Promise.all([
        Statistics.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$path',
              count: { $sum: 1 },
              uniqueUsers: { $addToSet: '$userId' },
              avgResponseTime: { $avg: '$responseTime' },
              errorCount: {
                $sum: {
                  $cond: [{ $ne: ['$statusCode', 200] }, 1, 0]
                }
              },
              lastAccess: { $max: '$createdAt' }
            }
          },
          {
            $project: {
              path: '$_id',
              count: 1,
              uniqueUsers: { $size: '$uniqueUsers' },
              avgResponseTime: { $round: ['$avgResponseTime', 2] },
              errorCount: 1,
              errorRate: {
                $cond: [
                  { $gt: ['$count', 0] },
                  {
                    $round: [
                      { $multiply: [{ $divide: ['$errorCount', '$count'] }, 100] },
                      2
                    ]
                  },
                  0
                ]
              },
              lastAccess: 1
            }
          },
          { $sort: { count: -1 } },
          { $skip: skip },
          { $limit: limitNum }
        ]),
        Statistics.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$path'
            }
          },
          {
            $count: 'total'
          }
        ])
      ])

      return {
        total: total[0]?.total || 0,
        list: pages.map(page => ({
          _id: page.path,
          path: page.path,
          title: this.getPageTitle(page.path),
          count: page.count,
          uniqueUsers: page.uniqueUsers,
          avgResponseTime: page.avgResponseTime,
          errorCount: page.errorCount,
          errorRate: page.errorRate,
          lastAccess: page.lastAccess
        }))
      }
    } catch (error) {
      console.error('获取热门页面失败:', error)
      throw error
    }
  }

  /**
   * 获取API性能统计
   */
  static async getApiPerformance(startDate = null, endDate = null, page = 1, limit = 10, sortParam = null) {
    try {
      // 确保参数为数字类型
      const pageNum = parseInt(page) || 1
      const limitNum = parseInt(limit) || 10
      
      // 验证排序字段
      const validSortFields = ['avgResponseTime', 'count', 'errorCount', 'errorRate']
      const validSortOrders = ['asc', 'desc', 'ascend', 'descend']
      
      // 处理排序参数
      let sortStage = null
      if (sortParam) {
        // 解析排序参数，格式如 "avgResponseTime=ascend"
        const [field, order] = sortParam.split('=')
        
        if (validSortFields.includes(field) && validSortOrders.includes(order?.toLowerCase())) {
          const finalSortOrder = (order.toLowerCase() === 'asc' || order.toLowerCase() === 'ascend') ? 1 : -1
          sortStage = { $sort: { [field]: finalSortOrder } }
        }
      }
      
      const match = { type: 'api_call' }
      
      if (startDate && endDate) {
        match.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
      
      const skip = (pageNum - 1) * limitNum
      
      // 构建聚合管道
      const pipeline = [
        { $match: match },
        // 添加路径规范化阶段
        {
          $addFields: {
            normalizedPath: {
              $switch: {
                branches: [
                  // 用户统计路径
                  {
                    case: {
                      $regexMatch: {
                        input: '$path',
                        regex: '^/api/statistics/user/[0-9a-fA-F]{24}$'
                      }
                    },
                    then: '/api/statistics/user/:id'
                  },
                  // 用户管理路径
                  {
                    case: {
                      $regexMatch: {
                        input: '$path',
                        regex: '^/api/users/[0-9a-fA-F]{24}$'
                      }
                    },
                    then: '/api/users/:id'
                  },
                  // 文章管理路径
                  {
                    case: {
                      $regexMatch: {
                        input: '$path',
                        regex: '^/api/articles/[0-9a-fA-F]{24}$'
                      }
                    },
                    then: '/api/articles/:id'
                  },
                  // 菜单管理路径
                  {
                    case: {
                      $regexMatch: {
                        input: '$path',
                        regex: '^/api/menus/[0-9a-fA-F]{24}$'
                      }
                    },
                    then: '/api/menus/:id'
                  },
                  // 推送任务路径
                  {
                    case: {
                      $regexMatch: {
                        input: '$path',
                        regex: '^/api/pusher/tasks/[0-9a-fA-F]{24}$'
                      }
                    },
                    then: '/api/pusher/tasks/:id'
                  }
                ],
                default: '$path'
              }
            }
          }
        },
        {
          $group: {
            _id: { path: '$normalizedPath', method: '$method' },
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            maxResponseTime: { $max: '$responseTime' },
            minResponseTime: { $min: '$responseTime' },
            totalRequestSize: { $sum: '$requestSize' },
            totalResponseSize: { $sum: '$responseSize' },
            errorCount: {
              $sum: {
                $cond: [{ $ne: ['$statusCode', 200] }, 1, 0]
              }
            },
            lastCall: { $max: '$createdAt' }
          }
        },
        {
          $project: {
            path: '$_id.path',
            method: '$_id.method',
            count: 1,
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            maxResponseTime: 1,
            minResponseTime: 1,
            totalRequestSize: 1,
            totalResponseSize: 1,
            errorCount: 1,
            errorRate: {
              $cond: [
                { $gt: ['$count', 0] },
                {
                  $round: [
                    { $multiply: [{ $divide: ['$errorCount', '$count'] }, 100] },
                    2
                  ]
                },
                0
              ]
            },
            lastCall: 1
          }
        }
      ]
      
      // 添加排序阶段（在project之后，skip和limit之前）
      if (sortStage) {
        pipeline.push(sortStage)
      }
      
      pipeline.push({ $skip: skip }, { $limit: limitNum })
      
      const [apis, total] = await Promise.all([
        Statistics.aggregate(pipeline),
        Statistics.aggregate([
          { $match: match },
          // 添加路径规范化阶段（用于计算总数）
          {
            $addFields: {
              normalizedPath: {
                $switch: {
                  branches: [
                    // 用户统计路径
                    {
                      case: {
                        $regexMatch: {
                          input: '$path',
                          regex: '^/api/statistics/user/[0-9a-fA-F]{24}$'
                        }
                      },
                      then: '/api/statistics/user/:id'
                    },
                    // 用户管理路径
                    {
                      case: {
                        $regexMatch: {
                          input: '$path',
                          regex: '^/api/users/[0-9a-fA-F]{24}$'
                        }
                      },
                      then: '/api/users/:id'
                    },
                    // 文章管理路径
                    {
                      case: {
                        $regexMatch: {
                          input: '$path',
                          regex: '^/api/articles/[0-9a-fA-F]{24}$'
                        }
                      },
                      then: '/api/articles/:id'
                    },
                    // 菜单管理路径
                    {
                      case: {
                        $regexMatch: {
                          input: '$path',
                          regex: '^/api/menus/[0-9a-fA-F]{24}$'
                        }
                      },
                      then: '/api/menus/:id'
                    },
                    // 推送任务路径
                    {
                      case: {
                        $regexMatch: {
                          input: '$path',
                          regex: '^/api/pusher/tasks/[0-9a-fA-F]{24}$'
                        }
                      },
                      then: '/api/pusher/tasks/:id'
                    }
                  ],
                  default: '$path'
                }
              }
            }
          },
          {
            $group: {
              _id: { path: '$normalizedPath', method: '$method' }
            }
          },
          {
            $count: 'total'
          }
        ])
      ])

      return {
        total: total[0]?.total || 0,
        list: apis.map(api => ({
          _id: `${api.method}_${api.path}`,
          path: api.path,
          method: api.method,
          count: api.count,
          avgResponseTime: api.avgResponseTime,
          maxResponseTime: api.maxResponseTime,
          minResponseTime: api.minResponseTime,
          errorCount: api.errorCount,
          errorRate: api.errorRate,
          totalRequestSize: api.totalRequestSize,
          totalResponseSize: api.totalResponseSize,
          lastCall: api.lastCall
        }))
      }
    } catch (error) {
      console.error('获取API性能统计失败:', error)
      throw error
    }
  }

  /**
   * 获取实时统计
   */
  static async getRealTimeStats() {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      const [hourlyStats, dailyStats, totalUsers, activeUsers] = await Promise.all([
        Statistics.countDocuments({ createdAt: { $gte: oneHourAgo } }),
        Statistics.countDocuments({ createdAt: { $gte: oneDayAgo } }),
        User.countDocuments(),
        User.countDocuments({ status: 'active' })
      ])
      
      return {
        hourly: {
          totalActions: hourlyStats,
          pageViews: await Statistics.countDocuments({ 
            type: 'page_view', 
            createdAt: { $gte: oneHourAgo } 
          }),
          apiCalls: await Statistics.countDocuments({ 
            type: 'api_call', 
            createdAt: { $gte: oneHourAgo } 
          }),
          errors: await Statistics.countDocuments({ 
            type: 'error', 
            createdAt: { $gte: oneHourAgo } 
          })
        },
        daily: {
          totalActions: dailyStats,
          pageViews: await Statistics.countDocuments({ 
            type: 'page_view', 
            createdAt: { $gte: oneDayAgo } 
          }),
          apiCalls: await Statistics.countDocuments({ 
            type: 'api_call', 
            createdAt: { $gte: oneDayAgo } 
          }),
          errors: await Statistics.countDocuments({ 
            type: 'error', 
            createdAt: { $gte: oneDayAgo } 
          })
        },
        users: {
          total: totalUsers,
          active: activeUsers
        }
      }
    } catch (error) {
      console.error('获取实时统计失败:', error)
      throw error
    }
  }

  /**
   * 清理旧数据
   */
  static async cleanupOldData(daysToKeep = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
      
      const result = await Statistics.deleteMany({
        createdAt: { $lt: cutoffDate }
      })
      
      console.log(`清理了 ${result.deletedCount} 条旧统计数据`)
      return result.deletedCount
    } catch (error) {
      console.error('清理旧统计数据失败:', error)
      throw error
    }
  }

  /**
   * 启动定时清理任务
   */
  static startCleanupScheduler() {
    // 每天凌晨2点执行清理任务
    const cleanupInterval = setInterval(async () => {
      const now = new Date()
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        try {
          console.log('开始执行统计数据清理任务...')
          const deletedCount = await StatisticsService.cleanupOldData(90)
          console.log(`统计数据清理完成，删除了 ${deletedCount} 条记录`)
        } catch (error) {
          console.error('统计数据清理任务失败:', error)
        }
      }
    }, 60000) // 每分钟检查一次
    
    // 应用关闭时清理定时器
    process.on('SIGINT', () => {
      clearInterval(cleanupInterval)
      console.log('统计数据清理调度器已停止')
    })
    
    process.on('SIGTERM', () => {
      clearInterval(cleanupInterval)
      console.log('统计数据清理调度器已停止')
    })
    
    console.log('✅ 统计数据清理调度器启动成功，每天凌晨2点执行清理')
  }

  /**
   * 获取统计概览
   */
  static async getOverview() {
    try {
      const [systemStats, realtimeStats, popularPages, apiPerformance, topUsers] = await Promise.all([
        StatisticsService.getSystemStats(),
        StatisticsService.getRealTimeStats(),
        StatisticsService.getPopularPages(null, null, 1, 5),
        StatisticsService.getApiPerformance(null, null, 1, 5),
        StatisticsService.getTopUsers(5)
      ])

      // 获取所有用户的最后访问时间
      const allUsersLastActivity = await Statistics.aggregate([
        {
          $group: {
            _id: '$userId',
            username: { $first: '$username' },
            lastActivity: { $max: '$createdAt' }
          }
        },
        {
          $match: {
            _id: { $ne: null }
          }
        },
        {
          $sort: { lastActivity: -1 }
        }
      ])

      return {
        summary: {
          totalUsers: systemStats.summary?.totalUsers || 0,
          activeUsers: systemStats.summary?.activeUsers || 0,
          totalActions: systemStats.summary?.totalActions || 0,
          totalErrors: systemStats.summary?.totalErrors || 0,
          errorRate: (() => {
            const totalActions = systemStats.summary?.totalActions || 0
            const totalErrors = systemStats.summary?.totalErrors || 0
            return totalActions > 0 ? parseFloat(((totalErrors / totalActions) * 100).toFixed(2)) : 0
          })(),
          avgResponseTime: systemStats.summary?.avgResponseTime || 0
        },
        recentActivity: realtimeStats.recentActivity || {
          today: { pageViews: 0, apiCalls: 0, logins: 0, errors: 0 },
          week: { pageViews: 0, apiCalls: 0, logins: 0, errors: 0 },
          month: { pageViews: 0, apiCalls: 0, logins: 0, errors: 0 }
        },
        topPages: popularPages.list || [],
        topUsers: topUsers || [],
        usersLastActivity: allUsersLastActivity.map(user => ({
          _id: user._id?.toString() || '',
          username: user.username || 'unknown',
          lastActivity: user.lastActivity
        }))
      }
    } catch (error) {
      console.error('获取统计概览失败:', error)
      throw error
    }
  }

  /**
   * 获取活跃用户列表
   */
  static async getTopUsers(limit = 5) {
    try {
      // 确保参数为数字类型
      const limitNum = parseInt(limit) || 5
      
      const users = await Statistics.aggregate([
        {
          $group: {
            _id: '$userId',
            totalActions: { $sum: 1 },
            username: { $first: '$username' },
            lastActivity: { $max: '$createdAt' }
          }
        },
        {
          $project: {
            _id: 1,
            username: 1,
            totalActions: 1,
            lastActivity: 1
          }
        },
        { $sort: { totalActions: -1 } },
        { $limit: limitNum }
      ])

      return users.map(user => ({
        _id: user._id?.toString() || '',
        username: user.username || 'unknown',
        totalActions: user.totalActions,
        lastActivity: user.lastActivity
      }))
    } catch (error) {
      console.error('获取活跃用户失败:', error)
      return []
    }
  }

  /**
   * 根据路径获取页面标题
   */
  static getPageTitle(path) {
    const titleMap = {
      '/': '首页',
      '/dashboard': '仪表板',
      '/users': '用户管理',
      '/roles': '角色管理',
      '/menus': '菜单管理',
      '/statistics': '统计分析',
      '/profile': '个人资料',
      '/login': '登录页面',
      '/register': '注册页面'
    }
    
    return titleMap[path] || path
  }

  /**
   * 生成假数据用于测试
   */
  static async generateFakeData() {
    try {
      console.log('开始生成假数据...')
      
      const users = await User.find().limit(10)
      const paths = [
        // 页面访问
        '/dashboard',
        '/users',
        '/roles', 
        '/menus',
        '/statistics',
        '/profile',
        '/settings',
        '/notifications',
        '/help',
        '/about',
        // API调用
        '/api/users',
        '/api/roles',
        '/api/menus',
        '/api/statistics',
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/register',
        '/api/push',
        '/api/chat',
        '/api/upload'
      ]
      
      const methods = ['GET', 'POST', 'PUT', 'DELETE']
      const statusCodes = [200, 201, 400, 401, 403, 404, 500]
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
      ]
      
      const fakeData = []
      const now = new Date()
      
      // 生成过去30天的数据
      for (let day = 30; day >= 0; day--) {
        const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000)
        
        // 每天生成30-80条记录，周末和节假日更少
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        const dailyRecords = isWeekend ? 
          Math.floor(Math.random() * 20) + 10 : 
          Math.floor(Math.random() * 50) + 30
        
        for (let i = 0; i < dailyRecords; i++) {
          const user = users.length > 0 ? users[Math.floor(Math.random() * users.length)] : null
          const path = paths[Math.floor(Math.random() * paths.length)]
          const method = methods[Math.floor(Math.random() * methods.length)]
          const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)]
          const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
          
          // 根据路径类型调整响应时间
          let responseTime
          if (path.startsWith('/api/')) {
            responseTime = Math.floor(Math.random() * 800) + 100 // API调用 100-900ms
          } else {
            responseTime = Math.floor(Math.random() * 500) + 50 // 页面访问 50-550ms
          }
          
          // 根据状态码调整响应时间（错误通常更快）
          if (statusCode >= 400) {
            responseTime = Math.floor(Math.random() * 200) + 20
          }
          
          // 随机生成时间戳（当天内，工作时间更多）
          const hour = Math.floor(Math.random() * 24)
          const isWorkHour = hour >= 9 && hour <= 18
          const timeWeight = isWorkHour ? 0.7 : 0.3
          
          const timestamp = new Date(date.getTime() + 
            (hour * 60 * 60 * 1000) + 
            (Math.random() * 60 * 60 * 1000 * timeWeight))
          
          // 生成IP地址
          const ipSegments = [
            Math.floor(Math.random() * 255) + 1,
            Math.floor(Math.random() * 255) + 1,
            Math.floor(Math.random() * 255) + 1,
            Math.floor(Math.random() * 255) + 1
          ]
          const ipAddress = ipSegments.join('.')
          
          const record = {
            userId: user?._id || null,
            username: user?.username || 'anonymous',
            type: path.startsWith('/api/') ? 'api_call' : 'page_view',
            action: path.startsWith('/api/') ? method.toLowerCase() : 'view',
            path,
            method,
            statusCode,
            responseTime,
            requestSize: Math.floor(Math.random() * 2000) + 100,
            responseSize: Math.floor(Math.random() * 10000) + 500,
            ipAddress,
            userAgent,
            referer: Math.random() > 0.6 ? 'https://example.com' : '',
            metadata: {
              query: Math.random() > 0.5 ? { page: Math.floor(Math.random() * 10) + 1 } : {},
              body: Math.random() > 0.7 ? { data: 'test' } : {},
              params: Math.random() > 0.8 ? { id: Math.floor(Math.random() * 100) + 1 } : {}
            },
            error: statusCode >= 400 ? {
              message: `HTTP ${statusCode} Error`,
              code: statusCode,
              details: statusCode === 404 ? 'Resource not found' : 
                      statusCode === 401 ? 'Unauthorized' : 
                      statusCode === 403 ? 'Forbidden' : 
                      statusCode === 500 ? 'Internal server error' : 'Bad request'
            } : null,
            sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: timestamp
          }
          
          fakeData.push(record)
        }
        
        // 添加一些登录/登出记录
        if (users.length > 0 && Math.random() > 0.7) {
          const user = users[Math.floor(Math.random() * users.length)]
          const loginTime = new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000)
          
          // 登录记录
          fakeData.push({
            userId: user._id,
            username: user.username,
            type: 'login',
            action: 'login',
            path: '/api/auth/login',
            method: 'POST',
            statusCode: 200,
            responseTime: Math.floor(Math.random() * 300) + 100,
            requestSize: 200,
            responseSize: 500,
            ipAddress: `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}`,
            userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
            referer: '',
            metadata: {},
            error: null,
            sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: loginTime
          })
          
          // 登出记录（通常在登录后几小时）
          const logoutTime = new Date(loginTime.getTime() + Math.random() * 8 * 60 * 60 * 1000)
          fakeData.push({
            userId: user._id,
            username: user.username,
            type: 'logout',
            action: 'logout',
            path: '/api/auth/logout',
            method: 'POST',
            statusCode: 200,
            responseTime: Math.floor(Math.random() * 100) + 50,
            requestSize: 100,
            responseSize: 200,
            ipAddress: `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}`,
            userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
            referer: '',
            metadata: {},
            error: null,
            sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: logoutTime
          })
        }
      }
      
      // 批量插入数据
      if (fakeData.length > 0) {
        await Statistics.insertMany(fakeData)
        console.log(`✅ 成功生成 ${fakeData.length} 条假数据`)
        return fakeData.length
      }
      
      return 0
    } catch (error) {
      console.error('生成假数据失败:', error)
      throw error
    }
  }

  /**
   * 清理所有统计数据
   */
  static async clearAllData() {
    try {
      const result = await Statistics.deleteMany({})
      console.log(`✅ 成功清理 ${result.deletedCount} 条统计数据`)
      return result.deletedCount
    } catch (error) {
      console.error('清理统计数据失败:', error)
      throw error
    }
  }
}

export default StatisticsService 