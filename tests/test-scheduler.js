import dotenv from 'dotenv'
import mongoose from 'mongoose'
import pusherService from './src/services/pusher.js'

// 加载环境变量
dotenv.config()

console.log('🚀 启动定时任务测试...')

// 连接数据库
try {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅ 数据库连接成功')
} catch (error) {
  console.error('❌ 数据库连接失败:', error.message)
  process.exit(1)
}

// 测试定时任务执行
console.log('🧪 测试定时任务执行...')
try {
  await pusherService.executeScheduledTasks()
  console.log('✅ 定时任务执行完成')
} catch (error) {
  console.error('❌ 定时任务执行失败:', error.message)
}

// 测试循环任务执行
console.log('🧪 测试循环任务执行...')
try {
  await pusherService.executeRecurringTasks()
  console.log('✅ 循环任务执行完成')
} catch (error) {
  console.error('❌ 循环任务执行失败:', error.message)
}

// 关闭数据库连接
await mongoose.connection.close()
console.log('✅ 数据库连接已关闭')

console.log('🎉 定时任务测试完成！') 