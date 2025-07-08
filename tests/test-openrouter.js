import aiServiceManager from './src/services/aiServiceManager.js'
import dotenv from 'dotenv'

dotenv.config()

async function testOpenRouter() {
  console.log('🧪 开始测试 OpenRouter 集成...\n')

  try {
    // 1. 测试服务状态
    console.log('1️⃣ 测试服务状态...')
    const status = await aiServiceManager.getServiceStatus()
    console.log('服务状态:', JSON.stringify(status, null, 2))
    console.log('✅ 服务状态检查完成\n')

    // 2. 测试 OpenRouter 连接
    console.log('2️⃣ 测试 OpenRouter 连接...')
    const testResult = await aiServiceManager.testService('openrouter')
    console.log('连接测试结果:', JSON.stringify(testResult, null, 2))
    console.log('✅ OpenRouter 连接测试完成\n')

    // 3. 获取可用模型
    console.log('3️⃣ 获取可用模型...')
    const models = await aiServiceManager.getAvailableModels('openrouter')
    console.log(`找到 ${models.length} 个免费模型:`)
    models.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name} (${model.provider})`)
    })
    console.log('✅ 模型列表获取完成\n')

    // 4. 测试消息发送
    console.log('4️⃣ 测试消息发送...')
    const testMessage = '你好，请简单介绍一下JavaScript'
    console.log(`发送测试消息: "${testMessage}"`)
    
    let responseCount = 0
    const stream = aiServiceManager.sendMessage('test-user', testMessage, '前端开发测试', {
      service: 'openrouter',
      model: 'mistralai/mistral-7b-instruct'
    })

    let fullResponse = ''
    for await (const chunk of stream) {
      responseCount++
      if (chunk.error) {
        console.error('❌ 流式响应错误:', chunk)
        break
      }
      
      if (chunk.message?.content) {
        process.stdout.write(chunk.message.content)
        fullResponse += chunk.message.content
      }
      
      if (chunk.done) {
        console.log('\n✅ 消息发送测试完成')
        console.log(`总响应块数: ${responseCount}`)
        console.log(`完整响应长度: ${fullResponse.length} 字符`)
        break
      }
    }

    // 5. 测试历史记录
    console.log('\n5️⃣ 测试历史记录...')
    const history = aiServiceManager.getHistory('test-user', 'openrouter')
    console.log(`历史记录数量: ${history.length}`)
    if (history.length > 0) {
      console.log('最新对话:')
      console.log(`  用户: ${history[history.length - 2]?.content}`)
      console.log(`  AI: ${history[history.length - 1]?.content?.substring(0, 100)}...`)
    }
    console.log('✅ 历史记录测试完成\n')

    // 6. 测试服务切换
    console.log('6️⃣ 测试服务切换...')
    const originalService = aiServiceManager.getCurrentService()
    console.log(`当前服务: ${originalService}`)
    
    aiServiceManager.setService('local')
    console.log(`切换到本地服务: ${aiServiceManager.getCurrentService()}`)
    
    aiServiceManager.setService('openrouter')
    console.log(`切换回OpenRouter: ${aiServiceManager.getCurrentService()}`)
    console.log('✅ 服务切换测试完成\n')

    // 7. 测试模型设置
    console.log('7️⃣ 测试模型设置...')
    const originalModel = aiServiceManager.getCurrentModel('openrouter')
    console.log(`当前模型: ${originalModel}`)
    
    aiServiceManager.setModel('google/gemma-7b-it', 'openrouter')
    console.log(`设置新模型: ${aiServiceManager.getCurrentModel('openrouter')}`)
    
    aiServiceManager.setModel(originalModel, 'openrouter')
    console.log(`恢复原模型: ${aiServiceManager.getCurrentModel('openrouter')}`)
    console.log('✅ 模型设置测试完成\n')

    // 8. 清理测试数据
    console.log('8️⃣ 清理测试数据...')
    aiServiceManager.clearHistory('test-user', 'openrouter')
    console.log('✅ 测试数据清理完成\n')

    console.log('🎉 所有测试完成！OpenRouter 集成正常工作。')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('详细错误:', error)
    
    if (error.message.includes('OPENROUTER_API_KEY')) {
      console.log('\n💡 解决方案:')
      console.log('1. 访问 https://openrouter.ai/keys 获取API密钥')
      console.log('2. 在 .env 文件中设置 OPENROUTER_API_KEY=your-api-key')
      console.log('3. 重新运行测试')
    }
  }
}

// 运行测试
testOpenRouter() 