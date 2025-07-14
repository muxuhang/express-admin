import fetch from 'node-fetch'

async function testChatRequest() {
  console.log('🧪 测试聊天请求的用户ID传递...\n')

  const userId = 'user_1752029906792_7525'
  const message = '你好，请简单介绍一下JavaScript'

  console.log(`使用用户ID: ${userId}`)
  console.log(`发送消息: ${message}\n`)

  try {
    // 1. 发送聊天请求
    console.log('1️⃣ 发送聊天请求...')
    const response = await fetch('http://localhost:8888/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify({
        message: message,
        userId: userId,
        context: '测试用户ID传递',
        service: 'openrouter',
        model: 'mistralai/mistral-7b-instruct'
      })
    })

    if (!response.ok) {
      console.error(`❌ 请求失败: ${response.status} ${response.statusText}`)
      return
    }

    console.log('✅ 聊天请求发送成功，开始接收流式响应...')

    // 2. 处理流式响应
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    let chunkCount = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.message && data.message.content) {
              fullResponse += data.message.content
              chunkCount++
            }
            if (data.done) {
              console.log(`✅ 流式响应完成，共接收 ${chunkCount} 个数据块`)
              break
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    console.log(`完整响应长度: ${fullResponse.length} 字符`)

    // 3. 等待一下，让数据保存完成
    console.log('\n2️⃣ 等待数据保存...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 4. 检查会话列表
    console.log('\n3️⃣ 检查会话列表...')
    const sessionsResponse = await fetch(`http://localhost:8888/api/chat/sessions?page=1&limit=50&userId=${userId}`)
    const sessionsResult = await sessionsResponse.json()
    console.log('会话列表结果:', JSON.stringify(sessionsResult, null, 2))

    // 5. 检查历史记录
    console.log('\n4️⃣ 检查历史记录...')
    const historyResponse = await fetch(`http://localhost:8888/api/chat/history?userId=${userId}&page=1&limit=10`)
    const historyResult = await historyResponse.json()
    console.log('历史记录结果:', JSON.stringify(historyResult, null, 2))

    console.log('\n✅ 测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testChatRequest() 