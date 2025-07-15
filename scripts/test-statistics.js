import dotenv from 'dotenv'
import '../src/mongodb.js'
import StatisticsService from '../src/services/statistics.js'
import Statistics from '../src/models/statistics.js'
import mongoose from 'mongoose'

dotenv.config()

// 设置默认数据库连接
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://root:example@localhost:27017/admin?authSource=admin'
}

// 等待数据库连接
const waitForConnection = async () => {
  let attempts = 0
  const maxAttempts = 30
  
  while (attempts < maxAttempts) {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ 数据库连接成功')
      return true
    }
    
    console.log(`等待数据库连接... (${attempts + 1}/${maxAttempts})`)
    await new Promise(resolve => setTimeout(resolve, 1000))
    attempts++
  }
  
  throw new Error('数据库连接超时')
}

const testStatistics = async () => {
  try {
    console.log('🧪 开始测试统计功能...')
    console.log('数据库连接字符串:', process.env.MONGODB_URI)
    
    // 等待数据库连接
    await waitForConnection()
    
    // 测试记录活动
    console.log('\n1. 测试记录活动...')
    const testActivity = await StatisticsService.recordActivity({
      userId: '507f1f77bcf86cd799439011', // 测试用户ID
      username: 'testuser',
      type: 'api_call',
      action: 'test',
      path: '/api/test',
      method: 'GET',
      statusCode: 200,
      responseTime: 150,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test)',
      metadata: { test: true }
    })
    console.log('✅ 活动记录成功:', testActivity._id)
    
    // 测试获取系统统计
    console.log('\n2. 测试获取系统统计...')
    const systemStats = await StatisticsService.getSystemStats()
    console.log('✅ 系统统计:', JSON.stringify(systemStats, null, 2))
    
    // 测试获取实时统计
    console.log('\n3. 测试获取实时统计...')
    const realtimeStats = await StatisticsService.getRealTimeStats()
    console.log('✅ 实时统计:', JSON.stringify(realtimeStats, null, 2))
    
    // 测试获取热门页面
    console.log('\n4. 测试获取热门页面...')
    const popularPages = await StatisticsService.getPopularPages(null, null, 5)
    console.log('✅ 热门页面:', JSON.stringify(popularPages, null, 2))
    
    // 测试获取API性能统计
    console.log('\n5. 测试获取API性能统计...')
    const apiPerformance = await StatisticsService.getApiPerformance()
    console.log('✅ API性能统计:', JSON.stringify(apiPerformance, null, 2))
    
    // 测试清理功能
    console.log('\n6. 测试清理功能...')
    const deletedCount = await StatisticsService.cleanupOldData(1) // 只保留1天的数据
    console.log('✅ 清理完成，删除了', deletedCount, '条记录')
    
    console.log('\n🎉 统计功能测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    // 等待一段时间后退出，确保数据库操作完成
    setTimeout(() => {
      process.exit(0)
    }, 1000)
  }
}

testStatistics() 