# 数据结构一致性对比

## 概述

本文档对比了本地AI (Ollama) 和 OpenRouter 服务的数据结构，确保两个服务返回一致的数据格式。

## 流式响应数据结构对比

### 本地AI (Ollama) 格式

```json
{
  "message": {
    "content": "文本内容"
  },
  "done": false
}
```

### OpenRouter 格式

```json
{
  "message": {
    "content": "文本内容"
  },
  "chunk": 1,
  "done": false
}
```

### 统一格式（推荐）

为了保持一致性，两个服务都应该返回：

```json
{
  "message": {
    "content": "文本内容"
  },
  "chunk": 1,
  "done": false
}
```

## 完成响应数据结构对比

### 本地AI (Ollama) 格式

```json
{
  "message": {
    "content": ""
  },
  "done": true
}
```

### OpenRouter 格式

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

### 统一格式（推荐）

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

## 模型数据结构对比

### 本地AI 模型格式

```json
{
  "name": "llama3.2:3b",
  "size": 1234567890,
  "modified_at": "2024-01-01T00:00:00Z",
  "digest": "sha256:abc123...",
  "details": {
    "format": "gguf",
    "family": "qwen",
    "parameter_size": "7b"
  }
}
```

### OpenRouter 模型格式

```json
{
  "id": "mistralai/mistral-7b-instruct",
  "name": "mistral-7b-instruct",
  "provider": "mistralai",
  "description": "A high-performing, industry-standard 7.3B parameter model",
  "pricing": {
    "prompt": "免费",
    "completion": "免费"
  }
}
```

### 统一格式（推荐）

为了保持一致性，建议统一为：

```json
{
  "id": "llama3.2:3b",
  "name": "llama3.2:3b",
  "provider": "local",
  "description": "当前使用的本地模型",
  "type": "local",
  "details": {
    "size": 1234567890,
    "format": "gguf",
    "family": "qwen",
    "parameter_size": "7b"
  }
}
```

## 当前模型信息对比

### 本地AI 当前模型

```json
{
  "name": "llama3.2:3b",
  "description": "当前使用的本地模型",
  "type": "local"
}
```

### OpenRouter 当前模型

```json
"mistralai/mistral-7b-instruct"
```

### 统一格式（推荐）

```json
{
  "id": "mistralai/mistral-7b-instruct",
  "name": "mistral-7b-instruct",
  "provider": "mistralai",
  "description": "当前使用的OpenRouter模型",
  "type": "openrouter"
}
```

## 错误响应格式

两个服务都应该使用统一的错误格式：

```json
{
  "error": true,
  "code": 500,
  "message": "错误描述信息",
  "details": "详细错误信息（仅在开发环境）"
}
```

## 需要修复的问题

### 1. OpenRouter 服务需要修复

- [ ] 确保流式响应包含 `chunk` 字段
- [ ] 确保完成响应包含 `fullResponse` 字段
- [ ] 统一模型数据结构格式
- [ ] 统一当前模型信息格式

### 2. 本地AI 服务需要修复

- [ ] 添加 `chunk` 字段到流式响应
- [ ] 添加 `fullResponse` 字段到完成响应
- [ ] 统一模型数据结构格式
- [ ] 统一当前模型信息格式

## 修复后的统一格式

### 流式响应

```json
{
  "message": {
    "content": "文本内容"
  },
  "chunk": 1,
  "done": false
}
```

### 完成响应

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

### 模型信息

```json
{
  "id": "模型唯一标识",
  "name": "模型显示名称",
  "provider": "服务提供商",
  "description": "模型描述",
  "type": "模型类型",
  "details": {
    // 额外详细信息
  }
}
```

### 当前模型

```json
{
  "id": "当前模型ID",
  "name": "当前模型名称",
  "provider": "服务提供商",
  "description": "模型描述",
  "type": "模型类型"
}
```

## 实施建议

1. **分阶段修复**: 先修复OpenRouter服务，再修复本地AI服务
2. **向后兼容**: 确保修复后的格式与现有前端兼容
3. **测试验证**: 修复后进行全面测试，确保数据一致性
4. **文档更新**: 更新相关文档，反映新的数据结构 