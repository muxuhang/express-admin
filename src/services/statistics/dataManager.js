import Statistics from '../../models/statistics.js'
import User from '../../models/user.js'

/**
 * 数据管理服务
 * 负责数据清理、生成测试数据等管理功能
 */

class DataManager {
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
          const deletedCount = await DataManager.cleanupOldData(90)
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
      const statusCodes = [200, 201, 202, 204, 304, 400, 401, 403, 404, 500]
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

export default DataManager 