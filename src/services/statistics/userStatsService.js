import Statistics from '../../models/statistics.js'
import User from '../../models/user.js'

/**
 * 用户统计服务
 * 负责获取用户相关的统计信息
 */

class UserStatsService {
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
                  $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
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
}

export default UserStatsService 