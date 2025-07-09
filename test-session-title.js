import fetch from 'node-fetch'

async function testSessionTitle() {
  console.log('🧪 测试会话标题功能...\n')

  try {
    // 1. 创建空会话
    console.log('1️⃣ 创建空会话...')
    const createResponse = await fetch('http://localhost:8888/api/chat/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_title',
        title: '新会话',
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

      // 2. 发送消息（这应该会更新会话标题）
      console.log('\n2️⃣ 发送消息...')
      const messageResponse = await fetch('http://localhost:8888/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '请介绍一下React框架的主要特性和优势',
          userId: 'test_user_title',
          service: 'auto',
          model: 'mistralai/mistral-7b-instruct'
        })
      })

      if (messageResponse.ok) {
        console.log('✅ 消息发送成功，等待AI回复...')
        
        // 等待一下让数据保存完成
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // 3. 检查会话列表，看标题是否已更新
        console.log('\n3️⃣ 检查会话列表...')
        const sessionsResponse = await fetch(`http://localhost:8888/api/chat/sessions?userId=test_user_title&page=1&limit=10`)
        const sessionsResult = await sessionsResponse.json()
        console.log('会话列表结果:', JSON.stringify(sessionsResult, null, 2))
        
        if (sessionsResult.code === 0 && sessionsResult.data.list.length > 0) {
          const session = sessionsResult.data.list[0]
          console.log(`✅ 会话标题已更新: ${session.title}`)
          console.log(`   消息数量: ${session.messageCount}`)
        }
        
        // 4. 获取会话详情
        console.log('\n4️⃣ 获取会话详情...')
        const detailsResponse = await fetch(`http://localhost:8888/api/chat/session/${sessionId}?userId=test_user_title`)
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
testSessionTitle() 