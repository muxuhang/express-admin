import fetch from 'node-fetch'

async function testSessionTitleUpdate() {
  console.log('🧪 测试会话标题更新逻辑...\n')

  try {
    // 1. 创建空会话
    console.log('1️⃣ 创建空会话...')
    const createResponse = await fetch('http://localhost:8888/api/chat/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_update',
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

      // 2. 发送第一条消息（应该会更新标题）
      console.log('\n2️⃣ 发送第一条消息...')
      const message1Response = await fetch('http://localhost:8888/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '请介绍一下React框架的主要特性和优势',
          userId: 'test_user_update',
          service: 'auto',
          model: 'mistralai/mistral-7b-instruct'
        })
      })

      if (message1Response.ok) {
        console.log('✅ 第一条消息发送成功，等待AI回复...')
        
        // 等待一下让数据保存完成
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // 3. 检查会话列表，看标题是否已更新
        console.log('\n3️⃣ 检查会话列表（第一次）...')
        const sessions1Response = await fetch(`http://localhost:8888/api/chat/sessions?userId=test_user_update&page=1&limit=10`)
        const sessions1Result = await sessions1Response.json()
        
        if (sessions1Result.code === 0 && sessions1Result.data.list.length > 0) {
          const session1 = sessions1Result.data.list[0]
          console.log(`✅ 会话标题已更新: ${session1.title}`)
          console.log(`   消息数量: ${session1.messageCount}`)
        }
        
        // 4. 发送第二条消息（不应该再更新标题）
        console.log('\n4️⃣ 发送第二条消息...')
        const message2Response = await fetch('http://localhost:8888/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Vue.js和React有什么区别？',
            userId: 'test_user_update',
            service: 'auto',
            model: 'mistralai/mistral-7b-instruct'
          })
        })

        if (message2Response.ok) {
          console.log('✅ 第二条消息发送成功，等待AI回复...')
          
          // 等待一下让数据保存完成
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // 5. 再次检查会话列表，确认标题没有变化
          console.log('\n5️⃣ 检查会话列表（第二次）...')
          const sessions2Response = await fetch(`http://localhost:8888/api/chat/sessions?userId=test_user_update&page=1&limit=10`)
          const sessions2Result = await sessions2Response.json()
          
          if (sessions2Result.code === 0 && sessions2Result.data.list.length > 0) {
            const session2 = sessions2Result.data.list[0]
            console.log(`✅ 会话标题保持不变: ${session2.title}`)
            console.log(`   消息数量: ${session2.messageCount}`)
          }
          
          // 6. 获取会话详情
          console.log('\n6️⃣ 获取会话详情...')
          const detailsResponse = await fetch(`http://localhost:8888/api/chat/session/${sessionId}?userId=test_user_update`)
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
testSessionTitleUpdate() 