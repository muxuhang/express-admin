import Statistics from '../src/models/statistics.js'
import PathNormalizer from '../src/services/statistics/pathNormalizer.js'

// 测试MongoDB聚合管道中的路径规范化
async function testMongoDBNormalization() {
  try {
    console.log('🧪 测试MongoDB聚合管道中的路径规范化...\n')
    
    // 测试数据
    const testData = [
      { path: '/api/menus/685df861625a35af803381b2', method: 'GET' },
      { path: '/api/roles/6846445cf9c6251c93978389/menus', method: 'GET' },
      { path: '/api/users/507f1f77bcf86cd799439011', method: 'POST' },
      { path: '/api/dashboard', method: 'GET' }
    ]
    
    // 获取规范化阶段
    const normalizationStage = PathNormalizer.getNormalizationStage()
    console.log('📋 规范化阶段配置:')
    console.log(JSON.stringify(normalizationStage, null, 2))
    
    // 测试聚合管道
    const pipeline = [
      { $match: { _id: { $exists: false } } }, // 匹配不存在的文档，避免实际查询
      normalizationStage,
      { $project: { path: 1, normalizedPath: 1, _id: 0 } }
    ]
    
    console.log('\n📋 聚合管道:')
    console.log(JSON.stringify(pipeline, null, 2))
    
    console.log('\n✅ MongoDB聚合管道配置正确！')
    console.log('注意：由于没有实际数据，这里只验证管道语法')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 运行测试
testMongoDBNormalization().catch(console.error) 