import ActivityRecorder from './activityRecorder.js'
import UserStatsService from './userStatsService.js'
import SystemStatsService from './systemStatsService.js'
import DataManager from './dataManager.js'
import ChatStatsService from './chatStatsService.js'
import PathNormalizer from './pathNormalizer.js'

/**
 * 统计服务主类
 * 整合所有统计功能模块
 */

class StatisticsService {
  // 导出所有子服务的方法，保持向后兼容
  static isErrorStatusCode = ActivityRecorder.isErrorStatusCode
  static recordActivity = ActivityRecorder.recordActivity
  static recordPageView = ActivityRecorder.recordPageView
  static recordApiCall = ActivityRecorder.recordApiCall
  static recordLogin = ActivityRecorder.recordLogin
  static recordLogout = ActivityRecorder.recordLogout
  static recordError = ActivityRecorder.recordError

  // 用户统计相关
  static getUserStats = UserStatsService.getUserStats
  static getUsersStatsList = UserStatsService.getUsersStatsList
  static getTopUsers = UserStatsService.getTopUsers

  // 系统统计相关
  static getSystemStats = SystemStatsService.getSystemStats
  static getRealTimeStats = SystemStatsService.getRealTimeStats
  static getPopularPages = SystemStatsService.getPopularPages
  static getApiPerformance = SystemStatsService.getApiPerformance
  static getPageTitle = SystemStatsService.getPageTitle

  // 数据管理相关
  static cleanupOldData = DataManager.cleanupOldData
  static startCleanupScheduler = DataManager.startCleanupScheduler
  static generateFakeData = DataManager.generateFakeData
  static clearAllData = DataManager.clearAllData

  // 聊天统计相关
  static getChatOverview = ChatStatsService.getChatOverview
  static getChatUsersStats = ChatStatsService.getChatUsersStats
  static getChatServicesStats = ChatStatsService.getChatServicesStats
  static getChatModelsStats = ChatStatsService.getChatModelsStats
  static getChatPerformanceStats = ChatStatsService.getChatPerformanceStats

  // 路径规范化相关
  static hasObjectId = PathNormalizer.hasObjectId
  static normalizePath = PathNormalizer.normalizePath
  static getNormalizationStage = PathNormalizer.getNormalizationStage
  static testNormalization = PathNormalizer.testNormalization

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
      const Statistics = (await import('../../models/statistics.js')).default
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
}

export default StatisticsService 