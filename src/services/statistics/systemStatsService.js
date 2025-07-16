import Statistics from '../../models/statistics.js'
import User from '../../models/user.js'
import PathNormalizer from './pathNormalizer.js'

/**
 * 系统统计服务
 * 负责获取系统总体统计信息
 */

class SystemStatsService {
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
                  $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
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
        PathNormalizer.getNormalizationStage(),
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
                $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
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
          PathNormalizer.getNormalizationStage(),
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
}

export default SystemStatsService 