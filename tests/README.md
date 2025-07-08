# 测试文件索引

## 🧪 测试文件分类

### 💬 AI聊天功能测试

#### 核心聊天功能
- **[test-user-chat-api.js](./test-user-chat-api.js)** - 用户聊天API测试脚本
  - 演示无需登录的AI聊天功能
  - 用户ID生成和管理
  - 会话管理和历史记录
  - 完整的API调用示例

- **[test-chat-api.js](./test-chat-api.js)** - 聊天API基础测试
- **[test-chat-flow.js](./test-chat-flow.js)** - 聊天流程测试
- **[test-simple.js](./test-simple.js)** - 简单聊天测试

#### 历史记录测试
- **[test-chat-history.js](./test-chat-history.js)** - 聊天历史记录测试
- **[test-history-logic.js](./test-history-logic.js)** - 历史记录逻辑测试

#### 消息取消功能
- **[test-cancel-api.js](./test-cancel-api.js)** - 消息取消API测试

### 🤖 AI服务测试

#### 本地AI服务
- **[check-ollama.js](./check-ollama.js)** - Ollama服务检查
- **[diagnose-ollama.js](./diagnose-ollama.js)** - Ollama诊断工具

#### OpenRouter服务
- **[test-openrouter.js](./test-openrouter.js)** - OpenRouter服务测试
- **[test-direct-openrouter.js](./test-direct-openrouter.js)** - 直接OpenRouter测试
- **[test-api-call.js](./test-api-call.js)** - API调用测试

#### 模型管理
- **[test-models-api.js](./test-models-api.js)** - 模型API测试
- **[check-models.js](./check-models.js)** - 模型检查工具
- **[test-model-id-fix.js](./test-model-id-fix.js)** - 模型ID修复测试

### 🔄 错误处理和重试
- **[test-retry-error.js](./test-retry-error.js)** - 重试错误处理测试

### 📱 推送通知测试

#### 推送配置和调度
- **[test-pusher-config.js](./test-pusher-config.js)** - 推送配置测试
- **[test-scheduler.js](./test-scheduler.js)** - 调度器测试
- **[test-targets.js](./test-targets.js)** - 推送目标测试

#### 任务管理
- **[debug-tasks.js](./debug-tasks.js)** - 任务调试工具
- **[check-tasks.js](./check-tasks.js)** - 任务检查工具

### 🔧 系统修复工具
- **[fix-roles.js](./fix-roles.js)** - 角色修复工具

## 🚀 快速开始

### 基础功能测试
```bash
# 测试用户聊天功能
node tests/test-user-chat-api.js --all

# 测试基础聊天API
node tests/test-chat-api.js

# 检查Ollama服务
node tests/check-ollama.js
```

### AI服务测试
```bash
# 测试OpenRouter服务
node tests/test-openrouter.js

# 检查模型列表
node tests/check-models.js

# 测试模型API
node tests/test-models-api.js
```

### 推送功能测试
```bash
# 测试推送配置
node tests/test-pusher-config.js

# 检查任务状态
node tests/check-tasks.js

# 调试任务问题
node tests/debug-tasks.js
```

## 📋 测试分类说明

### 🔍 诊断工具
- `check-*.js` - 服务状态检查工具
- `diagnose-*.js` - 问题诊断工具
- `debug-*.js` - 调试工具

### 🧪 功能测试
- `test-*.js` - 功能测试脚本
- 包含API测试、流程测试、集成测试

### 🔧 修复工具
- `fix-*.js` - 数据修复工具
- 用于修复数据库中的问题数据

## 📝 测试编写规范

### 测试文件命名
- 功能测试：`test-{功能名}.js`
- 检查工具：`check-{服务名}.js`
- 诊断工具：`diagnose-{问题}.js`
- 修复工具：`fix-{问题}.js`

### 测试内容要求
- 清晰的测试目的说明
- 完整的错误处理
- 详细的日志输出
- 可重复执行的测试

### 测试运行环境
- 确保数据库连接正常
- 检查相关服务状态
- 验证API密钥配置
- 确认网络连接正常

## 🔧 常用测试命令

### 服务检查
```bash
# 检查所有服务状态
node tests/check-ollama.js
node tests/check-models.js
node tests/check-tasks.js
```

### 功能验证
```bash
# 验证聊天功能
node tests/test-user-chat-api.js --flow
node tests/test-chat-api.js

# 验证推送功能
node tests/test-pusher-config.js
node tests/test-targets.js
```

### 问题诊断
```bash
# 诊断Ollama问题
node tests/diagnose-ollama.js

# 调试任务问题
node tests/debug-tasks.js
```

---

*最后更新: 2024年1月* 