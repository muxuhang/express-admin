import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 检查 OpenRouter 配置...')
console.log('')

// 检查环境变量
const apiKey = process.env.OPENROUTER_API_KEY
const appUrl = process.env.APP_URL

console.log('环境变量检查:')
console.log(`OPENROUTER_API_KEY: ${apiKey ? '已配置' : '未配置'}`)
console.log(`APP_URL: ${appUrl || '未配置'}`)
console.log('')

if (!apiKey) {
  console.log('❌ OpenRouter API密钥未配置')
  console.log('')
  console.log('💡 解决方案:')
  console.log('1. 访问 https://openrouter.ai/keys 获取API密钥')
  console.log('2. 在 .env 文件中添加:')
  console.log('   OPENROUTER_API_KEY=your-api-key-here')
  console.log('3. 重启服务器')
  console.log('')
  console.log('📝 或者使用本地AI服务:')
  console.log('   - 安装 Ollama: https://ollama.ai/')
  console.log('   - 运行: ollama run mistral')
  console.log('   - 在请求中使用 service: "local"')
} else {
  console.log('✅ OpenRouter API密钥已配置')
  console.log('')
  console.log('🔧 建议配置:')
  console.log('APP_URL=http://localhost:8888')
  console.log('')
  console.log('📝 测试API密钥:')
  console.log('curl -H "Authorization: Bearer ' + apiKey.substring(0, 10) + '..." \\')
  console.log('     -H "Content-Type: application/json" \\')
  console.log('     https://openrouter.ai/api/v1/models')
} 