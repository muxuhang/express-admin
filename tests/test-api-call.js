import fetch from 'node-fetch'

async function testAPICall() {
  try {
    console.log('🧪 测试 API 调用...\n')

    const baseURL = 'http://localhost:8888'
    
    // 1. 测试服务状态
    console.log('1️⃣ 测试服务状态...')
    const statusResponse = await fetch(`${baseURL}/api/chat/service/status`)
    const statusData = await statusResponse.json()
    console.log('服务状态:', JSON.stringify(statusData, null, 2))
    console.log('✅ 服务状态检查完成\n')

    // 2. 测试获取模型列表
    console.log('2️⃣ 测试获取模型列表...')
    const modelsResponse = await fetch(`${baseURL}/api/chat/models?service=openrouter`)
    const modelsData = await modelsResponse.json()
    console.log('模型列表:', JSON.stringify(modelsData, null, 2))
    console.log('✅ 模型列表获取完成\n')

    // 3. 测试发送消息（使用完整模型ID）
    console.log('3️⃣ 测试发送消息（完整模型ID）...')
    const messageData = {
      message: '你好，请简单介绍一下JavaScript',
      context: '前端开发测试',
      service: 'openrouter',
      model: 'mistralai/mistral-7b-instruct'
    }
    
    console.log('发送数据:', JSON.stringify(messageData, null, 2))
    
    const messageResponse = await fetch(`${baseURL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    })

    if (!messageResponse.ok) {
      console.error('❌ API调用失败:', messageResponse.status, messageResponse.statusText)
      const errorText = await messageResponse.text()
      console.error('错误详情:', errorText)
    } else {
      console.log('✅ API调用成功')
      
      // 读取流式响应
      const reader = messageResponse.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.message?.content) {
                process.stdout.write(data.message.content)
              }
              if (data.error) {
                console.error('\n❌ 流式响应错误:', data.message)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      console.log('\n✅ 流式响应完成')
    }

    // 4. 测试发送消息（使用截断的模型ID）
    console.log('\n4️⃣ 测试发送消息（截断的模型ID）...')
    const messageData2 = {
      message: '你好',
      service: 'openrouter',
      model: 'mistral-7b-instruct'  // 故意使用截断的模型ID
    }
    
    console.log('发送数据:', JSON.stringify(messageData2, null, 2))
    
    const messageResponse2 = await fetch(`${baseURL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData2)
    })

    if (!messageResponse2.ok) {
      console.error('❌ API调用失败:', messageResponse2.status, messageResponse2.statusText)
      const errorText = await messageResponse2.text()
      console.error('错误详情:', errorText)
    } else {
      console.log('✅ API调用成功（这不应该发生）')
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

testAPICall() 