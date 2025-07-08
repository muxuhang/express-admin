import fetch from 'node-fetch';

// 测试 chat/send 接口
async function testChatSend() {
  console.log('🚀 开始测试 chat/send 接口...\n');

  const baseUrl = 'http://localhost:3002';
  const endpoint = '/api/chat/send';

  // 测试数据
  const testData = {
    message: '你好，请介绍一下前端开发的基本技术栈',
    context: '用户正在学习前端开发，需要了解基础技术栈'
  };

  console.log('📤 发送请求数据:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n📡 请求详情:');
  console.log(`URL: ${baseUrl}${endpoint}`);
  console.log(`Method: POST`);
  console.log(`Content-Type: application/json`);
  console.log('\n📥 响应数据 (Server-Sent Events):\n');

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
    console.log('📊 响应头:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('\n📨 流式响应数据:\n');

    // 处理 Server-Sent Events 流
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('\n✅ 流式响应完成');
        break;
      }

      const chunk = decoder.decode(value);
      console.log('🔍 原始数据块:', JSON.stringify(chunk));
      
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            console.log('📦 解析后的数据:', JSON.stringify(data, null, 2));
            
            if (data.error) {
              console.log(`❌ 错误: ${data.message}`);
            } else if (data.message && data.message.content) {
              // 显示 AI 回复内容
              process.stdout.write(data.message.content);
            } else {
              // 显示其他数据
              console.log('📦 数据块:', JSON.stringify(data, null, 2));
            }
          } catch (parseError) {
            console.log('📄 解析失败，原始数据:', line.slice(6));
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ 请求异常:', error.message);
  }
}

// 测试获取历史记录
async function testChatHistory() {
  console.log('\n\n📚 测试获取聊天历史记录...\n');

  const baseUrl = 'http://localhost:3002';
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

// 测试清除历史记录
async function testClearHistory() {
  console.log('\n\n🗑️ 测试清除聊天历史记录...\n');

  const baseUrl = 'http://localhost:3002';
  const endpoint = '/api/chat/history';

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
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
    
    console.log('✅ 清除历史记录成功:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ 请求异常:', error.message);
  }
}

// 前端 JavaScript 调用示例
function showFrontendExample() {
  console.log('\n\n🌐 前端 JavaScript 调用示例:\n');
  
  console.log(`
// 1. 使用 fetch 调用 chat/send 接口 (流式响应)
async function sendChatMessage(message, context = '') {
  try {
    const response = await fetch('/api/chat/send', {
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
              // 这里可以更新 UI 显示
            }
          } catch (parseError) {
            console.log('原始数据:', line.slice(6));
          }
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error);
  }
}

// 2. 使用 EventSource 调用 chat/send 接口 (推荐)
async function sendChatMessageWithEventSource(message, context = '') {
  // 首先发送 POST 请求
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: message,
      context: context
    })
  });

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  // 然后使用 EventSource 监听响应
  const eventSource = new EventSource('/api/chat/send');
  
  eventSource.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      
      if (data.error) {
        console.error('错误:', data.message);
        eventSource.close();
      } else if (data.message && data.message.content) {
        console.log('AI 回复:', data.message.content);
        // 更新 UI 显示
      }
    } catch (parseError) {
      console.log('解析数据失败:', event.data);
    }
  };

  eventSource.onerror = function(error) {
    console.error('EventSource 错误:', error);
    eventSource.close();
  };
}

// 3. 获取聊天历史
async function getChatHistory(page = 1, limit = 10) {
  try {
    const response = await fetch(\`/api/chat/history?page=\${page}&limit=\${limit}\`);
    const result = await response.json();
    
    if (result.code === 0) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('获取历史记录失败:', error);
  }
}

// 4. 清除聊天历史
async function clearChatHistory() {
  try {
    const response = await fetch('/api/chat/history', {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (result.code === 0) {
      console.log('历史记录已清除');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('清除历史记录失败:', error);
  }
}

// 使用示例
sendChatMessage('你好，请介绍一下 JavaScript 的基本语法');
getChatHistory(1, 5);
clearChatHistory();
`);
}

// 运行测试
async function runTests() {
  console.log('🎯 Chat API 接口测试\n');
  console.log('=' .repeat(50));
  
  await testChatSend();
  await testChatHistory();
  await testClearHistory();
  showFrontendExample();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ 测试完成');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export {
  testChatSend,
  testChatHistory,
  testClearHistory,
  showFrontendExample
}; 