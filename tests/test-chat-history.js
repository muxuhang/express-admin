import chatHistoryService from './src/services/chatHistoryService.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

async function testChatHistory() {
  console.log('🧪 测试聊天记录数据库存储功能...\n')

  try {
    // 0. 连接数据库
    console.log('0️⃣ 连接数据库...')
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/express-admin'
    await mongoose.connect(mongoUri)
    console.log('✅ 数据库连接成功\n')

    // 1. 初始化服务
    console.log('1️⃣ 初始化聊天记录服务...')
    await chatHistoryService.initialize()
    console.log('✅ 聊天记录服务初始化成功\n')

    // 2. 生成测试数据
    const userId = 'test-user-' + Date.now()
    const sessionId = chatHistoryService.generateSessionId(userId)
    console.log(`测试用户ID: ${userId}`)
    console.log(`测试会话ID: ${sessionId}\n`)

    // 3. 保存用户消息
    console.log('2️⃣ 保存用户消息...')
    const userMessage = await chatHistoryService.saveUserMessage(
      userId,
      sessionId,
      '你好，请介绍一下JavaScript',
      '前端开发学习',
      'openrouter',
      'mistralai/mistral-7b-instruct'
    )
    console.log('✅ 用户消息已保存:', userMessage._id)

    // 4. 保存AI回复
    console.log('\n3️⃣ 保存AI回复...')
    const assistantMessage = await chatHistoryService.saveAssistantMessage(
      userId,
      sessionId,
      'JavaScript是一种高级的、解释型的编程语言，主要用于网页开发。它具有动态类型、弱类型、基于原型的特性。',
      'openrouter',
      'mistralai/mistral-7b-instruct',
      {
        chunkCount: 5,
        responseTime: 2500,
        status: 'completed'
      }
    )
    console.log('✅ AI回复已保存:', assistantMessage._id)

    // 5. 保存更多对话
    console.log('\n4️⃣ 保存更多对话...')
    await chatHistoryService.saveUserMessage(
      userId,
      sessionId,
      'React是什么？',
      '前端开发学习',
      'openrouter',
      'mistralai/mistral-7b-instruct'
    )

    await chatHistoryService.saveAssistantMessage(
      userId,
      sessionId,
      'React是由Facebook开发的一个用于构建用户界面的JavaScript库。它采用组件化的思想，让开发者可以构建可复用的UI组件。',
      'openrouter',
      'mistralai/mistral-7b-instruct',
      {
        chunkCount: 8,
        responseTime: 3200,
        status: 'completed'
      }
    )

    // 6. 创建另一个会话
    console.log('\n5️⃣ 创建另一个会话...')
    const sessionId2 = chatHistoryService.generateSessionId(userId)
    
    await chatHistoryService.saveUserMessage(
      userId,
      sessionId2,
      'Vue.js有什么特点？',
      '前端框架学习',
      'local',
      'llama2:latest'
    )

    await chatHistoryService.saveAssistantMessage(
      userId,
      sessionId2,
      'Vue.js是一个渐进式的JavaScript框架，具有易学易用、轻量级、双向数据绑定等特点。',
      'local',
      'llama2:latest',
      {
        chunkCount: 3,
        responseTime: 1800,
        status: 'completed'
      }
    )

    console.log('✅ 第二个会话已创建')

    // 7. 获取用户历史记录
    console.log('\n6️⃣ 获取用户历史记录...')
    const history = await chatHistoryService.getUserHistory(userId, {
      page: 1,
      limit: 10
    })
    console.log(`✅ 获取到 ${history.total} 条历史记录`)
    console.log(`会话数量: ${Object.keys(history.sessions).length}`)

    // 8. 获取会话列表
    console.log('\n7️⃣ 获取会话列表...')
    const sessions = await chatHistoryService.getUserSessions(userId, {
      page: 1,
      limit: 10
    })
    console.log(`✅ 获取到 ${sessions.length} 个会话`)
    sessions.forEach((session, index) => {
      console.log(`  会话 ${index + 1}: ${session.sessionId} (${session.messageCount} 条消息)`)
    })

    // 9. 获取会话详情
    console.log('\n8️⃣ 获取会话详情...')
    const sessionDetails = await chatHistoryService.getSessionDetails(userId, sessionId)
    console.log(`✅ 会话详情: ${sessionDetails.length} 条消息`)
    sessionDetails.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`)
    })

    // 10. 获取用户统计信息
    console.log('\n9️⃣ 获取用户统计信息...')
    const stats = await chatHistoryService.getUserStats(userId)
    console.log('✅ 用户统计信息:')
    console.log(`  总消息数: ${stats.totalMessages}`)
    console.log(`  总会话数: ${stats.totalSessions}`)
    console.log(`  使用服务: ${stats.services.join(', ')}`)
    console.log(`  使用模型: ${stats.models.filter(Boolean).join(', ')}`)
    console.log(`  平均响应时间: ${Math.round(stats.avgResponseTime || 0)}ms`)

    // 11. 搜索聊天记录
    console.log('\n🔟 搜索聊天记录...')
    const searchResults = await chatHistoryService.searchMessages(userId, 'JavaScript')
    console.log(`✅ 搜索到 ${searchResults.length} 条包含"JavaScript"的消息`)

    // 12. 测试导出功能
    console.log('\n1️⃣1️⃣ 测试导出功能...')
    const exportData = await chatHistoryService.exportUserData(userId, 'json')
    console.log(`✅ 导出数据: ${exportData.totalMessages} 条消息`)

    // 13. 清理测试数据
    console.log('\n1️⃣2️⃣ 清理测试数据...')
    await chatHistoryService.clearUserHistory(userId)
    console.log('✅ 测试数据已清理')

    console.log('\n🎉 聊天记录数据库存储功能测试完成！')

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
testChatHistory() 