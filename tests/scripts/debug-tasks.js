import dotenv from 'dotenv'
import './src/mongodb.js'
import PushTask from './src/models/pushTask.js'
import pusherService from './src/services/pusher.js'
import { formatDateTime } from './src/utils/dateFormatter.js'

// 加载环境变量
dotenv.config()

console.log('🔍 调试推送任务状态...')

// 等待数据库连接
await new Promise(resolve => setTimeout(resolve, 2000))

try {
  // 获取所有推送任务
  const allTasks = await PushTask.find({}).populate('createdBy', 'username email')
  console.log(`📊 总共有 ${allTasks.length} 个推送任务`)
  
  if (allTasks.length === 0) {
    console.log('❌ 数据库中没有推送任务')
  } else {
    // 按推送状态分组
    const tasksByStatus = {}
    allTasks.forEach(task => {
      const status = task.pushStatus
      if (!tasksByStatus[status]) {
        tasksByStatus[status] = []
      }
      tasksByStatus[status].push(task)
    })
    
    console.log('\n📋 按推送状态分组的任务:')
    Object.keys(tasksByStatus).forEach(status => {
      console.log(`\n${status.toUpperCase()} 状态 (${tasksByStatus[status].length} 个):`)
      tasksByStatus[status].forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.title} (${task.pushMode}) - 创建者: ${task.createdByUsername}`)
        if (task.pushMode === 'scheduled' && task.scheduledTime) {
          console.log(`      定时时间: ${formatDateTime(task.scheduledTime)}`)
          console.log(`      是否已过期: ${task.scheduledTime <= new Date() ? '是' : '否'}`)
        }
        if (task.pushMode === 'recurring' && task.recurringConfig) {
          console.log(`      下次执行时间: ${task.recurringConfig.nextExecutionTime ? formatDateTime(task.recurringConfig.nextExecutionTime) : '未设置'}`)
          console.log(`      是否已过期: ${task.recurringConfig.nextExecutionTime && task.recurringConfig.nextExecutionTime <= new Date() ? '是' : '否'}`)
        }
      })
    })
    
    // 检查发送中状态的任务
    const sendingTasks = tasksByStatus['sending'] || []
    if (sendingTasks.length > 0) {
      console.log('\n⚠️  发现卡在发送中状态的任务:')
      sendingTasks.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.title} (${task.pushMode})`)
        console.log(`      任务ID: ${task._id}`)
        console.log(`      创建时间: ${formatDateTime(task.createdAt)}`)
        console.log(`      最后更新: ${formatDateTime(task.updatedAt)}`)
        
        // 检查执行历史
        if (task.executionHistory && task.executionHistory.length > 0) {
          const lastExecution = task.executionHistory[task.executionHistory.length - 1]
          console.log(`      最后执行: ${formatDateTime(lastExecution.executionTime)}`)
          console.log(`      执行状态: ${lastExecution.status}`)
          if (lastExecution.errorMessage) {
            console.log(`      错误信息: ${lastExecution.errorMessage}`)
          }
        }
      })
      
      // 尝试手动执行这些任务
      console.log('\n🔄 尝试手动执行卡住的任务...')
      for (const task of sendingTasks) {
        try {
          console.log(`\n处理任务: ${task.title}`)
          
          // 先重置状态为草稿
          await PushTask.findByIdAndUpdate(task._id, {
            pushStatus: 'draft'
          })
          console.log('  状态已重置为草稿')
          
          // 手动执行任务
          if (task.pushMode === 'scheduled') {
            await pusherService.executeScheduledTasks()
          } else if (task.pushMode === 'recurring') {
            await pusherService.executeRecurringTasks()
          }
          
          console.log('  任务执行完成')
          
        } catch (error) {
          console.error(`  执行失败: ${error.message}`)
          
          // 标记为失败
          await PushTask.findByIdAndUpdate(task._id, {
            pushStatus: 'failed'
          })
          console.log('  状态已标记为失败')
        }
      }
    }
    
    // 检查活跃的定时任务
    const activeScheduledTasks = await PushTask.getActiveScheduledTasks()
    console.log(`\n⏰ 活跃的定时任务: ${activeScheduledTasks.length} 个`)
    
    // 检查活跃的循环任务
    const activeRecurringTasks = await PushTask.getActiveRecurringTasks()
    console.log(`🔄 活跃的循环任务: ${activeRecurringTasks.length} 个`)
  }
  
} catch (error) {
  console.error('❌ 调试失败:', error.message)
}

console.log('\n✅ 调试完成') 