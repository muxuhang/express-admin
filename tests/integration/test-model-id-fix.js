import fetch from 'node-fetch'

async function testModelIdFix() {
  console.log('🧪 测试模型ID修复...\n')

  const baseURL = 'http://localhost:8888'
  
  // 测试用例
  const testCases = [
    {
      name: '完整模型ID',
      model: 'mistralai/mistral-7b-instruct',
      expectedSuccess: true
    },
    {
      name: '截断模型ID',
      model: 'mistral-7b-instruct',
      expectedSuccess: true  // 应该自动转换为完整ID
    },
    {
      name: '无效模型ID',
      model: 'invalid-model',
      expectedSuccess: false
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n🔍 测试: ${testCase.name}`)
    console.log(`模型ID: ${testCase.model}`)
    
    try {
      const response = await fetch(`${baseURL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '你好，请简单介绍一下JavaScript',
          service: 'openrouter',
          model: testCase.model
        })
      })

      if (testCase.expectedSuccess) {
        if (response.ok) {
          console.log('✅ 请求成功')
          
          // 读取流式响应
          let responseText = ''
          let errorOccurred = false
          
          // 使用 response.text() 而不是 getReader()
          const text = await response.text()
          const lines = text.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.error) {
                  console.error('❌ 流式响应错误:', data.message)
                  errorOccurred = true
                } else if (data.message?.content) {
                  responseText += data.message.content
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
          
          if (!errorOccurred) {
            console.log('✅ 流式响应正常')
            console.log(`响应长度: ${responseText.length} 字符`)
          } else {
            console.log('❌ 流式响应出现错误')
          }
        } else {
          console.log('❌ 请求失败:', response.status, response.statusText)
        }
      } else {
        if (!response.ok) {
          console.log('✅ 按预期失败:', response.status, response.statusText)
        } else {
          console.log('❌ 意外成功，应该失败')
        }
      }
    } catch (error) {
      if (testCase.expectedSuccess) {
        console.error('❌ 请求异常:', error.message)
      } else {
        console.log('✅ 按预期出现异常:', error.message)
      }
    }
  }

  console.log('\n🎉 模型ID修复测试完成！')
}

testModelIdFix() 