import mongoose from 'mongoose'
import Statistics from '../src/models/statistics.js'
import StatisticsService from '../src/services/statistics.js'

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://root:example@localhost:27017/express-admin?authSource=admin')
    console.log('✅ 数据库连接成功')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    process.exit(1)
  }
}

// 生成测试数据
const generateTestData = async () => {
  console.log('📊 生成测试数据...')
  
  const testData = [
    // 用户统计路径 - 应该被规范化
    {
      userId: null,
      username: 'test',
      type: 'api_call',
      action: 'get',
      path: '/api/statistics/user/507f1f77bcf86cd799439011',
      method: 'GET',
      statusCode: 200,
      responseTime: 150,
      requestSize: 100,
      responseSize: 500,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date()
    },
    {
      userId: null,
      username: 'test',
      type: 'api_call',
      action: 'get',
      path: '/api/statistics/user/507f1f77bcf86cd799439012',
      method: 'GET',
      statusCode: 200,
      responseTime: 180,
      requestSize: 100,
      responseSize: 500,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date()
    },
    // 用户管理路径 - 应该被规范化
    {
      userId: null,
      username: 'test',
      type: 'api_call',
      action: 'get',
      path: '/api/users/507f1f77bcf86cd799439013',
      method: 'GET',
      statusCode: 200,
      responseTime: 120,
      requestSize: 100,
      responseSize: 500,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date()
    },
    // 普通路径 - 不应该被规范化
    {
      userId: null,
      username: 'test',
      type: 'api_call',
      action: 'get',
      path: '/api/statistics/system',
      method: 'GET',
      statusCode: 200,
      responseTime: 200,
      requestSize: 100,
      responseSize: 500,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date()
    }
  ]
  
  await Statistics.insertMany(testData)
  console.log(`✅ 生成了 ${testData.length} 条测试数据`)
}

// 测试路径规范化
const testPathNormalization = async () => {
  console.log('🧪 测试路径规范化功能...')
  
  try {
    const result = await StatisticsService.getApiPerformance()
    
    console.log('\n📋 API性能统计结果:')
    console.log('总数量:', result.total)
    console.log('\n路径列表:')
    
    result.list.forEach((api, index) => {
      console.log(`${index + 1}. ${api.method} ${api.path} (调用次数: ${api.count})`)
    })
    
    // 检查是否包含规范化的路径
    const hasNormalizedPaths = result.list.some(api => 
      api.path.includes('/:id') || 
      api.path === '/api/statistics/user/:id' ||
      api.path === '/api/users/:id'
    )
    
    if (hasNormalizedPaths) {
      console.log('\n✅ 路径规范化功能正常工作！')
    } else {
      console.log('\n❌ 路径规范化功能可能有问题')
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 清理测试数据
const cleanupTestData = async () => {
  console.log('🧹 清理测试数据...')
  await Statistics.deleteMany({
    path: {
      $in: [
        '/api/statistics/user/507f1f77bcf86cd799439011',
        '/api/statistics/user/507f1f77bcf86cd799439012',
        '/api/users/507f1f77bcf86cd799439013',
        '/api/statistics/system'
      ]
    }
  })
  console.log('✅ 测试数据清理完成')
}

// 主函数
const main = async () => {
  try {
    await connectDB()
    await cleanupTestData()
    await generateTestData()
    await testPathNormalization()
    await cleanupTestData()
    
    console.log('\n🎉 测试完成！')
    process.exit(0)
  } catch (error) {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  }
}

// 运行测试
main() 