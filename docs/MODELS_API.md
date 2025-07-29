# 模型列表接口

## 概述

新增了获取可用模型列表的接口，用于查询当前系统中可用的 OpenRouter 模型。

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
        "id": "mistralai/mistral-7b-instruct",
        "name": "Mistral 7B Instruct",
        "description": "免费的开源模型",
        "context_length": 8192,
        "pricing": {
          "prompt": "0.00014",
          "completion": "0.00042"
        }
      }
    ],
    "currentModel": {
      "id": "mistralai/mistral-7b-instruct",
      "name": "Mistral 7B Instruct",
      "description": "当前使用的模型",
      "type": "openrouter"
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
| id | string | 模型ID |
| name | string | 模型名称 |
| description | string | 模型描述 |
| context_length | number | 上下文长度 |
| pricing | object | 定价信息 |

#### 当前模型对象字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 模型ID |
| name | string | 模型名称 |
| description | string | 模型描述 |
| type | string | 模型类型（openrouter） |

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
| 500 | 获取模型列表失败 | 检查 OpenRouter 服务状态 |
| 503 | 数据库服务暂时不可用 | 检查数据库连接 |
| 503 | OpenRouter 客户端未初始化 | 重启应用服务 |

### 错误响应格式

```json
{
  "code": 500,
  "message": "获取模型列表失败",
  "error": "OpenRouter 服务不可用"
}
```

## 测试

### 运行测试

```bash
# 测试模型列表接口
node test-models-api.js
```

### 测试场景

1. **正常情况**: OpenRouter 服务运行，有可用模型
2. **服务不可用**: OpenRouter 服务未启动
3. **网络问题**: 无法连接到 OpenRouter 服务
4. **空列表**: 没有可用模型

## 实现细节

### 服务层实现

```javascript
// 获取可用的模型列表
async getAvailableModels() {
  try {
    // 确保 OpenRouter 客户端已初始化
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.apiKey) {
      throw new Error('OpenRouter 客户端未初始化')
    }

    console.log('获取 OpenRouter 模型列表...')
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:8888',
        'X-Title': 'Express Admin Chat'
      }
    })
    
    const data = await response.json()
    const models = data.data.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      context_length: model.context_length,
      pricing: model.pricing
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

    const models = await aiServiceManager.getAvailableModels();

    res.json({
      code: 0,
      data: {
        models: models,
        currentModel: aiServiceManager.getCurrentModel(),
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
2. **模型信息**: 显示模型描述、上下文长度等详细信息
3. **状态指示**: 显示当前使用的模型
4. **错误处理**: 优雅处理服务不可用等错误情况
5. **缓存机制**: 缓存模型列表，减少重复请求

## 扩展功能

### 未来可能的扩展

1. **模型切换**: 允许用户切换使用的模型
2. **模型信息**: 显示更详细的模型信息（参数、性能等）
3. **模型推荐**: 根据用户需求推荐合适的模型
4. **定价信息**: 显示模型使用成本
5. **性能对比**: 不同模型的性能对比 