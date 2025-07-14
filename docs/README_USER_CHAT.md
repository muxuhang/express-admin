# 用户聊天功能说明

## 概述

本系统提供了无需登录的AI聊天功能，每个用户通过唯一的用户ID来管理自己的对话历史。用户可以通过对话历史的ID查看对应的聊天信息。

## 核心特性

- ✅ **无需登录**：通过用户ID识别用户，无需注册登录
- ✅ **独立历史**：每个用户有独立的对话历史记录
- ✅ **会话管理**：支持按会话分组管理对话
- ✅ **流式响应**：实时显示AI回复
- ✅ **多服务支持**：支持本地AI和OpenRouter服务
- ✅ **数据持久化**：所有对话数据存储到数据库

## 快速开始

### 1. 生成用户ID

首次使用时，需要生成一个唯一的用户ID：

```javascript
// 生成用户ID
const response = await fetch('/api/chat/user/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
const result = await response.json();
const userId = result.data.userId;

// 保存到本地存储
localStorage.setItem('chatUserId', userId);
```

### 2. 发送聊天消息

```javascript
// 发送消息
const response = await fetch('/api/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好，请介绍一下JavaScript',
    userId: userId,
    service: 'auto' // 可选: local, openrouter, auto
  })
});

// 处理流式响应
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
        if (data.message && data.message.content) {
          console.log('AI回复:', data.message.content);
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  }
}
```

### 3. 获取对话历史

```javascript
// 获取历史记录
const response = await fetch(`/api/chat/history?userId=${userId}&page=1&limit=10`);
const result = await response.json();
console.log('历史记录:', result.data);

// 获取会话列表
const sessionsResponse = await fetch(`/api/chat/sessions?userId=${userId}`);
const sessionsResult = await sessionsResponse.json();
console.log('会话列表:', sessionsResult.data.sessions);
```

### 4. 查看特定会话

```javascript
// 获取会话详情
const sessionId = 'user_123_2024-01-01';
const response = await fetch(`/api/chat/session/${sessionId}?userId=${userId}`);
const result = await response.json();
console.log('会话详情:', result.data.messages);
```

## API 接口文档

### 用户管理

#### 生成用户ID
- **POST** `/api/chat/user/generate`
- **功能**: 生成唯一用户ID
- **参数**: 无
- **返回**: 
```json
{
  "code": 0,
  "data": {
    "userId": "user_1234567890_1234",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "用户ID生成成功"
}
```

### 聊天核心

#### 发送消息
- **POST** `/api/chat/send`
- **功能**: 发送聊天消息（流式响应）
- **参数**: 
```json
{
  "message": "消息内容",
  "userId": "用户ID",
  "service": "local|openrouter|auto",
  "model": "模型名称"
}
```
- **返回**: Server-Sent Events 流式数据

### 历史记录

#### 获取历史记录
- **GET** `/api/chat/history`
- **参数**: 
  - `userId` (必需): 用户ID
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认10
  - `service`: 服务类型过滤
  - `sessionId`: 会话ID过滤
- **返回**:
```json
{
  "code": 0,
  "data": {
    "userId": "user_123",
    "total": 50,
    "page": 1,
    "limit": 10,
    "messages": [...],
    "sessions": {...}
  }
}
```

#### 获取会话列表
- **GET** `/api/chat/sessions`
- **参数**:
  - `userId` (必需): 用户ID
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认10
- **返回**:
```json
{
  "code": 0,
  "data": {
    "userId": "user_123",
    "sessions": [
      {
        "sessionId": "user_123_2024-01-01",
        "messageCount": 10,
        "lastMessage": {...},
        "firstMessage": {...}
      }
    ]
  }
}
```

#### 获取会话详情
- **GET** `/api/chat/session/:sessionId`
- **参数**:
  - `sessionId` (路径): 会话ID
  - `userId` (必需): 用户ID
- **返回**:
```json
{
  "code": 0,
  "data": {
    "sessionId": "user_123_2024-01-01",
    "userId": "user_123",
    "messages": [...],
    "total": 10
  }
}
```

### 数据管理

#### 删除会话
- **DELETE** `/api/chat/session/:sessionId`
- **参数**:
  - `sessionId` (路径): 会话ID
  - `userId` (必需): 用户ID
- **返回**:
```json
{
  "code": 0,
  "data": {
    "sessionId": "user_123_2024-01-01",
    "userId": "user_123"
  },
  "message": "会话删除成功"
}
```

#### 清除所有历史
- **DELETE** `/api/chat/history`
- **参数**:
```json
{
  "userId": "用户ID"
}
```
- **返回**:
```json
{
  "code": 0,
  "message": "对话历史已清除"
}
```

## 数据模型

### 消息结构
```javascript
{
  userId: "用户ID",
  sessionId: "会话ID",
  content: "消息内容",
  role: "user|assistant|system",
  service: "local|openrouter",
  model: "模型名称",
  messageIndex: 0,
  status: "sending|completed|failed|cancelled",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### 会话结构
```javascript
{
  sessionId: "会话ID",
  messageCount: 10,
  lastMessage: {...},
  firstMessage: {...}
}
```

## 使用示例

### 完整的前端示例

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI聊天</title>
</head>
<body>
    <div id="chat-container">
        <div id="messages"></div>
        <input type="text" id="messageInput" placeholder="输入消息...">
        <button onclick="sendMessage()">发送</button>
    </div>

    <script>
        let userId = localStorage.getItem('chatUserId');
        
        // 初始化用户ID
        async function initUser() {
            if (!userId) {
                const response = await fetch('/api/chat/user/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const result = await response.json();
                userId = result.data.userId;
                localStorage.setItem('chatUserId', userId);
            }
        }
        
        // 发送消息
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (!message) return;
            
            input.value = '';
            addMessage('user', message);
            
            try {
                const response = await fetch('/api/chat/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        userId: userId
                    })
                });
                
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let aiResponse = '';
                
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
                                    aiResponse += data.message.content;
                                    updateAIMessage(aiResponse);
                                }
                            } catch (e) {}
                        }
                    }
                }
            } catch (error) {
                console.error('发送消息失败:', error);
            }
        }
        
        // 添加消息到界面
        function addMessage(role, content) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${role}`;
            messageDiv.innerHTML = `<strong>${role === 'user' ? '用户' : 'AI'}:</strong> ${content}`;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        // 更新AI消息
        function updateAIMessage(content) {
            const messagesDiv = document.getElementById('messages');
            let aiMessage = messagesDiv.querySelector('.message.assistant');
            if (!aiMessage) {
                aiMessage = document.createElement('div');
                aiMessage.className = 'message assistant';
                messagesDiv.appendChild(aiMessage);
            }
            aiMessage.innerHTML = `<strong>AI:</strong> ${content}`;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        // 初始化
        initUser();
    </script>
</body>
</html>
```

## 错误处理

### 常见错误码
- `400`: 请求参数错误（如缺少userId）
- `500`: 服务器内部错误
- `503`: 数据库服务不可用

### 错误响应格式
```json
{
  "code": 400,
  "message": "请提供有效的用户ID"
}
```

## 注意事项

1. **用户ID管理**: 用户ID生成后需要保存到本地存储，丢失后无法恢复历史记录
2. **数据安全**: 用户ID是唯一标识，请妥善保管
3. **会话管理**: 同一天同一用户的对话会被归为同一会话
4. **流式响应**: 发送消息接口使用Server-Sent Events，需要特殊处理
5. **数据库依赖**: 所有历史记录依赖数据库存储，确保数据库服务正常运行

## 测试

运行测试脚本查看详细的使用示例：

```bash
node test-user-chat-api.js --all
``` 