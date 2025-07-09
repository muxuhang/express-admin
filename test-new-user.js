import dotenv from 'dotenv'
import mongoose from 'mongoose'
import chatHistoryService from './src/services/chatHistoryService.js'

// 加载环境变量
dotenv.config()

async function testNewUser() {
  console.log('🧪 测试新用户数据保存功能...\n')

  try {
    // 1. 连接数据库
    console.log('1️⃣ 连接数据库...')
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/express-admin'
    await mongoose.connect(mongoUri)
    console.log('✅ 数据库连接成功\n')

    // 2. 初始化聊天记录服务
    console.log('2️⃣ 初始化聊天记录服务...')
    await chatHistoryService.initialize()
    console.log('✅ 聊天记录服务初始化成功\n')

    // 3. 使用新的用户ID
    const userId = 'user_1752029906792_7525'
    const sessionId = chatHistoryService.generateSessionId(userId)
    console.log(`测试用户ID: ${userId}`)
    console.log(`测试会话ID: ${sessionId}\n`)

    // 4. 保存用户消息
    console.log('3️⃣ 保存用户消息...')
    const userMessage = await chatHistoryService.saveUserMessage(
      userId,
      sessionId,
      '请介绍一下React框架',
      '前端框架学习',
      'openrouter',
      'mistralai/mistral-7b-instruct',
      0
    )
    console.log('✅ 用户消息已保存:', userMessage._id)

    // 5. 保存AI回复
    console.log('\n4️⃣ 保存AI回复...')
    const assistantMessage = await chatHistoryService.saveAssistantMessage(
      userId,
      sessionId,
      'React是由Facebook开发的一个用于构建用户界面的JavaScript库。它采用组件化的思想，让开发者可以构建可复用的UI组件。',
      'openrouter',
      'mistralai/mistral-7b-instruct',
      {
        chunkCount: 8,
        responseTime: 3200,
        status: 'completed',
        messageIndex: 1
      }
    )
    console.log('✅ AI回复已保存:', assistantMessage._id)

    // 6. 获取用户历史记录
    console.log('\n5️⃣ 获取用户历史记录...')
    const history = await chatHistoryService.getUserHistory(userId, {
      page: 1,
      limit: 10
    })
    console.log(`✅ 获取到 ${history.total} 条历史记录`)
    console.log(`会话数量: ${Object.keys(history.sessions).length}`)

    // 7. 获取会话列表
    console.log('\n6️⃣ 获取会话列表...')
    const sessions = await chatHistoryService.getUserSessions(userId, {
      page: 1,
      limit: 10
    })
    console.log(`✅ 获取到 ${sessions.length} 个会话`)
    sessions.forEach((session, index) => {
      console.log(`  会话 ${index + 1}: ${session.sessionId} (${session.messageCount} 条消息)`)
    })

    // 8. 测试API接口
    console.log('\n7️⃣ 测试API接口...')
    const response = await fetch('http://localhost:8888/api/chat/sessions?page=1&limit=50&userId=' + userId)
    const result = await response.json()
    console.log('API返回结果:', JSON.stringify(result, null, 2))

    console.log('\n✅ 测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close()
    console.log('数据库连接已关闭')
  }
}

// 运行测试
testNewUser() 