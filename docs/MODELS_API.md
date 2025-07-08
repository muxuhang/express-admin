# 模型列表接口

## 概述

新增了获取可用模型列表的接口，用于查询当前系统中可用的 Ollama 模型。

## 接口信息

### 获取模型列表

**接口地址**: `GET /api/chat/models`

**请求参数**: 无

**响应格式**:
```json
{
  "code": 0,
  "data": {
    "models": [
      {
        "name": "qwen2.5:7b",
        "size": 4294967296,
        "modified_at": "2024-01-01T12:00:00Z",
        "digest": "sha256:abc123...",
        "details": {}
      }
    ],
    "currentModel": {
      "name": "qwen2.5:7b",
      "description": "当前使用的本地模型",
      "type": "local"
    },
    "timestamp": "2024-01-01T12:00:00Z"
  },
  "message": "获取模型列表成功"
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 响应状态码，0表示成功 |
| data.models | array | 可用模型列表 |
| data.currentModel | object | 当前使用的模型 |
| data.timestamp | string | 响应时间戳 |
| message | string | 响应消息 |

#### 模型对象字段

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 模型名称 |
| size | number | 模型大小（字节） |
| modified_at | string | 最后修改时间 |
| digest | string | 模型摘要 |
| details | object | 模型详细信息 |

#### 当前模型对象字段

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 模型名称 |
| description | string | 模型描述 |
| type | string | 模型类型（local/remote） |

## 使用示例

### JavaScript 示例

```javascript
// 获取模型列表
async function getAvailableModels() {
  try {
    const response = await fetch('/api/chat/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.code === 0) {
      console.log('可用模型:', result.data.models);
      console.log('当前模型:', result.data.currentModel);
      
      // 更新 UI
      updateModelList(result.data.models);
      updateCurrentModel(result.data.currentModel);
    } else {
      console.error('获取模型列表失败:', result.message);
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 格式化模型大小
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

### cURL 示例

```bash
# 获取模型列表
curl -X GET http://localhost:8888/api/chat/models \
  -H "Content-Type: application/json"
```

## 错误处理

### 常见错误

| 错误代码 | 错误信息 | 解决方案 |
|---------|---------|---------|
| 500 | 获取模型列表失败 | 检查 Ollama 服务状态 |
| 503 | 数据库服务暂时不可用 | 检查数据库连接 |
| 503 | Ollama 客户端未初始化 | 重启应用服务 |

### 错误响应格式

```json
{
  "code": 500,
  "message": "获取模型列表失败",
  "error": "Ollama 服务不可用"
}
```

## 测试

### 运行测试

```bash
# 测试模型列表接口
node test-models-api.js
```

### 测试场景

1. **正常情况**: Ollama 服务运行，有可用模型
2. **服务不可用**: Ollama 服务未启动
3. **网络问题**: 无法连接到 Ollama 服务
4. **空列表**: 没有安装任何模型

## 实现细节

### 服务层实现

```javascript
// 获取可用的模型列表
async getAvailableModels() {
  try {
    // 确保 Ollama 客户端已初始化
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.ollama) {
      throw new Error('Ollama 客户端未初始化')
    }

    console.log('获取 Ollama 模型列表...')
    const response = await this.ollama.list()
    
    const models = response.models.map(model => ({
      name: model.name,
      size: model.size,
      modified_at: model.modified_at,
      digest: model.digest,
      details: model.details || {}
    }))

    console.log(\`找到 \${models.length} 个可用模型\`)
    return models
  } catch (error) {
    console.error('获取模型列表失败:', error.message)
    throw new Error(\`获取模型列表失败: \${error.message}\`)
  }
}
```

### 控制器实现

```javascript
// 获取可用的模型列表
getAvailableModels = async (req, res) => {
  try {
    // 检查数据库连接
    this.checkConnection();

    console.log('获取可用模型列表...');

    const models = await localAIChatService.getAvailableModels();

    res.json({
      code: 0,
      data: {
        models: models,
        currentModel: localAIChatService.getCurrentModel(),
        timestamp: new Date().toISOString()
      },
      message: '获取模型列表成功'
    });

  } catch (error) {
    console.error('获取模型列表错误:', error);
    
    res.status(500).json({
      code: 500,
      message: '获取模型列表失败',
      error: error.message
    });
  }
}
```

## 路由配置

```javascript
// 模型相关接口
router.get('/api/chat/models', chatController.getAvailableModels)
```

## 前端集成建议

1. **模型选择器**: 显示可用模型列表，允许用户选择
2. **模型信息**: 显示模型大小、更新时间等详细信息
3. **状态指示**: 显示当前使用的模型
4. **错误处理**: 优雅处理服务不可用等错误情况
5. **缓存机制**: 缓存模型列表，减少重复请求

## 扩展功能

### 未来可能的扩展

1. **模型切换**: 允许用户切换使用的模型
2. **模型下载**: 提供模型下载和安装功能
3. **模型管理**: 删除、更新模型
4. **模型信息**: 显示更详细的模型信息（参数、性能等）
5. **模型推荐**: 根据用户需求推荐合适的模型 