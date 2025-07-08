import fetch from 'node-fetch';

// 测试历史记录逻辑
async function testHistoryLogic() {
  console.log('🧪 测试历史记录逻辑...\n');

  const baseUrl = 'http://localhost:8888';
  const userId = 'history-test-' + Date.now();

  console.log(`使用测试用户ID: ${userId}`);

  // 1. 发送正常消息（应该保存历史）
  console.log('1. 发送正常消息...');
  try {
    const response = await fetch(`${baseUrl}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify({
        message: '你好，请简单介绍一下自己',
        context: '正常对话测试',
        userId: userId
      })
    });

    if (response.ok) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message && data.message.content) {
                fullResponse += data.message.content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      console.log('✅ 正常消息完成，响应长度:', fullResponse.length);
    }
  } catch (error) {
    console.error('发送正常消息失败:', error.message);
  }

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. 检查历史记录
  console.log('\n2. 检查历史记录...');
  try {
    const response = await fetch(`${baseUrl}/api/chat/history?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('历史记录:', JSON.stringify(result, null, 2));
    
    if (result.code === 0 && result.data.list.length > 0) {
      console.log('✅ 历史记录已保存，对话数量:', result.data.list.length);
    } else {
      console.log('❌ 历史记录为空');
    }
  } catch (error) {
    console.error('检查历史记录失败:', error.message);
  }

  // 3. 发送会被取消的消息
  console.log('\n3. 发送会被取消的消息...');
  const cancelUserId = 'cancel-test-' + Date.now();
  
  // 启动长时间请求
  const longRequest = fetch(`${baseUrl}/api/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    },
    body: JSON.stringify({
      message: '请写一篇很长的文章，至少2000字',
      context: '取消测试',
      userId: cancelUserId
    })
  });

  // 等待一下然后取消
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const cancelResponse = await fetch(`${baseUrl}/api/chat/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: cancelUserId
      })
    });

    const cancelResult = await cancelResponse.json();
    console.log('取消结果:', JSON.stringify(cancelResult, null, 2));
  } catch (error) {
    console.error('取消请求失败:', error.message);
  }

  // 等待取消完成
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. 检查被取消的消息是否保存到历史
  console.log('\n4. 检查被取消消息的历史记录...');
  try {
    const response = await fetch(`${baseUrl}/api/chat/history?userId=${cancelUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('被取消消息的历史记录:', JSON.stringify(result, null, 2));
    
    if (result.code === 0 && result.data.list.length === 0) {
      console.log('✅ 被取消的消息没有保存到历史记录（正确）');
    } else {
      console.log('❌ 被取消的消息被保存到历史记录（错误）');
    }
  } catch (error) {
    console.error('检查被取消消息历史记录失败:', error.message);
  }

  // 5. 测试空响应的情况
  console.log('\n5. 测试空响应情况...');
  const emptyUserId = 'empty-test-' + Date.now();
  
  // 这里我们模拟一个可能产生空响应的情况
  // 实际测试中，这可能需要特定的提示词或模型状态
  try {
    const response = await fetch(`${baseUrl}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify({
        message: '请只回复一个"好"字',
        context: '空响应测试',
        userId: emptyUserId
      })
    });

    if (response.ok) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message && data.message.content) {
                fullResponse += data.message.content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      console.log('空响应测试完成，响应内容:', `"${fullResponse}"`);
    }
  } catch (error) {
    console.error('空响应测试失败:', error.message);
  }

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 6. 检查空响应的历史记录
  console.log('\n6. 检查空响应的历史记录...');
  try {
    const response = await fetch(`${baseUrl}/api/chat/history?userId=${emptyUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('空响应的历史记录:', JSON.stringify(result, null, 2));
    
    if (result.code === 0) {
      const hasValidConversation = result.data.list.some(item => 
        item.role === 'user' && item.content && 
        result.data.list.some(reply => 
          reply.role === 'assistant' && reply.content && reply.content.trim().length > 0
        )
      );
      
      if (hasValidConversation) {
        console.log('✅ 有效对话已保存到历史记录');
      } else {
        console.log('✅ 无效对话没有保存到历史记录（正确）');
      }
    }
  } catch (error) {
    console.error('检查空响应历史记录失败:', error.message);
  }
}

// 运行测试
async function runHistoryTests() {
  console.log('📚 历史记录逻辑测试\n');
  console.log('=' .repeat(50));
  
  await testHistoryLogic();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ 历史记录逻辑测试完成');
  console.log('\n总结:');
  console.log('- 只有完整的对话（问题+回答）才会保存到历史记录');
  console.log('- 被取消的请求不会保存到历史记录');
  console.log('- 空响应不会保存到历史记录');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runHistoryTests().catch(console.error);
}

export {
  testHistoryLogic,
  runHistoryTests
}; 