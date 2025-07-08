import dotenv from 'dotenv'
import Pusher from 'pusher'

// 加载环境变量
dotenv.config()

console.log('🔍 检查 Pusher 配置...')
console.log('PUSHER_APP_ID:', process.env.PUSHER_APP_ID || '未设置')
console.log('PUSHER_KEY:', process.env.PUSHER_KEY || '未设置')
console.log('PUSHER_SECRET:', process.env.PUSHER_SECRET ? '已设置' : '未设置')
console.log('PUSHER_CLUSTER:', process.env.PUSHER_CLUSTER || '未设置')

// 检查是否有 Pusher 配置
if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
  console.log('❌ Pusher 环境变量未完全配置！')
  console.log('请创建 .env 文件并设置以下变量：')
  console.log('PUSHER_APP_ID=your_app_id')
  console.log('PUSHER_KEY=your_key')
  console.log('PUSHER_SECRET=your_secret')
  console.log('PUSHER_CLUSTER=your_cluster')
  process.exit(1)
}

// 尝试创建 Pusher 实例
try {
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
  })
  
  console.log('✅ Pusher 实例创建成功')
  
  // 测试推送
  console.log('🧪 测试推送功能...')
  await pusher.trigger('system-notifications', 'test', {
    message: '这是一条测试消息',
    timestamp: new Date().toISOString()
  })
  
  console.log('✅ 推送测试成功')
  
} catch (error) {
  console.error('❌ Pusher 配置错误:', error.message)
  process.exit(1)
}

console.log('�� Pusher 配置检查完成！') 