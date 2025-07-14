import fetch from 'node-fetch';

// 测试取消发送功能
async function testCancelMessage() {
  console.log('🚀 测试取消发送功能...\n');

  const baseUrl = 'http://localhost:8888';
  const userId = 'test-user-' + Date.now();

  console.log(`使用测试用户ID: ${userId}`);

  // 1. 检查初始状态
  console.log('1. 检查初始状态...');
  try {
    const response = await fetch(`${baseUrl}/api/chat/active?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('初始状态:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('检查初始状态失败:', error.message);
  }

  // 2. 启动一个长时间运行的聊天请求
  console.log('\n2. 启动长时间运行的聊天请求...');
  const longRequest = fetch(`${baseUrl}/api/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    },
    body: JSON.stringify({
      message: '请写一篇关于人工智能的长篇文章，至少1000字',
      context: '测试取消功能',
      userId: userId
    })
  });

  // 等待一下让请求开始
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 3. 检查是否有活跃请求
  console.log('\n3. 检查是否有活跃请求...');
  try {
    const response = await fetch(`${baseUrl}/api/chat/active?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('活跃状态:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('检查活跃状态失败:', error.message);
  }

  // 4. 取消请求
  console.log('\n4. 取消请求...');
  try {
    const response = await fetch(`${baseUrl}/api/chat/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId
      })
    });

    const result = await response.json();
    console.log('取消结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('取消请求失败:', error.message);
  }

  // 5. 再次检查状态
  console.log('\n5. 再次检查状态...');
  try {
    const response = await fetch(`${baseUrl}/api/chat/active?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('最终状态:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('检查最终状态失败:', error.message);
  }

  // 6. 尝试取消不存在的请求
  console.log('\n6. 测试取消不存在的请求...');
  try {
    const response = await fetch(`${baseUrl}/api/chat/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'non-existent-user'
      })
    });

    const result = await response.json();
    console.log('取消不存在请求的结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('取消不存在请求失败:', error.message);
  }
}

// 测试快速取消
async function testQuickCancel() {
  console.log('\n\n⚡ 测试快速取消...\n');

  const baseUrl = 'http://localhost:8888';
  const userId = 'quick-test-' + Date.now();

  console.log(`使用测试用户ID: ${userId}`);

  // 立即启动请求并快速取消
  const requestPromise = fetch(`${baseUrl}/api/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    },
    body: JSON.stringify({
      message: '请写一篇长文章',
      context: '快速取消测试',
      userId: userId
    })
  });

  // 立即取消
  setTimeout(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/chat/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId
        })
      });

      const result = await response.json();
      console.log('快速取消结果:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('快速取消失败:', error.message);
    }
  }, 100);

  // 等待请求完成
  try {
    const response = await requestPromise;
    console.log('请求状态码:', response.status);
  } catch (error) {
    console.log('请求被取消或出错:', error.message);
  }
}

// 前端使用示例
function showFrontendExample() {
  console.log('\n\n🌐 前端使用示例:\n');
  
  console.log(`
// 1. 发送消息并监听取消
let currentRequest = null;

async function sendMessageWithCancel(message, context = '') {
  try {
    // 发送请求
    currentRequest = fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify({
        message: message,
        context: context
      })
    });

    const response = await currentRequest;
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              console.error('错误:', data.message);
            } else if (data.message && data.message.content) {
              // 处理 AI 回复内容
              console.log('AI 回复:', data.message.content);
              // 更新 UI 显示
            }
          } catch (parseError) {
            console.log('原始数据:', line.slice(6));
          }
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error);
  } finally {
    currentRequest = null;
  }
}

// 2. 取消当前请求
async function cancelCurrentRequest() {
  if (currentRequest) {
    try {
      const response = await fetch('/api/chat/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'current-user-id'
        })
      });

      const result = await response.json();
      
      if (result.code === 0) {
        console.log('请求已取消');
        // 更新 UI 状态
      } else {
        console.error('取消失败:', result.message);
      }
    } catch (error) {
      console.error('取消请求失败:', error);
    }
  } else {
    console.log('没有正在进行的请求');
  }
}

// 3. 检查是否有活跃请求
async function checkActiveRequest() {
  try {
    const response = await fetch('/api/chat/active?userId=current-user-id', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.code === 0) {
      console.log('活跃状态:', result.data.hasActiveRequest);
      // 根据状态更新 UI
      if (result.data.hasActiveRequest) {
        // 显示取消按钮
        showCancelButton();
      } else {
        // 隐藏取消按钮
        hideCancelButton();
      }
    }
  } catch (error) {
    console.error('检查活跃状态失败:', error);
  }
}

// 4. 使用示例
sendMessageWithCancel('请介绍一下 JavaScript');
setTimeout(() => {
  cancelCurrentRequest();
}, 5000); // 5秒后取消

// 定期检查状态
setInterval(checkActiveRequest, 2000);
`);
}

// 运行测试
async function runCancelTests() {
  console.log('🎯 取消发送功能测试\n');
  console.log('=' .repeat(50));
  
  await testCancelMessage();
  await testQuickCancel();
  showFrontendExample();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ 测试完成');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runCancelTests().catch(console.error);
}

export {
  testCancelMessage,
  testQuickCancel,
  showFrontendExample,
  runCancelTests
}; 