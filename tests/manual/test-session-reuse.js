import fetch from 'node-fetch'

async function testSessionReuse() {
  console.log('🧪 测试会话重用逻辑...\n')

  try {
    // 1. 创建空会话
    console.log('1️⃣ 创建空会话...')
    const createResponse = await fetch('http://localhost:8888/api/chat/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_reuse',
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
      console.log(`   初始标题: ${createResult.data.title}`)

      // 2. 检查会话列表
      console.log('\n2️⃣ 检查会话列表...')
      const sessionsResponse = await fetch(`http://localhost:8888/api/chat/sessions?userId=test_user_reuse&page=1&limit=10`)
      const sessionsResult = await sessionsResponse.json()
      console.log('会话列表结果:', JSON.stringify(sessionsResult, null, 2))

      // 3. 发送消息（应该使用已创建的会话）
      console.log('\n3️⃣ 发送消息...')
      const messageResponse = await fetch('http://localhost:8888/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '请介绍一下React框架的主要特性和优势',
          userId: 'test_user_reuse',
          service: 'auto',
          model: 'mistralai/mistral-7b-instruct'
        })
      })

      if (messageResponse.ok) {
        console.log('✅ 消息发送成功，等待AI回复...')
        
        // 等待一下让数据保存完成
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // 4. 再次检查会话列表，确认使用的是同一个会话
        console.log('\n4️⃣ 检查会话列表（发送消息后）...')
        const sessionsAfterResponse = await fetch(`http://localhost:8888/api/chat/sessions?userId=test_user_reuse&page=1&limit=10`)
        const sessionsAfterResult = await sessionsAfterResponse.json()
        console.log('发送消息后的会话列表:', JSON.stringify(sessionsAfterResult, null, 2))
        
        if (sessionsAfterResult.code === 0 && sessionsAfterResult.data.list.length > 0) {
          const session = sessionsAfterResult.data.list[0]
          console.log(`✅ 会话标题已更新: ${session.title}`)
          console.log(`   消息数量: ${session.messageCount}`)
          
          // 检查是否使用了同一个会话ID
          if (session.sessionId === sessionId) {
            console.log(`✅ 使用了同一个会话: ${sessionId}`)
          } else {
            console.log(`❌ 创建了新会话，原会话: ${sessionId}, 新会话: ${session.sessionId}`)
          }
        }
        
        // 5. 获取会话详情
        console.log('\n5️⃣ 获取会话详情...')
        const detailsResponse = await fetch(`http://localhost:8888/api/chat/session/${sessionId}?userId=test_user_reuse`)
        const detailsResult = await detailsResponse.json()
        console.log('会话详情结果:', JSON.stringify(detailsResult, null, 2))
        
        console.log('\n✅ 测试完成！')
      } else {
        console.error('❌ 消息发送失败')
      }
    } else {
      console.error('❌ 创建会话失败:', createResult.message)
    }

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testSessionReuse() 