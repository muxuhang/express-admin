import openRouterService from './src/services/openRouterService.js'
import dotenv from 'dotenv'

dotenv.config()

async function testDirectOpenRouter() {
  try {
    console.log('🧪 直接测试 OpenRouter 服务...\n')

    // 1. 初始化服务
    console.log('1️⃣ 初始化 OpenRouter 服务...')
    await openRouterService.initialize()
    console.log('✅ 初始化完成\n')

    // 2. 测试默认模型
    console.log('2️⃣ 测试默认模型...')
    const defaultModel = openRouterService.getCurrentModel()
    console.log(`默认模型: ${defaultModel}`)

    const testMessage = '你好，请简单介绍一下JavaScript'
    console.log(`发送测试消息: "${testMessage}"`)
    
    let responseCount = 0
    const stream = openRouterService.sendMessage('test-user', testMessage, '前端开发测试', defaultModel)

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

    // 3. 测试其他模型
    console.log('\n3️⃣ 测试其他模型...')
    const models = ['mistralai/mistral-small-3.2-24b-instruct:free', 'anthropic/claude-3-haiku']
    
    for (const model of models) {
      console.log(`\n测试模型: ${model}`)
      try {
        const testStream = openRouterService.sendMessage('test-user-2', '你好', '测试', model)
        let hasResponse = false
        
        for await (const chunk of testStream) {
          if (chunk.message?.content) {
            hasResponse = true
            break
          }
          if (chunk.error) {
            console.error(`❌ 模型 ${model} 错误:`, chunk.message)
            break
          }
        }
        
        if (hasResponse) {
          console.log(`✅ 模型 ${model} 工作正常`)
        }
      } catch (error) {
        console.error(`❌ 模型 ${model} 失败:`, error.message)
      }
    }

    console.log('\n🎉 直接测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('详细错误:', error)
  }
}

testDirectOpenRouter() 