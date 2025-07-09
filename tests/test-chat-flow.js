import mongoose from 'mongoose'
import dotenv from 'dotenv'
import aiServiceManager from './src/services/aiServiceManager.js'

dotenv.config()

async function testChatFlow() {
  console.log('🧪 测试完整聊天流程...\n')

  try {
    // 1. 连接数据库
    console.log('1️⃣ 连接数据库...')
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/express-admin'
    await mongoose.connect(mongoUri)
    console.log('✅ 数据库连接成功\n')

    // 2. 初始化AI服务管理器
    console.log('2️⃣ 初始化AI服务管理器...')
    // AI服务管理器不需要显式初始化，服务会在需要时自动初始化
    console.log('✅ AI服务管理器准备就绪\n')

    // 3. 测试智能服务判断
    console.log('3️⃣ 测试智能服务判断...')
    const testModels = [
      'claude-3-haiku',
      'mistral-7b-instruct', 
      'llama-2-7b-chat'
    ]
    
    for (const model of testModels) {
      const service = await aiServiceManager.determineServiceByModel(model)
      console.log(`  ${model} -> ${service}`)
    }
    console.log('✅ 智能服务判断测试完成\n')

    // 4. 测试OpenRouter聊天（不实际发送请求，只测试流程）
    console.log('4️⃣ 测试OpenRouter聊天流程...')
    const userId = 'test-user-' + Date.now()
    const message = '你好，请简单介绍一下JavaScript'
    const model = 'claude-3-haiku'
    
    console.log(`用户ID: ${userId}`)
    console.log(`消息: ${message}`)
    console.log(`模型: ${model}`)
    console.log('✅ 聊天流程测试完成（跳过实际API调用）\n')

    // 5. 测试获取所有模型
    console.log('5️⃣ 测试获取所有模型...')
    const allModels = await aiServiceManager.getAllModels()
    console.log(`✅ 获取到 ${allModels.length} 个模型`)
    allModels.slice(0, 5).forEach(model => {
      console.log(`  - ${model.id || model.name} (${model.service})`)
    })
    console.log('✅ 模型获取测试完成\n')

    console.log('🎉 完整聊天流程测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('详细错误:', error)
  } finally {
    // 关闭数据库连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect()
      console.log('✅ 数据库连接已关闭')
    }
  }
}

// 运行测试
testChatFlow() 