import fetch from 'node-fetch'

async function testCreateEmptySession() {
  console.log('🧪 测试创建空会话接口...\n')

  try {
    // 1. 测试创建空会话
    console.log('1️⃣ 创建空会话...')
    const createResponse = await fetch('http://localhost:8888/api/chat/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_123',
        title: '测试会话',
        service: 'auto',
        model: 'mistralai/mistral-7b-instruct',
        context: '这是一个测试会话'
      })
    })

    const createResult = await createResponse.json()
    console.log('创建会话结果:', JSON.stringify(createResult, null, 2))

    if (createResult.code === 0) {
      const sessionId = createResult.data.sessionId
      console.log(`✅ 会话创建成功，会话ID: ${sessionId}`)
      console.log(`   标题: ${createResult.data.title}`)
      console.log(`   消息数量: ${createResult.data.messageCount}`)
      console.log(`   服务: ${createResult.data.service}`)
      console.log(`   模型: ${createResult.data.model || '默认'}`)
      console.log(`   创建时间: ${createResult.data.createdAt}`)

      // 2. 验证会话是否在列表中
      console.log('\n2️⃣ 验证会话列表...')
      const sessionsResponse = await fetch(`http://localhost:8888/api/chat/sessions?userId=test_user_123&page=1&limit=10`)
      const sessionsResult = await sessionsResponse.json()
      console.log('会话列表结果:', JSON.stringify(sessionsResult, null, 2))

      // 3. 获取会话详情
      console.log('\n3️⃣ 获取会话详情...')
      const detailsResponse = await fetch(`http://localhost:8888/api/chat/session/${sessionId}?userId=test_user_123`)
      const detailsResult = await detailsResponse.json()
      console.log('会话详情结果:', JSON.stringify(detailsResult, null, 2))

      console.log('\n✅ 测试完成！')
    } else {
      console.error('❌ 创建会话失败:', createResult.message)
    }

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testCreateEmptySession() 