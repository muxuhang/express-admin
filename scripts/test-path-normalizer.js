import PathNormalizer from '../src/services/statistics/pathNormalizer.js'

console.log('🧪 测试路径规范化功能...\n')

// 测试路径规范化
PathNormalizer.testNormalization()

console.log('\n📊 详细测试结果:')

// 测试会话ID模式识别
const sessionIdTestPaths = [
  '/api/chat/session/1753752506776',
  '/api/chat/session/user_1753752506770_917_1753756097491_awcrdhmpo',
  '/api/chat/session/1234567890123',
  '/api/chat/session/user_1234567890_123_1234567890_abcdef'
]

console.log('\n🔍 会话ID模式测试:')
sessionIdTestPaths.forEach((path, index) => {
  const hasSessionId = PathNormalizer.hasSessionId(path)
  const normalized = PathNormalizer.normalizePath(path)
  console.log(`${index + 1}. ${hasSessionId ? '✅' : '❌'} ${path}`)
  console.log(`   → ${normalized}`)
})

// 测试用户ID模式识别
const userIdTestPaths = [
  '/api/users/profile/user_9876543210_456_9876543210_xyz123',
  '/api/chat/history/user_1111111111_222_3333333333_test123',
  '/api/chat/messages/user_9999999999_888_7777777777_sample456'
]

console.log('\n🔍 用户ID模式测试:')
userIdTestPaths.forEach((path, index) => {
  const hasUserId = PathNormalizer.hasUserId(path)
  const normalized = PathNormalizer.normalizePath(path)
  console.log(`${index + 1}. ${hasUserId ? '✅' : '❌'} ${path}`)
  console.log(`   → ${normalized}`)
})

// 测试数字ID模式识别
const numericIdTestPaths = [
  '/api/users/1234567890123',
  '/api/articles/9876543210987',
  '/api/roles/5555555555555/menus'
]

console.log('\n🔍 数字ID模式测试:')
numericIdTestPaths.forEach((path, index) => {
  const hasNumericId = PathNormalizer.hasNumericId(path)
  const normalized = PathNormalizer.normalizePath(path)
  console.log(`${index + 1}. ${hasNumericId ? '✅' : '❌'} ${path}`)
  console.log(`   → ${normalized}`)
})

// 测试ObjectId模式识别
const objectIdTestPaths = [
  '/api/users/507f1f77bcf86cd799439011',
  '/api/roles/6846445cf9c6251c93978389/menus',
  '/api/articles/507f1f77bcf86cd799439013/status'
]

console.log('\n🔍 ObjectId模式测试:')
objectIdTestPaths.forEach((path, index) => {
  const hasObjectId = PathNormalizer.hasObjectId(path)
  const normalized = PathNormalizer.normalizePath(path)
  console.log(`${index + 1}. ${hasObjectId ? '✅' : '❌'} ${path}`)
  console.log(`   → ${normalized}`)
})

// 测试混合模式（同时包含用户ID和ObjectId）
const mixedTestPaths = [
  '/api/chat/session/user_1753752506770_917_1753756097491_awcrdhmpo/messages/507f1f77bcf86cd799439011',
  '/api/users/507f1f77bcf86cd799439011/profile/user_1234567890_123_1234567890_abcdef'
]

console.log('\n🔍 混合模式测试:')
mixedTestPaths.forEach((path, index) => {
  const hasUserId = PathNormalizer.hasUserId(path)
  const hasObjectId = PathNormalizer.hasObjectId(path)
  const normalized = PathNormalizer.normalizePath(path)
  console.log(`${index + 1}. 用户ID: ${hasUserId ? '✅' : '❌'}, ObjectId: ${hasObjectId ? '✅' : '❌'} ${path}`)
  console.log(`   → ${normalized}`)
})

// 测试普通路径（不应该被规范化）
const normalTestPaths = [
  '/api/dashboard',
  '/api/login',
  '/api/statistics/overview',
  '/api/chat/send',
  '/api/users/list',
  '/api/chat/session/active'
]

console.log('\n🔍 普通路径测试:')
normalTestPaths.forEach((path, index) => {
  const hasUserId = PathNormalizer.hasUserId(path)
  const hasObjectId = PathNormalizer.hasObjectId(path)
  const normalized = PathNormalizer.normalizePath(path)
  const shouldNotChange = normalized === path
  console.log(`${index + 1}. ${shouldNotChange ? '✅' : '❌'} ${path}`)
  console.log(`   → ${normalized} ${shouldNotChange ? '(未变化)' : '(已变化)'}`)
})

console.log('\n✅ 路径规范化测试完成！') 