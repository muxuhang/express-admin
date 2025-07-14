# OpenRouter 配置指南

## 概述

本项目已集成 OpenRouter 服务，支持使用免费的 AI 语言模型。OpenRouter 提供了多个免费的 AI 模型，包括 Mistral、Llama、Gemma 等。

## 配置步骤

### 1. 获取 OpenRouter API 密钥

1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册账号并登录
3. 进入 [API Keys](https://openrouter.ai/keys) 页面
4. 创建新的 API 密钥
5. 复制 API 密钥

### 2. 配置环境变量

在项目根目录创建 `.env` 文件，添加以下配置：

```bash
# OpenRouter配置
OPENROUTER_API_KEY=your-openrouter-api-key

# 应用配置
APP_URL=http://localhost:8888
```

### 3. 可用的免费模型

OpenRouter 提供以下免费模型：

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

## API 接口

### 发送消息

```http
POST /api/chat/send
Content-Type: application/json

{
  "message": "你好，请介绍一下React",
  "context": "前端开发",
  "service": "openrouter",
  "model": "mistralai/mistral-7b-instruct"
}
```

### 获取可用模型

```http
GET /api/chat/models?service=openrouter
```

### 切换AI服务

```http
POST /api/chat/service/switch
Content-Type: application/json

{
  "service": "openrouter"
}
```

### 设置模型

```http
POST /api/chat/service/model
Content-Type: application/json

{
  "model": "mistralai/mistral-7b-instruct",
  "service": "openrouter"
}
```

### 获取服务状态

```http
GET /api/chat/service/status
```

## 使用说明

### 1. 默认配置

- 默认使用 OpenRouter 服务
- 默认模型：`mistralai/mistral-7b-instruct`

### 2. 服务切换

可以在本地 AI (Ollama) 和 OpenRouter 之间切换：

```javascript
// 切换到 OpenRouter
fetch('/api/chat/service/switch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ service: 'openrouter' })
})

// 切换到本地 AI
fetch('/api/chat/service/switch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ service: 'local' })
})
```

### 3. 模型选择

可以为每次请求指定不同的模型：

```javascript
fetch('/api/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好',
    service: 'openrouter',
    model: 'google/gemma-7b-it'
  })
})
```

## 错误处理

### 常见错误

1. **API密钥未配置**
   ```
   错误：未配置OPENROUTER_API_KEY环境变量
   解决：在.env文件中设置OPENROUTER_API_KEY
   ```

2. **API调用频率超限**
   ```
   错误：API调用频率超限，请稍后重试
   解决：等待一段时间后重试
   ```

3. **API配额已用完**
   ```
   错误：API配额已用完，请稍后重试
   解决：等待配额重置或升级账户
   ```

4. **网络连接问题**
   ```
   错误：无法连接到AI服务，请检查网络连接
   解决：检查网络连接和防火墙设置
   ```

## 性能优化

### 1. 模型选择建议

- **快速响应**：使用 `microsoft/phi-3-mini-4k-instruct`
- **平衡性能**：使用 `mistralai/mistral-7b-instruct`
- **高质量**：使用 `anthropic/claude-3-haiku`

### 2. 参数调优

可以根据需要调整以下参数：

```javascript
{
  temperature: 0.7,        // 创造性 (0-1)
  max_tokens: 1000,        // 最大生成长度
  top_p: 0.9,             // 核采样
  frequency_penalty: 0.1,  // 频率惩罚
  presence_penalty: 0.1    // 存在惩罚
}
```

## 注意事项

1. **API限制**：OpenRouter 对免费用户有调用频率和配额限制
2. **网络要求**：需要稳定的网络连接
3. **响应时间**：网络延迟可能影响响应速度
4. **数据隐私**：消息会发送到 OpenRouter 服务器处理

## 故障排除

### 1. 连接测试

```javascript
// 测试 OpenRouter 连接
fetch('/api/chat/service/status')
  .then(response => response.json())
  .then(data => console.log(data))
```

### 2. 日志查看

查看服务器日志以获取详细错误信息：

```bash
npm start
```

### 3. 环境变量检查

确保环境变量正确设置：

```bash
echo $OPENROUTER_API_KEY
```

## 更多资源

- [OpenRouter 官方文档](https://openrouter.ai/docs)
- [OpenRouter API 参考](https://openrouter.ai/docs/api)
- [免费模型列表](https://openrouter.ai/models) 