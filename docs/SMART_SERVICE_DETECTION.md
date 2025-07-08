# 智能服务判断功能说明

## 概述

系统现在支持智能判断模型所属的服务，前端无需传递 `service` 参数，后台会根据模型ID自动选择对应的AI服务。

## 功能特性

### 1. 自动服务判断

系统会根据模型ID的格式自动判断使用哪个服务：

- **OpenRouter模型**: 包含 `/` 的格式，如 `mistralai/mistral-7b-instruct`
- **本地模型**: 包含 `:` 的格式，如 `llama2:latest`
- **模糊匹配**: 如果只是模型名称，会在所有服务中查找匹配

### 2. 支持的服务选项

- `local`: 强制使用本地AI服务
- `openrouter`: 强制使用OpenRouter服务
- `auto`: 自动判断（默认行为）
- 不传递: 自动判断

## 使用方式

### 1. 完全自动判断（推荐）

```javascript
// 前端只需要传递模型，无需指定服务
fetch('/api/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好，请介绍一下React',
    model: 'mistralai/mistral-7b-instruct'  // 自动判断为OpenRouter
  })
})

fetch('/api/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好，请介绍一下React',
    model: 'llama2:latest'  // 自动判断为本地AI
  })
})
```

### 2. 明确指定自动判断

```javascript
fetch('/api/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好，请介绍一下React',
    service: 'auto',  // 明确指定自动判断
    model: 'anthropic/claude-3-haiku'
  })
})
```

### 3. 强制指定服务

```javascript
// 强制使用本地AI
fetch('/api/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好，请介绍一下React',
    service: 'local',  // 强制使用本地AI
    model: 'llama2:latest'
  })
})

// 强制使用OpenRouter
fetch('/api/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好，请介绍一下React',
    service: 'openrouter',  // 强制使用OpenRouter
    model: 'google/gemma-7b-it'
  })
})
```

## 模型ID格式说明

### OpenRouter模型格式

**完整格式**（推荐）:
- `mistralai/mistral-7b-instruct`
- `anthropic/claude-3-haiku`
- `google/gemma-7b-it`

**截断格式**（自动转换）:
- `mistral-7b-instruct` → 自动转换为 `mistralai/mistral-7b-instruct`
- `claude-3-haiku` → 自动转换为 `anthropic/claude-3-haiku`

### 本地模型格式

**标准格式**:
- `llama2:latest`
- `mistral:latest`
- `codellama:latest`

**简单格式**:
- `llama2` → 匹配本地模型
- `mistral` → 匹配本地模型

## 判断逻辑

### 1. 格式判断（优先级最高）

```javascript
// 包含 / 的模型ID
if (modelName.includes('/')) {
  return 'openrouter'
}

// 包含 : 的模型ID
if (modelName.includes(':')) {
  return 'local'
}
```

### 2. 模糊匹配（备选方案）

如果格式判断无法确定，系统会：

1. 在OpenRouter模型列表中查找匹配
2. 在本地模型列表中查找匹配
3. 如果都找不到，使用默认服务

### 3. 默认服务

如果无法判断模型所属服务，系统会使用默认服务（当前设置为本地AI）。

## 日志输出

系统会在控制台输出服务判断过程：

```
根据模型 "mistralai/mistral-7b-instruct" 自动选择服务: openrouter
使用 OpenRouter (免费模型) 处理消息
```

```
根据模型 "llama2:latest" 自动选择服务: local
使用 本地AI (Ollama) 处理消息
```

## 错误处理

### 1. 模型不存在

如果指定的模型在对应服务中不存在：

```javascript
// 错误响应
{
  "error": true,
  "code": 400,
  "message": "不支持的OpenRouter模型: invalid-model"
}
```

### 2. 服务不可用

如果判断出的服务不可用：

```javascript
// 错误响应
{
  "error": true,
  "code": 503,
  "message": "本地AI服务不可用，请检查Ollama服务状态"
}
```

## 最佳实践

### 1. 前端实现建议

```javascript
// 推荐：只传递模型，让后台自动判断
const sendMessage = async (message, model) => {
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, model })
  })
  // 处理响应...
}

// 可选：明确指定自动判断
const sendMessageAuto = async (message, model) => {
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message, 
      model, 
      service: 'auto' 
    })
  })
  // 处理响应...
}
```

### 2. 模型选择建议

**快速响应**:
- 本地模型: `llama2:latest`
- OpenRouter: `microsoft/phi-3-mini-4k-instruct`

**高质量回答**:
- 本地模型: `mistral:latest`
- OpenRouter: `anthropic/claude-3-haiku`

**代码相关**:
- 本地模型: `codellama:latest`
- OpenRouter: `google/gemma-7b-it`

## 测试工具

可以使用以下命令测试智能判断功能：

```bash
# 测试OpenRouter模型自动判断
curl -X POST http://localhost:8888/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "model": "mistralai/mistral-7b-instruct"}'

# 测试本地模型自动判断
curl -X POST http://localhost:8888/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "model": "llama2:latest"}'

# 测试自动判断
curl -X POST http://localhost:8888/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "service": "auto", "model": "anthropic/claude-3-haiku"}'
```

## 总结

智能服务判断功能让前端使用更加简单，只需要关注模型选择，无需关心服务细节。系统会自动选择最合适的AI服务来处理请求，提供更好的用户体验。 