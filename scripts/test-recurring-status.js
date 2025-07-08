import mongoose from 'mongoose'
import PushTask from '../src/models/pushTask.js'
import pusherService from '../src/services/pusher.js'

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/admin?authSource=admin')

// 等待数据库连接
await new Promise(resolve => setTimeout(resolve, 2000))

// 测试循环推送状态变化
const testRecurringStatus = async () => {
  try {
    console.log('🧪 开始测试循环推送状态变化...')
    
    // 查找所有循环任务
    const recurringTasks = await PushTask.find({
      pushMode: 'recurring'
    }).sort({ createdAt: -1 }).limit(5)
    
    console.log(`📊 找到 ${recurringTasks.length} 个循环任务`)
    
    for (const task of recurringTasks) {
      console.log('\n' + '='.repeat(50))
      console.log(`任务ID: ${task._id}`)
      console.log(`标题: ${task.title}`)
      console.log(`状态: ${task.status}`)
      console.log(`推送状态: ${task.pushStatus}`)
      console.log(`执行次数: ${task.recurringConfig?.executedCount || 0}`)
      console.log(`最大执行次数: ${task.recurringConfig?.maxExecutions || '无限制'}`)
      console.log(`下次执行时间: ${task.recurringConfig?.nextExecutionTime || '无'}`)
      console.log(`执行历史数量: ${task.executionHistory?.length || 0}`)
      
      // 显示最近的执行记录
      if (task.executionHistory && task.executionHistory.length > 0) {
        const latestRecord = task.executionHistory[task.executionHistory.length - 1]
        console.log(`最近执行: ${latestRecord.executionTime}`)
        console.log(`执行结果: ${latestRecord.status}`)
        console.log(`发送数量: ${latestRecord.sentCount}`)
      }
      
      // 检查状态一致性
      const issues = []
      
      // 检查执行次数与历史记录是否一致
      if (task.recurringConfig?.executedCount !== task.executionHistory?.length) {
        issues.push(`执行次数不一致: 配置中为 ${task.recurringConfig?.executedCount || 0}，历史记录为 ${task.executionHistory?.length || 0}`)
      }
      
      // 检查循环任务的状态逻辑
      if (task.pushMode === 'recurring') {
        const isCompleted = task.recurringConfig?.maxExecutions && 
                           task.recurringConfig?.executedCount >= task.recurringConfig?.maxExecutions
        
        if (isCompleted) {
          // 已完成的任务应该是 completed 状态
          if (task.pushStatus !== 'completed' && task.pushStatus !== 'sent' && task.pushStatus !== 'failed') {
            issues.push(`已完成任务状态错误: 应该是 completed/sent/failed，实际是 ${task.pushStatus}`)
          }
        } else {
          // 未完成的任务应该是 sending 状态
          if (task.pushStatus !== 'sending') {
            issues.push(`未完成任务状态错误: 应该是 sending，实际是 ${task.pushStatus}`)
          }
        }
      }
      
      // 显示问题
      if (issues.length > 0) {
        console.log('\n⚠️  发现状态问题:')
        issues.forEach(issue => console.log(`  - ${issue}`))
      } else {
        console.log('\n✅ 状态检查通过')
      }
    }
    
    // 测试手动执行循环任务
    console.log('\n🔄 测试手动执行循环任务...')
    try {
      await pusherService.executeRecurringTasks()
      console.log('✅ 循环任务执行完成')
    } catch (error) {
      console.error('❌ 执行循环任务失败:', error.message)
    }
    
    // 再次检查状态
    console.log('\n📋 执行后的状态检查:')
    const updatedTasks = await PushTask.find({
      pushMode: 'recurring'
    }).sort({ createdAt: -1 }).limit(3)
    
    for (const task of updatedTasks) {
      console.log(`\n任务: ${task.title}`)
      console.log(`  状态: ${task.status}`)
      console.log(`  推送状态: ${task.pushStatus}`)
      console.log(`  执行次数: ${task.recurringConfig?.executedCount || 0}`)
      console.log(`  下次执行: ${task.recurringConfig?.nextExecutionTime || '无'}`)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 数据库连接已关闭')
  }
}

// 运行测试
testRecurringStatus() 