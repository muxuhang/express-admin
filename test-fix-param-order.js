import fetch from 'node-fetch'

async function testFixParamOrder() {
  console.log('🧪 测试参数顺序修复...\n')

  try {
    // 1. 创建空会话
    console.log('1️⃣ 创建空会话...')
    const createResponse = await fetch('http://localhost:8888/api/chat/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_param_fix',
        title: '测试会话',
        service: 'auto',
        model: 'mistralai/mistral-7b-instruct'
      })
    })

    const createResult = await createResponse.json()
    console.log('创建会话结果:', JSON.stringify(createResult, null, 2))

    if (createResult.code === 0) {
      const sessionId = createResult.data.sessionId
      console.log(`✅ 会话创建成功，会话ID: ${sessionId}`)

      // 2. 发送消息
      console.log('\n2️⃣ 发送消息...')
      const messageResponse = await fetch('http://localhost:8888/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '你好，请简单介绍一下JavaScript',
          userId: 'test_user_param_fix',
          service: 'auto',
          model: 'mistralai/mistral-7b-instruct',
          sessionId: sessionId
        })
      })

      if (messageResponse.ok) {
        console.log('✅ 消息发送成功，等待AI回复...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // 3. 检查会话列表
        console.log('\n3️⃣ 检查会话列表...')
        const sessionsResponse = await fetch(`http://localhost:8888/api/chat/sessions?userId=test_user_param_fix&page=1&limit=10`)
        const sessionsResult = await sessionsResponse.json()
        console.log('会话列表结果:', JSON.stringify(sessionsResult, null, 2))
        
        if (sessionsResult.code === 0 && sessionsResult.data.list.length > 0) {
          const session = sessionsResult.data.list[0]
          console.log(`✅ 会话标题: ${session.title}`)
          console.log(`   消息数量: ${session.messageCount}`)
          console.log(`   会话ID: ${session.sessionId}`)
        }
        
        // 4. 获取会话详情
        console.log('\n4️⃣ 获取会话详情...')
        const detailsResponse = await fetch(`http://localhost:8888/api/chat/session/${sessionId}?userId=test_user_param_fix`)
        const detailsResult = await detailsResponse.json()
        console.log('会话详情结果:', JSON.stringify(detailsResult, null, 2))
        
        if (detailsResult.code === 0) {
          console.log(`✅ 会话详情获取成功，消息数量: ${detailsResult.data.messages.length}`)
          
          // 检查消息结构
          if (detailsResult.data.messages.length > 0) {
            const firstMessage = detailsResult.data.messages[0]
            console.log(`   第一条消息角色: ${firstMessage.role}`)
            console.log(`   第一条消息服务: ${firstMessage.service}`)
            console.log(`   第一条消息模型: ${firstMessage.model}`)
            console.log(`   第一条消息序号: ${firstMessage.messageIndex}`)
          }
        }
        
        console.log('\n✅ 测试完成！')
      } else {
        console.error('❌ 消息发送失败')
        const errorText = await messageResponse.text()
        console.error('错误详情:', errorText)
      }
    } else {
      console.error('❌ 创建会话失败:', createResult.message)
    }

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testFixParamOrder() 