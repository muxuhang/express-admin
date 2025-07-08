import dotenv from 'dotenv'
import mongoose from 'mongoose'
import './src/mongodb.js'  // 导入数据库连接和模型注册
import PushTask from './src/models/pushTask.js'

// 加载环境变量
dotenv.config()

console.log('🔍 检查数据库中的推送任务...')

// 等待数据库连接
await new Promise(resolve => setTimeout(resolve, 1000))

// 获取所有推送任务
try {
  const allTasks = await PushTask.find({}).populate('createdBy', 'username email')
  console.log(`📊 总共有 ${allTasks.length} 个推送任务`)
  
  if (allTasks.length === 0) {
    console.log('❌ 数据库中没有推送任务')
    console.log('请先创建一些定时或循环推送任务')
  } else {
    console.log('\n📋 任务列表:')
    allTasks.forEach((task, index) => {
      console.log(`\n${index + 1}. 任务ID: ${task._id}`)
      console.log(`   标题: ${task.title}`)
      console.log(`   推送方式: ${task.pushMode}`)
      console.log(`   状态: ${task.status}`)
      console.log(`   推送状态: ${task.pushStatus}`)
      
      if (task.pushMode === 'scheduled' && task.scheduledTime) {
        console.log(`   定时时间: ${task.scheduledTime.toLocaleString()}`)
        console.log(`   是否已过期: ${task.scheduledTime <= new Date() ? '是' : '否'}`)
      }
      
      if (task.pushMode === 'recurring' && task.recurringConfig) {
        console.log(`   下次执行时间: ${task.recurringConfig.nextExecutionTime?.toLocaleString() || '未设置'}`)
        console.log(`   是否已过期: ${task.recurringConfig.nextExecutionTime && task.recurringConfig.nextExecutionTime <= new Date() ? '是' : '否'}`)
      }
      
      console.log(`   创建者: ${task.createdByUsername}`)
      console.log(`   创建时间: ${task.createdAt.toLocaleString()}`)
    })
  }
  
  // 检查活跃的定时任务
  const activeScheduledTasks = await PushTask.getActiveScheduledTasks()
  console.log(`\n⏰ 活跃的定时任务: ${activeScheduledTasks.length} 个`)
  
  // 检查活跃的循环任务
  const activeRecurringTasks = await PushTask.getActiveRecurringTasks()
  console.log(`🔄 活跃的循环任务: ${activeRecurringTasks.length} 个`)
  
} catch (error) {
  console.error('❌ 查询任务失败:', error.message)
}

console.log('\n✅ 检查完成') 