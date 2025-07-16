/**
 * 聊天统计服务
 * 负责获取AI聊天相关的统计信息
 */

class ChatStatsService {
  /**
   * 获取AI聊天统计概览
   */
  static async getChatOverview(startDate = null, endDate = null) {
    try {
      const ChatMessage = (await import('../../models/chatMessage.js')).default
      
      // 构建时间过滤条件
      const timeFilter = {}
      if (startDate && endDate) {
        timeFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }

      const [
        totalMessages,
        totalSessions,
        uniqueUsers,
        servicesStats,
        modelsStats,
        performanceStats,
        recentActivity
      ] = await Promise.all([
        // 总消息数
        ChatMessage.countDocuments(timeFilter),
        
        // 总会话数
        ChatMessage.aggregate([
          { $match: timeFilter },
          { $group: { _id: '$sessionId' } },
          { $count: 'total' }
        ]),
        
        // 唯一用户数
        ChatMessage.aggregate([
          { $match: timeFilter },
          { $group: { _id: '$userId' } },
          { $count: 'total' }
        ]),
        
        // 服务统计
        ChatMessage.aggregate([
          { $match: timeFilter },
          {
            $group: {
              _id: '$service',
              count: { $sum: 1 },
              avgResponseTime: { $avg: '$responseTime' },
              errorCount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                }
              }
            }
          },
          {
            $project: {
              service: '$_id',
              count: 1,
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
              }
            }
          },
          { $sort: { count: -1 } }
        ]),
        
        // 模型统计
        ChatMessage.aggregate([
          { $match: { ...timeFilter, model: { $ne: null } } },
          {
            $group: {
              _id: '$model',
              count: { $sum: 1 },
              avgResponseTime: { $avg: '$responseTime' },
              errorCount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                }
              }
            }
          },
          {
            $project: {
              model: '$_id',
              count: 1,
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
              }
            }
          },
          { $sort: { count: -1 } }
        ]),
        
        // 性能统计
        ChatMessage.aggregate([
          { $match: timeFilter },
          {
            $group: {
              _id: null,
              avgResponseTime: { $avg: '$responseTime' },
              minResponseTime: { $min: '$responseTime' },
              maxResponseTime: { $max: '$responseTime' },
              totalChunks: { $sum: '$chunkCount' },
              avgChunks: { $avg: '$chunkCount' }
            }
          }
        ]),
        
        // 最近活动
        ChatMessage.aggregate([
          { $match: timeFilter },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: -1 } },
          { $limit: 7 }
        ])
      ])

      return {
        summary: {
          totalMessages: totalMessages,
          totalSessions: totalSessions[0]?.total || 0,
          uniqueUsers: uniqueUsers[0]?.total || 0,
          avgResponseTime: performanceStats[0]?.avgResponseTime || 0,
          minResponseTime: performanceStats[0]?.minResponseTime || 0,
          maxResponseTime: performanceStats[0]?.maxResponseTime || 0,
          totalChunks: performanceStats[0]?.totalChunks || 0,
          avgChunks: performanceStats[0]?.avgChunks || 0
        },
        services: servicesStats,
        models: modelsStats,
        recentActivity: recentActivity.map(item => ({
          date: item._id,
          count: item.count
        }))
      }
    } catch (error) {
      console.error('获取AI聊天统计概览失败:', error)
      throw error
    }
  }

  /**
   * 获取AI聊天用户统计
   */
  static async getChatUsersStats(startDate = null, endDate = null, page = 1, limit = 10) {
    try {
      const ChatMessage = (await import('../../models/chatMessage.js')).default
      
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

      const [usersWithStats, total] = await Promise.all([
        ChatMessage.aggregate([
          { $match: timeFilter },
          {
            $group: {
              _id: '$userId',
              totalMessages: { $sum: 1 },
              totalSessions: { $addToSet: '$sessionId' },
              services: { $addToSet: '$service' },
              models: { $addToSet: '$model' },
              avgResponseTime: { $avg: '$responseTime' },
              totalResponseTime: { $sum: '$responseTime' },
              errorCount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                }
              },
              totalChunks: { $sum: '$chunkCount' },
              lastActivity: { $max: '$createdAt' },
              firstActivity: { $min: '$createdAt' }
            }
          },
          {
            $project: {
              _id: 1,
              totalMessages: 1,
              totalSessions: { $size: '$totalSessions' },
              services: 1,
              models: { $filter: { input: '$models', cond: { $ne: ['$$this', null] } } },
              avgResponseTime: { $round: ['$avgResponseTime', 2] },
              totalResponseTime: 1,
              errorCount: 1,
              errorRate: {
                $cond: [
                  { $gt: ['$totalMessages', 0] },
                  {
                    $round: [
                      { $multiply: [{ $divide: ['$errorCount', '$totalMessages'] }, 100] },
                      2
                    ]
                  },
                  0
                ]
              },
              totalChunks: 1,
              avgChunks: {
                $cond: [
                  { $gt: ['$totalMessages', 0] },
                  { $round: [{ $divide: ['$totalChunks', '$totalMessages'] }, 2] },
                  0
                ]
              },
              lastActivity: 1,
              firstActivity: 1
            }
          },
          { $sort: { totalMessages: -1 } },
          { $skip: skip },
          { $limit: limitNum }
        ]),
        
        ChatMessage.aggregate([
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

      return {
        total: total[0]?.total || 0,
        list: usersWithStats.map(user => ({
          userId: user._id,
          totalMessages: user.totalMessages,
          totalSessions: user.totalSessions,
          services: user.services,
          models: user.models,
          avgResponseTime: user.avgResponseTime,
          totalResponseTime: user.totalResponseTime,
          errorCount: user.errorCount,
          errorRate: user.errorRate,
          totalChunks: user.totalChunks,
          avgChunks: user.avgChunks,
          lastActivity: user.lastActivity,
          firstActivity: user.firstActivity
        }))
      }
    } catch (error) {
      console.error('获取AI聊天用户统计失败:', error)
      throw error
    }
  }

  /**
   * 获取AI聊天服务统计
   */
  static async getChatServicesStats(startDate = null, endDate = null) {
    try {
      const ChatMessage = (await import('../../models/chatMessage.js')).default
      
      // 构建时间过滤条件
      const timeFilter = {}
      if (startDate && endDate) {
        timeFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }

      const stats = await ChatMessage.aggregate([
        { $match: timeFilter },
        {
          $group: {
            _id: '$service',
            totalMessages: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
            uniqueSessions: { $addToSet: '$sessionId' },
            avgResponseTime: { $avg: '$responseTime' },
            minResponseTime: { $min: '$responseTime' },
            maxResponseTime: { $max: '$responseTime' },
            totalResponseTime: { $sum: '$responseTime' },
            errorCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
              }
            },
            totalChunks: { $sum: '$chunkCount' },
            avgChunks: { $avg: '$chunkCount' },
            models: { $addToSet: '$model' }
          }
        },
        {
          $project: {
            service: '$_id',
            totalMessages: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            uniqueSessions: { $size: '$uniqueSessions' },
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            minResponseTime: 1,
            maxResponseTime: 1,
            totalResponseTime: 1,
            errorCount: 1,
            errorRate: {
              $cond: [
                { $gt: ['$totalMessages', 0] },
                {
                  $round: [
                    { $multiply: [{ $divide: ['$errorCount', '$totalMessages'] }, 100] },
                    2
                  ]
                },
                0
              ]
            },
            totalChunks: 1,
            avgChunks: { $round: ['$avgChunks', 2] },
            models: { $filter: { input: '$models', cond: { $ne: ['$$this', null] } } }
          }
        },
        { $sort: { totalMessages: -1 } }
      ])

      return stats
    } catch (error) {
      console.error('获取AI聊天服务统计失败:', error)
      throw error
    }
  }

  /**
   * 获取AI聊天模型统计
   */
  static async getChatModelsStats(startDate = null, endDate = null) {
    try {
      const ChatMessage = (await import('../../models/chatMessage.js')).default
      
      // 构建时间过滤条件
      const timeFilter = { model: { $ne: null } }
      if (startDate && endDate) {
        timeFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }

      const stats = await ChatMessage.aggregate([
        { $match: timeFilter },
        {
          $group: {
            _id: '$model',
            totalMessages: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
            uniqueSessions: { $addToSet: '$sessionId' },
            services: { $addToSet: '$service' },
            avgResponseTime: { $avg: '$responseTime' },
            minResponseTime: { $min: '$responseTime' },
            maxResponseTime: { $max: '$responseTime' },
            totalResponseTime: { $sum: '$responseTime' },
            errorCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
              }
            },
            totalChunks: { $sum: '$chunkCount' },
            avgChunks: { $avg: '$chunkCount' }
          }
        },
        {
          $project: {
            model: '$_id',
            totalMessages: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            uniqueSessions: { $size: '$uniqueSessions' },
            services: 1,
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            minResponseTime: 1,
            maxResponseTime: 1,
            totalResponseTime: 1,
            errorCount: 1,
            errorRate: {
              $cond: [
                { $gt: ['$totalMessages', 0] },
                {
                  $round: [
                    { $multiply: [{ $divide: ['$errorCount', '$totalMessages'] }, 100] },
                    2
                  ]
                },
                0
              ]
            },
            totalChunks: 1,
            avgChunks: { $round: ['$avgChunks', 2] }
          }
        },
        { $sort: { totalMessages: -1 } }
      ])

      return stats
    } catch (error) {
      console.error('获取AI聊天模型统计失败:', error)
      throw error
    }
  }

  /**
   * 获取AI聊天性能统计
   */
  static async getChatPerformanceStats(startDate = null, endDate = null) {
    try {
      const ChatMessage = (await import('../../models/chatMessage.js')).default
      
      // 构建时间过滤条件
      const timeFilter = {}
      if (startDate && endDate) {
        timeFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }

      const [
        overallStats,
        hourlyStats,
        dailyStats,
        responseTimeDistribution
      ] = await Promise.all([
        // 整体性能统计
        ChatMessage.aggregate([
          { $match: timeFilter },
          {
            $group: {
              _id: null,
              totalMessages: { $sum: 1 },
              avgResponseTime: { $avg: '$responseTime' },
              minResponseTime: { $min: '$responseTime' },
              maxResponseTime: { $max: '$responseTime' },
              totalResponseTime: { $sum: '$responseTime' },
              errorCount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                }
              },
              totalChunks: { $sum: '$chunkCount' },
              avgChunks: { $avg: '$chunkCount' }
            }
          }
        ]),
        
        // 按小时统计
        ChatMessage.aggregate([
          { $match: timeFilter },
          {
            $group: {
              _id: {
                hour: { $hour: '$createdAt' },
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              },
              count: { $sum: 1 },
              avgResponseTime: { $avg: '$responseTime' },
              errorCount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                }
              }
            }
          },
          {
            $project: {
              hour: '$_id.hour',
              date: '$_id.date',
              count: 1,
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
              }
            }
          },
          { $sort: { date: -1, hour: -1 } },
          { $limit: 168 } // 最近7天 * 24小时
        ]),
        
        // 按天统计
        ChatMessage.aggregate([
          { $match: timeFilter },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              },
              count: { $sum: 1 },
              uniqueUsers: { $addToSet: '$userId' },
              avgResponseTime: { $avg: '$responseTime' },
              errorCount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                }
              },
              totalChunks: { $sum: '$chunkCount' }
            }
          },
          {
            $project: {
              date: '$_id.date',
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
              totalChunks: 1,
              avgChunks: {
                $cond: [
                  { $gt: ['$count', 0] },
                  { $round: [{ $divide: ['$totalChunks', '$count'] }, 2] },
                  0
                ]
              }
            }
          },
          { $sort: { date: -1 } },
          { $limit: 30 } // 最近30天
        ]),
        
        // 响应时间分布
        ChatMessage.aggregate([
          { $match: timeFilter },
          {
            $bucket: {
              groupBy: '$responseTime',
              boundaries: [0, 1000, 2000, 5000, 10000, 30000, 60000, 120000],
              default: 'slow',
              output: {
                count: { $sum: 1 },
                avgResponseTime: { $avg: '$responseTime' }
              }
            }
          },
          {
            $project: {
              range: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$_id', 0] }, then: '0-1s' },
                    { case: { $eq: ['$_id', 1000] }, then: '1-2s' },
                    { case: { $eq: ['$_id', 2000] }, then: '2-5s' },
                    { case: { $eq: ['$_id', 5000] }, then: '5-10s' },
                    { case: { $eq: ['$_id', 10000] }, then: '10-30s' },
                    { case: { $eq: ['$_id', 30000] }, then: '30s-1m' },
                    { case: { $eq: ['$_id', 60000] }, then: '1-2m' },
                    { case: { $eq: ['$_id', 120000] }, then: '2m+' }
                  ],
                  default: 'slow'
                }
              },
              count: 1,
              avgResponseTime: { $round: ['$avgResponseTime', 2] }
            }
          },
          { $sort: { count: -1 } }
        ])
      ])

      return {
        overall: overallStats[0] || {
          totalMessages: 0,
          avgResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0,
          totalResponseTime: 0,
          errorCount: 0,
          totalChunks: 0,
          avgChunks: 0
        },
        hourly: hourlyStats,
        daily: dailyStats,
        responseTimeDistribution
      }
    } catch (error) {
      console.error('获取AI聊天性能统计失败:', error)
      throw error
    }
  }
}

export default ChatStatsService 