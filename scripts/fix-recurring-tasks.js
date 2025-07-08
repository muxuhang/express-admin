import mongoose from 'mongoose'
import dotenv from 'dotenv'
import PushTask from '../src/models/pushTask.js'

// 加载环境变量
dotenv.config()

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/admin?authSource=admin')
    console.log('✅ 数据库连接成功')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    process.exit(1)
  }
}

// 修复循环任务的执行次数
const fixRecurringTasks = async () => {
  try {
    console.log('🔧 开始修复循环任务...')
    
    // 查找所有循环任务
    const recurringTasks = await PushTask.find({
      pushMode: 'recurring',
      status: 'active'
    })
    
    console.log(`📊 找到 ${recurringTasks.length} 个活跃的循环任务`)
    
    let fixedCount = 0
    
    for (const task of recurringTasks) {
      try {
        // 检查是否需要修复
        const needsFix = !task.recurringConfig.executedCount || 
                        task.recurringConfig.executedCount < 1
        
        if (needsFix) {
          // 根据执行历史计算实际执行次数
          const actualExecutedCount = task.executionHistory.length
          
          // 更新执行次数
          await PushTask.findByIdAndUpdate(task._id, {
            'recurringConfig.executedCount': Math.max(actualExecutedCount, 1),
            updatedAt: new Date()
          })
          
          console.log(`✅ 修复任务 ${task._id}: 执行次数从 ${task.recurringConfig.executedCount || 0} 更新为 ${Math.max(actualExecutedCount, 1)}`)
          fixedCount++
        } else {
          console.log(`ℹ️  任务 ${task._id} 执行次数正常: ${task.recurringConfig.executedCount}`)
        }
        
        // 检查是否已完成但状态未更新
        if (task.recurringConfig.maxExecutions && 
            task.recurringConfig.executedCount >= task.recurringConfig.maxExecutions &&
            task.status === 'active') {
          
          await PushTask.findByIdAndUpdate(task._id, {
            status: 'inactive',
            pushStatus: 'completed',
            updatedAt: new Date()
          })
          
          console.log(`✅ 标记任务 ${task._id} 为已完成状态`)
          fixedCount++
        }
        
      } catch (error) {
        console.error(`❌ 修复任务 ${task._id} 失败:`, error.message)
      }
    }
    
    console.log(`🎉 修复完成！共修复 ${fixedCount} 个任务`)
    
  } catch (error) {
    console.error('❌ 修复循环任务失败:', error)
  }
}

// 主函数
const main = async () => {
  try {
    await connectDB()
    await fixRecurringTasks()
    
    console.log('✅ 所有修复操作完成')
    process.exit(0)
  } catch (error) {
    console.error('❌ 修复过程失败:', error)
    process.exit(1)
  }
}

// 运行脚本
main() 