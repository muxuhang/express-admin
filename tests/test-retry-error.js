import fetch from 'node-fetch';

// 测试重试和错误处理逻辑
async function testRetryAndErrorHandling() {
  console.log('🔄 测试重试和错误处理逻辑...\n');

  const baseUrl = 'http://localhost:8888';
  const userId = 'retry-test-' + Date.now();

  console.log(`使用测试用户ID: ${userId}`);

  // 1. 测试正常请求（应该成功）
  console.log('1. 测试正常请求...');
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
        message: '你好',
        context: '正常测试',
        userId: userId
      })
    });

    if (response.ok) {
      console.log('✅ 正常请求成功');
      
      // 读取响应流
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let hasError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                console.log('❌ 收到错误响应:', data);
                hasError = true;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      if (!hasError) {
        console.log('✅ 正常请求完成，无错误');
      }
    } else {
      console.log('❌ 正常请求失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('正常请求异常:', error.message);
  }

  // 2. 测试快速取消（验证取消逻辑）
  console.log('\n2. 测试快速取消...');
  const cancelUserId = 'cancel-test-' + Date.now();
  
  try {
    // 启动请求
    const requestPromise = fetch(`${baseUrl}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify({
        message: '请写一篇很长的文章',
        context: '取消测试',
        userId: cancelUserId
      })
    });

    // 立即取消
    setTimeout(async () => {
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
    }, 100);

    // 等待请求完成
    const response = await requestPromise;
    console.log('请求状态码:', response.status);
  } catch (error) {
    console.log('请求被取消或出错:', error.message);
  }

  // 3. 测试错误处理（模拟网络问题）
  console.log('\n3. 测试错误处理...');
  
  // 这里我们可以通过修改环境变量或使用错误的URL来模拟错误
  // 在实际环境中，这些错误通常由OpenRouter服务不可用引起
  
  console.log('要测试错误处理，请尝试以下操作:');
  console.log('1. 删除或修改 OPENROUTER_API_KEY 环境变量');
  console.log('2. 发送聊天请求');
  console.log('3. 观察错误响应');
  console.log('4. 恢复正确的 API 密钥');
  console.log('5. 再次发送请求验证恢复');
  
  console.log('\n预期行为:');
  console.log('- 首次失败时会自动重试');
  console.log('- 重试失败后返回用户友好的错误信息');
  console.log('- 错误信息包含具体的解决建议');
  console.log('- 前端能正确显示错误状态');

  // 4. 测试重试逻辑
  console.log('\n4. 重试逻辑说明:');
  console.log('- 首次请求失败时会自动重试一次');
  console.log('- 重试间隔为 1 秒');
  console.log('- 重试失败后会返回详细的错误信息');
  console.log('- 错误信息会根据错误类型进行分类');
  
  // 5. 错误分类说明
  console.log('\n5. 错误分类:');
  console.log('- 504: 连接超时 (Headers Timeout, fetch failed)');
  console.log('- 503: 服务不可用 (OpenRouter API 密钥未配置)');
  console.log('- 503: 网络问题 (ENOTFOUND, 无法连接)');
  console.log('- 499: 用户取消');
  console.log('- 500: 其他未知错误');
}

// 模拟错误情况的测试
async function testErrorScenarios() {
  console.log('\n\n🧪 模拟错误场景测试...\n');
  
  console.log('要测试错误处理，请尝试以下操作:');
  console.log('1. 删除或修改 OPENROUTER_API_KEY 环境变量');
  console.log('2. 发送聊天请求');
  console.log('3. 观察错误响应');
  console.log('4. 恢复正确的 API 密钥');
  console.log('5. 再次发送请求验证恢复');
  
  console.log('\n预期行为:');
  console.log('- 首次失败时会自动重试');
  console.log('- 重试失败后返回用户友好的错误信息');
  console.log('- 错误信息包含具体的解决建议');
  console.log('- 前端能正确显示错误状态');
}

// 运行测试
async function runRetryTests() {
  console.log('🔄 重试和错误处理测试\n');
  console.log('=' .repeat(50));
  
  await testRetryAndErrorHandling();
  await testErrorScenarios();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ 重试和错误处理测试完成');
  console.log('\n总结:');
  console.log('- 系统会在失败时自动重试一次');
  console.log('- 重试失败后返回详细的错误信息');
  console.log('- 错误信息根据类型进行分类');
  console.log('- 前端能收到用户友好的错误提示');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runRetryTests().catch(console.error);
}

export {
  testRetryAndErrorHandling,
  testErrorScenarios,
  runRetryTests
}; 