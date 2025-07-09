import fetch from 'node-fetch'

async function testSessionContinuation() {
  console.log('🧪 测试会话连续性...\n')

  try {
    // 1. 创建空会话
    console.log('1️⃣ 创建空会话...')
    const createResponse = await fetch('http://localhost:8888/api/chat/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_continue',
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

      // 2. 发送第一条消息
      console.log('\n2️⃣ 发送第一条消息...')
      const message1Response = await fetch('http://localhost:8888/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '请介绍一下React框架的主要特性和优势',
          userId: 'test_user_continue',
          service: 'auto',
          model: 'mistralai/mistral-7b-instruct'
        })
      })

      if (message1Response.ok) {
        console.log('✅ 第一条消息发送成功，等待AI回复...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // 3. 发送第二条消息（应该使用同一个会话）
        console.log('\n3️⃣ 发送第二条消息...')
        const message2Response = await fetch('http://localhost:8888/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Vue.js和React有什么区别？',
            userId: 'test_user_continue',
            service: 'auto',
            model: 'mistralai/mistral-7b-instruct'
          })
        })

        if (message2Response.ok) {
          console.log('✅ 第二条消息发送成功，等待AI回复...')
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // 4. 检查会话列表
          console.log('\n4️⃣ 检查会话列表...')
          const sessionsResponse = await fetch(`http://localhost:8888/api/chat/sessions?userId=test_user_continue&page=1&limit=10`)
          const sessionsResult = await sessionsResponse.json()
          console.log('会话列表结果:', JSON.stringify(sessionsResult, null, 2))
          
          if (sessionsResult.code === 0 && sessionsResult.data.list.length > 0) {
            const session = sessionsResult.data.list[0]
            console.log(`✅ 会话标题: ${session.title}`)
            console.log(`   消息数量: ${session.messageCount}`)
            
            // 检查是否只有一个会话
            if (sessionsResult.data.list.length === 1) {
              console.log(`✅ 只有一个会话，会话连续性正常`)
            } else {
              console.log(`❌ 有多个会话，会话连续性异常`)
            }
          }
          
          // 5. 获取会话详情
          console.log('\n5️⃣ 获取会话详情...')
          const detailsResponse = await fetch(`http://localhost:8888/api/chat/session/${sessionId}?userId=test_user_continue`)
          const detailsResult = await detailsResponse.json()
          console.log('会话详情结果:', JSON.stringify(detailsResult, null, 2))
          
          console.log('\n✅ 测试完成！')
        } else {
          console.error('❌ 第二条消息发送失败')
        }
      } else {
        console.error('❌ 第一条消息发送失败')
      }
    } else {
      console.error('❌ 创建会话失败:', createResult.message)
    }

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testSessionContinuation() 