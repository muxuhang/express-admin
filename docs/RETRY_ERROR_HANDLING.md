# 重试和错误处理机制

## 概述

为了提高系统的稳定性和用户体验，我们实现了智能的重试和错误处理机制。

## 重试机制

### 重试策略

- **重试次数**: 1次（首次失败后重试一次）
- **重试间隔**: 1秒（递增延迟）
- **重试条件**: 网络错误、连接超时、服务暂时不可用

### 重试流程

```javascript
// 重试逻辑
let retryCount = 0
const maxRetries = 1  // 只重试一次

while (retryCount <= maxRetries) {
  try {
    stream = await this.ollama.chat({...})
    break // 成功获取流，跳出重试循环
  } catch (error) {
    retryCount++
    if (retryCount > maxRetries) {
      // 重试失败，抛出详细错误信息
      throw new Error('具体的错误信息')
    }
    // 等待后重试
    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
  }
}
```

## 错误分类和处理

### 错误类型

| 错误类型 | 错误代码 | 错误信息 | 解决方案 |
|---------|---------|---------|---------|
| 连接超时 | 504 | AI服务连接超时，请稍后重试 | 检查网络连接，稍后重试 |
| 服务不可用 | 503 | AI服务不可用，请检查Ollama服务是否启动 | 启动Ollama服务 |
| 网络连接问题 | 503 | 无法连接到AI服务，请检查网络连接 | 检查网络设置 |
| 用户取消 | 499 | 请求已被用户取消 | 用户主动取消 |
| 模型问题 | 503 | AI模型未正确加载，请检查模型状态 | 检查模型安装 |
| 其他错误 | 500 | 处理流时发生未知错误 | 查看详细日志 |

### 错误处理流程

```javascript
// 控制器中的错误处理
if (error.message.includes('fetch failed') || error.message.includes('Headers Timeout')) {
  errorMessage = 'AI服务连接超时，请稍后重试'
  errorCode = 504
} else if (error.message.includes('AI服务不可用') || error.message.includes('ECONNREFUSED')) {
  errorMessage = 'AI服务不可用，请检查Ollama服务是否启动'
  errorCode = 503
} else if (error.message.includes('无法连接到AI服务') || error.message.includes('ENOTFOUND')) {
  errorMessage = '无法连接到AI服务，请检查网络连接'
  errorCode = 503
}
```

## 前端错误处理

### 错误响应格式

```javascript
{
  "error": true,
  "code": 504,
  "message": "AI服务连接超时，请稍后重试",
  "details": "fetch failed" // 仅在开发环境显示
}
```

### 前端处理示例

```javascript
// 处理流式响应中的错误
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
        
        if (data.error) {
          // 处理错误
          console.error('AI服务错误:', data.message);
          showErrorMessage(data.message);
          return;
        } else if (data.message && data.message.content) {
          // 处理正常响应
          appendMessage(data.message.content);
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  }
}
```

## 测试和验证

### 运行测试

```bash
# 测试重试和错误处理
node test-retry-error.js

# 诊断Ollama服务
node diagnose-ollama.js
```

### 模拟错误场景

1. **停止Ollama服务**
   ```bash
   pkill ollama
   ```

2. **发送聊天请求**
   - 观察首次失败
   - 观察自动重试
   - 观察最终错误信息

3. **重启Ollama服务**
   ```bash
   ollama serve
   ```

4. **验证恢复**
   - 再次发送请求
   - 确认正常工作

## 配置选项

### 超时设置

```javascript
// Ollama客户端配置
const ollama = new Ollama({
  host: ollamaHost,
  request: {
    timeout: 30000, // 30秒超时
    keepAlive: true,
    keepAliveMsecs: 1000,
  }
})
```

### 流式处理超时

```javascript
// 流式处理最大时间
const maxProcessingTime = 60000 // 60秒
```

## 监控和日志

### 关键日志点

- 重试开始: `Ollama 请求失败 (尝试 1/2)`
- 重试等待: `等待 1 秒后重试...`
- 重试失败: `AI服务连接超时，请稍后重试`
- 错误发送: `发送错误响应: {...}`

### 监控指标

- 重试成功率
- 错误类型分布
- 平均响应时间
- 服务可用性

## 最佳实践

1. **用户友好的错误信息**: 避免技术术语，提供具体的解决建议
2. **合理的重试策略**: 避免过度重试，减少服务器压力
3. **详细的日志记录**: 便于问题排查和系统监控
4. **优雅的错误恢复**: 确保系统在错误后能正常恢复
5. **前端错误展示**: 清晰地向用户展示错误状态和解决建议 