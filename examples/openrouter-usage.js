// OpenRouter 使用示例

// 1. 基本消息发送
async function sendBasicMessage() {
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: '你好，请介绍一下React框架',
      context: '前端开发学习',
      service: 'openrouter',
      model: 'mistralai/mistral-7b-instruct'
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.message?.content) {
            process.stdout.write(data.message.content);
          }
          if (data.error) {
            console.error('错误:', data.message);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
}

// 2. 获取可用模型
async function getAvailableModels() {
  const response = await fetch('/api/chat/models?service=openrouter');
  const data = await response.json();
  
  console.log('可用模型:');
  data.data.models.forEach(model => {
    console.log(`- ${model.name} (${model.provider})`);
  });
}

// 3. 切换AI服务
async function switchToOpenRouter() {
  const response = await fetch('/api/chat/service/switch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      service: 'openrouter'
    })
  });

  const data = await response.json();
  console.log('服务切换结果:', data.message);
}

// 4. 设置模型
async function setModel() {
  const response = await fetch('/api/chat/service/model', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemma-7b-it',
      service: 'openrouter'
    })
  });

  const data = await response.json();
  console.log('模型设置结果:', data.message);
}

// 5. 获取服务状态
async function getServiceStatus() {
  const response = await fetch('/api/chat/service/status');
  const data = await response.json();
  
  console.log('服务状态:');
  Object.entries(data.data.status).forEach(([service, status]) => {
    console.log(`${service}: ${status.available ? '可用' : '不可用'}`);
    if (status.available) {
      console.log(`  当前模型: ${status.currentModel}`);
      console.log(`  可用模型数: ${status.availableModels}`);
    } else {
      console.log(`  错误: ${status.error}`);
    }
  });
}

// 6. 获取历史记录
async function getHistory() {
  const response = await fetch('/api/chat/history?service=openrouter&limit=5');
  const data = await response.json();
  
  console.log('历史记录:');
  data.data.list.forEach((item, index) => {
    console.log(`${index + 1}. ${item.role}: ${item.content.substring(0, 50)}...`);
  });
}

// 7. 清除历史记录
async function clearHistory() {
  const response = await fetch('/api/chat/history', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      service: 'openrouter'
    })
  });

  const data = await response.json();
  console.log('清除结果:', data.message);
}

// 8. 取消正在进行的请求
async function cancelRequest() {
  const response = await fetch('/api/chat/cancel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      service: 'openrouter'
    })
  });

  const data = await response.json();
  console.log('取消结果:', data.message);
}

// 9. 检查活跃请求
async function checkActiveRequest() {
  const response = await fetch('/api/chat/active?service=openrouter');
  const data = await response.json();
  
  console.log('活跃请求状态:', data.data.hasActiveRequest ? '有' : '无');
}

// 10. 流式聊天示例
async function streamChat() {
  const messages = [
    '你好，请介绍一下JavaScript',
    '什么是闭包？',
    '请解释一下Promise',
    'React Hooks有什么优势？'
  ];

  for (const message of messages) {
    console.log(`\n用户: ${message}`);
    console.log('AI: ');
    
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        service: 'openrouter',
        model: 'mistralai/mistral-7b-instruct'
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.message?.content) {
              process.stdout.write(data.message.content);
            }
            if (data.error) {
              console.error('\n错误:', data.message);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    
    // 等待一秒再发送下一条消息
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 导出所有函数
export {
  sendBasicMessage,
  getAvailableModels,
  switchToOpenRouter,
  setModel,
  getServiceStatus,
  getHistory,
  clearHistory,
  cancelRequest,
  checkActiveRequest,
  streamChat
};

// 如果直接运行此文件，执行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 OpenRouter 使用示例');
  console.log('请确保服务器正在运行，然后调用相应的函数进行测试。');
} 