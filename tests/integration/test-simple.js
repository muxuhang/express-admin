import fetch from 'node-fetch';

// 简化的流式响应测试
async function testStreamingResponse() {
  console.log('🚀 测试流式响应修复...\n');

  const baseUrl = 'http://localhost:8888'; // 使用正确的端口
  const endpoint = '/api/chat/send';

  const testData = {
    message: '你好，请简单介绍一下自己',
    context: '测试流式响应'
  };

  console.log('📤 发送请求数据:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 请求失败: ${response.status} ${response.statusText}`);
      console.error('错误详情:', errorText);
      return;
    }

    console.log(`✅ 连接成功，状态码: ${response.status}`);
    console.log('📨 开始接收流式响应:\n');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let messageCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('\n✅ 流式响应完成');
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            messageCount++;
            
            if (data.error) {
              console.log(`❌ 错误: ${data.message}`);
            } else if (data.message && data.message.content) {
              // 显示 AI 回复内容
              process.stdout.write(data.message.content);
            } else {
              console.log(`📦 其他数据:`, JSON.stringify(data, null, 2));
            }
          } catch (parseError) {
            console.log('📄 解析失败，原始数据:', line.slice(6));
          }
        }
      }
    }

    console.log(`\n📊 总共接收到 ${messageCount} 条消息`);

  } catch (error) {
    console.error('❌ 请求异常:', error.message);
  }
}

// 测试历史记录
async function testHistory() {
  console.log('\n📚 测试历史记录...\n');

  const baseUrl = 'http://localhost:8888';
  const endpoint = '/api/chat/history';

  try {
    const response = await fetch(`${baseUrl}${endpoint}?page=1&limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 请求失败: ${response.status} ${response.statusText}`);
      console.error('错误详情:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ 获取历史记录成功:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ 请求异常:', error.message);
  }
}

// 运行测试
async function runSimpleTest() {
  console.log('🎯 简化测试 - 验证流式响应修复\n');
  console.log('=' .repeat(50));
  
  await testStreamingResponse();
  await testHistory();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ 测试完成');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runSimpleTest().catch(console.error);
}

export {
  testStreamingResponse,
  testHistory,
  runSimpleTest
}; 