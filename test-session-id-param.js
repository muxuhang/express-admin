import fetch from 'node-fetch'

async function testSessionIdParam() {
  console.log('🧪 测试sessionId参数功能...\n')

  try {
    // 1. 创建空会话
    console.log('1️⃣ 创建空会话...')
    const createResponse = await fetch('http://localhost:8888/api/chat/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_sessionid',
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

      // 2. 发送消息时指定sessionId
      console.log('\n2️⃣ 发送消息（指定sessionId）...')
      const messageResponse = await fetch('http://localhost:8888/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '请介绍一下React框架的主要特性和优势',
          userId: 'test_user_sessionid',
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
        const sessionsResponse = await fetch(`http://localhost:8888/api/chat/sessions?userId=test_user_sessionid&page=1&limit=10`)
        const sessionsResult = await sessionsResponse.json()
        console.log('会话列表结果:', JSON.stringify(sessionsResult, null, 2))
        
        if (sessionsResult.code === 0 && sessionsResult.data.list.length > 0) {
          const session = sessionsResult.data.list[0]
          console.log(`✅ 会话标题: ${session.title}`)
          console.log(`   消息数量: ${session.messageCount}`)
          
          // 检查是否使用了指定的会话ID
          if (session.sessionId === sessionId) {
            console.log(`✅ 成功使用了指定的会话ID: ${sessionId}`)
          } else {
            console.log(`❌ 使用了不同的会话ID，指定: ${sessionId}, 实际: ${session.sessionId}`)
          }
        }
        
        // 4. 再次发送消息（不指定sessionId，应该使用最近活跃的会话）
        console.log('\n4️⃣ 发送第二条消息（不指定sessionId）...')
        const message2Response = await fetch('http://localhost:8888/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Vue.js和React有什么区别？',
            userId: 'test_user_sessionid',
            service: 'auto',
            model: 'mistralai/mistral-7b-instruct'
          })
        })

        if (message2Response.ok) {
          console.log('✅ 第二条消息发送成功，等待AI回复...')
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // 5. 再次检查会话列表
          console.log('\n5️⃣ 再次检查会话列表...')
          const sessions2Response = await fetch(`http://localhost:8888/api/chat/sessions?userId=test_user_sessionid&page=1&limit=10`)
          const sessions2Result = await sessions2Response.json()
          console.log('第二次会话列表结果:', JSON.stringify(sessions2Result, null, 2))
          
          if (sessions2Result.code === 0 && sessions2Result.data.list.length > 0) {
            const session2 = sessions2Result.data.list[0]
            console.log(`✅ 会话标题: ${session2.title}`)
            console.log(`   消息数量: ${session2.messageCount}`)
            
            // 检查是否仍然使用同一个会话
            if (session2.sessionId === sessionId) {
              console.log(`✅ 继续使用同一个会话: ${sessionId}`)
            } else {
              console.log(`❌ 使用了不同的会话，原会话: ${sessionId}, 新会话: ${session2.sessionId}`)
            }
          }
          
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
testSessionIdParam() 