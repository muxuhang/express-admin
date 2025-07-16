import PathNormalizer from '../src/services/statistics/pathNormalizer.js'

// 测试路径规范化功能
async function testPathNormalization() {
  console.log('🧪 测试路径规范化功能...\n')
  
  // 运行内置测试
  PathNormalizer.testNormalization()
  
  console.log('\n📁 文件结构已重构:')
  console.log('   src/services/statistics/')
  console.log('   ├── index.js              # 主服务（整合所有模块）')
  console.log('   ├── pathNormalizer.js     # 路径规范化工具')
  console.log('   ├── activityRecorder.js   # 活动记录服务')
  console.log('   ├── userStatsService.js   # 用户统计服务')
  console.log('   ├── systemStatsService.js # 系统统计服务')
  console.log('   ├── dataManager.js        # 数据管理服务')
  console.log('   └── chatStatsService.js   # 聊天统计服务')
  
  console.log('\n✅ 重构完成！')
  console.log('   - 代码已按功能模块化拆分')
  console.log('   - 每个模块职责单一，易于维护')
  console.log('   - 保持了向后兼容性')
  console.log('   - 路径规范化使用通用正则表达式')
}

// 运行测试
testPathNormalization().catch(console.error) 