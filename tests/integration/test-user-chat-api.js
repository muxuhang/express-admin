#!/usr/bin/env node

/**
 * 用户聊天API测试脚本
 * 演示如何在没有登录的情况下使用AI聊天功能
 */

console.log('🚀 用户聊天API测试脚本\n')

// 模拟前端调用示例
function showFrontendExample() {
  console.log('🌐 前端 JavaScript 调用示例:\n')
  
  console.log(`
// 1. 生成用户ID（首次使用时）
async function generateUserId() {
  try {
    const response = await fetch('/api/chat/user/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    
    if (result.code === 0) {
      const userId = result.data.userId;
      // 将用户ID保存到localStorage
      localStorage.setItem('chatUserId', userId);
      console.log('用户ID已生成:', userId);
      return userId;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('生成用户ID失败:', error);
  }
}

// 2. 发送聊天消息
async function sendChatMessage(message, userId) {
  try {
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        userId: userId,
        service: 'auto' // 可选: openrouter, auto
      })
    });

    if (!response.ok) {
      throw new Error('网络请求失败');
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
              console.error('AI回复错误:', data.message);
            } else if (data.message && data.message.content) {
              // 处理流式回复
              console.log('AI回复:', data.message.content);
            } else if (data.done) {
              console.log('回复完成');
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error);
  }
}

// 3. 获取用户会话列表
async function getUserSessions(userId, page = 1, limit = 10) {
  try {
    const response = await fetch(\`/api/chat/sessions?userId=\${userId}&page=\${page}&limit=\${limit}\`);
    const result = await response.json();
    
    if (result.code === 0) {
      console.log('会话列表:', result.data.sessions);
      return result.data.sessions;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('获取会话列表失败:', error);
  }
}

// 4. 获取会话详情（通过sessionId）
async function getSessionDetails(userId, sessionId) {
  try {
    const response = await fetch(\`/api/chat/session/\${sessionId}?userId=\${userId}\`);
    const result = await response.json();
    
    if (result.code === 0) {
      console.log('会话详情:', result.data.messages);
      return result.data.messages;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('获取会话详情失败:', error);
  }
}

// 5. 获取用户历史记录
async function getUserHistory(userId, page = 1, limit = 10) {
  try {
    const response = await fetch(\`/api/chat/history?userId=\${userId}&page=\${page}&limit=\${limit}\`);
    const result = await response.json();
    
    if (result.code === 0) {
      console.log('历史记录:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('获取历史记录失败:', error);
  }
}

// 6. 删除指定会话
async function deleteSession(userId, sessionId) {
  try {
    const response = await fetch(\`/api/chat/session/\${sessionId}?userId=\${userId}\`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (result.code === 0) {
      console.log('会话已删除');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('删除会话失败:', error);
  }
}

// 7. 清除所有历史记录
async function clearAllHistory(userId) {
  try {
    const response = await fetch('/api/chat/history', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: userId })
    });
    const result = await response.json();
    
    if (result.code === 0) {
      console.log('所有历史记录已清除');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('清除历史记录失败:', error);
  }
}

// 使用示例
async function main() {
  // 1. 获取或生成用户ID
  let userId = localStorage.getItem('chatUserId');
  if (!userId) {
    userId = await generateUserId();
  }
  
  // 2. 发送消息
  await sendChatMessage('你好，请介绍一下JavaScript的基本语法', userId);
  
  // 3. 获取会话列表
  const sessions = await getUserSessions(userId);
  
  // 4. 如果有会话，获取第一个会话的详情
  if (sessions && sessions.length > 0) {
    const firstSession = sessions[0];
    await getSessionDetails(userId, firstSession.sessionId);
  }
  
  // 5. 获取历史记录
  await getUserHistory(userId);
}

// 运行示例
main();
`);
}

// 显示API接口说明
function showAPIReference() {
  console.log('📚 API 接口说明:\n')
  
  console.log(`
🔧 用户管理接口:
POST /api/chat/user/generate
- 功能: 生成唯一用户ID
- 参数: 无
- 返回: { code: 0, data: { userId: "user_1234567890_1234", createdAt: "2024-01-01T00:00:00.000Z" } }

💬 聊天核心接口:
POST /api/chat/send
- 功能: 发送聊天消息（流式响应）
- 参数: { message: "消息内容", userId: "用户ID", service?: "openrouter|auto", model?: "模型名称", sessionId?: "会话ID" }
- 返回: Server-Sent Events 流式数据
- 说明: 优先使用指定的会话ID，如果没有指定则使用最近活跃的会话，只有在没有现有会话时才创建新会话。如果是会话的第一条用户消息，会自动使用用户提问内容的前50个字符更新会话标题。已移除context参数，系统会自动处理上下文

📋 历史记录接口:
GET /api/chat/history?userId=xxx&page=1&limit=10&service=xxx&sessionId=xxx
- 功能: 获取用户历史记录
- 参数: userId(必需), page, limit, service, sessionId
- 返回: { code: 0, data: { messages: [], sessions: {}, total: 0 } }

🗂️ 会话管理接口:
GET /api/chat/sessions?userId=xxx&page=1&limit=10
- 功能: 获取用户会话列表
- 参数: userId(必需), page, limit
- 返回: { code: 0, data: { list: [] } }

POST /api/chat/session/create
- 功能: 创建空会话
- 参数: { userId: "用户ID", title?: "会话标题", service?: "服务类型", model?: "模型名称" }
- 返回: { code: 0, data: { sessionId: "会话ID", title: "标题", messageCount: 1, createdAt: "创建时间", updatedAt: "更新时间", service: "服务", model: "模型" } }

GET /api/chat/session/:sessionId?userId=xxx
- 功能: 获取指定会话详情
- 参数: sessionId(路径), userId(必需)
- 返回: { code: 0, data: { messages: [], total: 0 } }

DELETE /api/chat/session/:sessionId?userId=xxx
- 功能: 删除指定会话
- 参数: sessionId(路径), userId(必需)
- 返回: { code: 0, message: "会话删除成功" }

DELETE /api/chat/history
- 功能: 清除用户所有历史记录
- 参数: { userId: "用户ID" }
- 返回: { code: 0, message: "对话历史已清除" }

⚙️ 其他接口:
POST /api/chat/cancel?userId=xxx&service=xxx
- 功能: 取消正在进行的消息发送

GET /api/chat/active?userId=xxx&service=xxx
- 功能: 检查是否有活跃请求

GET /api/chat/models?service=xxx
- 功能: 获取可用模型列表

GET /api/chat/service/status
- 功能: 获取服务状态

POST /api/chat/service/switch
- 功能: 切换AI服务

POST /api/chat/service/model
- 功能: 设置AI模型
`);
}

// 显示使用流程
function showUsageFlow() {
  console.log('🔄 使用流程:\n')
  
  console.log(`
1️⃣ 首次使用:
   - 调用 POST /api/chat/user/generate 生成用户ID
   - 将用户ID保存到本地存储（localStorage、Cookie等）
   - 后续请求都需要携带这个用户ID

2️⃣ 发送消息:
   - 调用 POST /api/chat/send 发送消息
   - 必须携带 userId 参数
   - 支持流式响应，实时显示AI回复

3️⃣ 查看历史:
   - 调用 GET /api/chat/history 获取所有历史记录
   - 调用 GET /api/chat/sessions 获取会话列表
   - 调用 GET /api/chat/session/:sessionId 查看特定会话详情

4️⃣ 管理数据:
   - 调用 DELETE /api/chat/session/:sessionId 删除特定会话
   - 调用 DELETE /api/chat/history 清除所有历史记录

💡 特点:
✅ 无需登录，通过用户ID识别用户
✅ 每个用户有独立的对话历史
✅ 支持按会话分组管理对话
✅ 支持流式响应，实时显示AI回复
✅ 支持多种AI服务（本地、OpenRouter）
✅ 支持模型切换和服务切换
✅ 数据持久化存储到数据库
`);
}

// 显示错误处理
function showErrorHandling() {
  console.log('⚠️ 错误处理:\n')
  
  console.log(`
常见错误码:
400 - 请求参数错误（如缺少userId）
401 - 未授权（通常不会出现，因为无需登录）
403 - 禁止访问
404 - 接口不存在
500 - 服务器内部错误
503 - 数据库服务不可用

错误响应格式:
{
  "code": 400,
  "message": "请提供有效的用户ID"
}

前端错误处理示例:
try {
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello', userId: 'user_123' })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('请求失败:', error.message);
    return;
  }
  
  // 处理成功响应...
} catch (error) {
  console.error('网络错误:', error);
}
`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('用法: node test-user-chat-api.js [选项]')
    console.log('选项:')
    console.log('  --frontend    显示前端调用示例')
    console.log('  --api         显示API接口说明')
    console.log('  --flow        显示使用流程')
    console.log('  --error       显示错误处理')
    console.log('  --all         显示所有信息')
    return
  }
  
  if (args.includes('--all') || args.length === 0) {
    showUsageFlow()
    showAPIReference()
    showFrontendExample()
    showErrorHandling()
  } else {
    if (args.includes('--flow')) showUsageFlow()
    if (args.includes('--api')) showAPIReference()
    if (args.includes('--frontend')) showFrontendExample()
    if (args.includes('--error')) showErrorHandling()
  }
}

// 运行主函数
main() 