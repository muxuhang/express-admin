# 聊天API接口返回数据结构参考

## 概述

本文档详细说明了 `/api/chat/send` 接口的返回数据结构，包括流式响应格式、错误处理、以及不同AI服务的数据一致性。

## 接口基本信息

- **接口路径**: `POST /api/chat/send`
- **响应类型**: `text/event-stream` (Server-Sent Events)
- **编码格式**: UTF-8

## 请求参数

```json
{
  "message": "你好，请介绍一下React",
  "context": "前端开发学习",
  "service": "openrouter",  // 可选: "local" | "openrouter"
  "model": "mistralai/mistral-7b-instruct"  // 可选，指定模型
}
```

### 模型ID处理说明

**OpenRouter 模型ID格式**:
- **完整格式**: `provider/model-name` (推荐)
  - 例如: `mistralai/mistral-7b-instruct`
  - 例如: `anthropic/claude-3-haiku`
- **截断格式**: `model-name` (自动转换)
  - 例如: `mistral-7b-instruct` → 自动转换为 `mistralai/mistral-7b-instruct`
  - 例如: `claude-3-haiku` → 自动转换为 `anthropic/claude-3-haiku`

**模型ID自动转换**:
- 如果传入的模型ID不包含 `/`，系统会自动查找匹配的完整模型ID
- 如果找到匹配的完整ID，会自动转换并使用
- 如果未找到匹配的完整ID，会使用默认模型
- 建议始终使用完整的模型ID以避免歧义

**支持的模型列表**:
- `mistralai/mistral-7b-instruct` - Mistral 7B 指令模型
- `meta-llama/llama-2-7b-chat` - Llama 2 7B 聊天模型
- `google/gemma-7b-it` - Google Gemma 7B 指令模型
- `microsoft/phi-2` - Microsoft Phi-2 模型
- `nousresearch/nous-hermes-llama2-7b` - Nous Hermes Llama2 7B
- `openchat/openchat-3.5` - OpenChat 3.5 模型
- `anthropic/claude-3-haiku` - Claude 3 Haiku 模型
- `meta-llama/llama-2-13b-chat` - Llama 2 13B 聊天模型
- `microsoft/phi-3-mini-4k-instruct` - Microsoft Phi-3 Mini 4K 指令模型
- `microsoft/phi-3-mini-128k-instruct` - Microsoft Phi-3 Mini 128K 指令模型

## 流式响应数据结构

### 1. 正常数据块格式

每个数据块都是一个 Server-Sent Event，格式为：
```
data: {"message": {"content": "文本内容"}, "chunk": 1, "done": false}
```

**字段说明**:
- `message.content`: 当前块的文本内容
- `chunk`: 数据块序号（从1开始）
- `done`: 是否为最后一个数据块

**示例**:
```
data: {"message": {"content": "你好！"}, "chunk": 1, "done": false}
data: {"message": {"content": "React"}, "chunk": 2, "done": false}
data: {"message": {"content": "是一个"}, "chunk": 3, "done": false}
data: {"message": {"content": "前端框架。"}, "chunk": 4, "done": true, "fullResponse": "你好！React是一个前端框架。"}
```

### 2. 完成数据块格式

最后一个数据块包含完整响应：
```json
{
  "message": {
    "content": ""
  },
  "chunk": 4,
  "done": true,
  "fullResponse": "完整的AI回复内容"
}
```

### 3. 错误数据块格式

当发生错误时，返回错误信息：
```json
{
  "error": true,
  "code": 500,
  "message": "错误描述信息",
  "details": "详细错误信息（仅在开发环境）"
}
```

## 完整响应示例

### 成功响应示例

**请求**:
```bash
curl -X POST http://localhost:8888/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，请介绍一下JavaScript",
    "service": "openrouter",
    "model": "mistralai/mistral-7b-instruct"
  }'
```

**响应流**:
```
data: {"message": {"content": "你好！"}, "chunk": 1, "done": false}
data: {"message": {"content": "JavaScript"}, "chunk": 2, "done": false}
data: {"message": {"content": "是一种"}, "chunk": 3, "done": false}
data: {"message": {"content": "编程语言。"}, "chunk": 4, "done": true, "fullResponse": "你好！JavaScript是一种编程语言。"}
```

### 错误响应示例

**网络错误**:
```
data: {"error": true, "code": 503, "message": "AI服务不可用，请检查服务配置"}
```

**模型错误**:
```
data: {"error": true, "code": 400, "message": "OpenRouter 请求失败: 400 mistral-7b-instruct is not a valid model ID"}
```

**超时错误**:
```
data: {"error": true, "code": 504, "message": "AI服务连接超时，请稍后重试"}
```

## 数据一致性规范

### 1. 本地AI (Ollama) 数据结构

**流式响应格式**:
```json
{
  "message": {
    "content": "文本内容"
  },
  "done": false
}
```

**完成响应格式**:
```json
{
  "message": {
    "content": ""
  },
  "done": true
}
```

### 2. OpenRouter 数据结构

**流式响应格式**:
```json
{
  "message": {
    "content": "文本内容"
  },
  "chunk": 1,
  "done": false
}
```

**完成响应格式**:
```json
{
  "message": {
    "content": ""
  },
  "chunk": 10,
  "done": true,
  "fullResponse": "完整的AI回复内容"
}
```

## 错误代码说明

| 错误代码 | 说明 | 解决方案 |
|---------|------|----------|
| 400 | 请求参数错误 | 检查请求参数格式 |
| 429 | API调用频率超限 | 等待一段时间后重试 |
| 499 | 请求被用户取消 | 正常情况，无需处理 |
| 500 | 服务器内部错误 | 检查服务器日志 |
| 503 | 服务不可用 | 检查AI服务状态 |
| 504 | 请求超时 | 检查网络连接 |

## 前端处理示例

### JavaScript 处理流式响应

```javascript
async function sendMessage(message, service = 'openrouter', model = null) {
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      service,
      model
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

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
          
          if (data.error) {
            console.error('错误:', data.message);
            throw new Error(data.message);
          }
          
          if (data.message?.content) {
            fullResponse += data.message.content;
            // 实时显示内容
            console.log(data.message.content);
          }
          
          if (data.done) {
            console.log('完整响应:', data.fullResponse || fullResponse);
            return data.fullResponse || fullResponse;
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
}
```

### React Hook 示例

```javascript
import { useState, useCallback } from 'react';

function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (content, service = 'openrouter', model = null) => {
    setIsLoading(true);
    setError(null);
    
    const userMessage = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, service, model })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
              
              if (data.error) {
                throw new Error(data.message);
              }
              
              if (data.message?.content) {
                aiResponse += data.message.content;
                // 实时更新AI回复
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = aiResponse;
                  } else {
                    newMessages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, sendMessage, isLoading, error };
}
```

## 注意事项

1. **数据格式一致性**: 确保本地AI和OpenRouter返回相同的数据结构
2. **错误处理**: 所有错误都应该通过 `error` 字段返回，而不是抛出异常
3. **流式处理**: 前端需要正确处理流式响应，实时显示内容
4. **编码格式**: 确保使用UTF-8编码处理中文内容
5. **超时处理**: 建议设置合理的超时时间，避免长时间等待

## 测试工具

可以使用以下命令测试接口：

```bash
# 测试基本功能
curl -X POST http://localhost:8888/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "service": "openrouter"}'

# 测试指定模型
curl -X POST http://localhost:8888/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "service": "openrouter", "model": "anthropic/claude-3-haiku"}'

# 测试本地AI
curl -X POST http://localhost:8888/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "service": "local"}'
``` 