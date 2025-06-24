# 本地 AI 模型设置指南

本项目支持使用本地 AI 模型，无需依赖在线 API 服务。我们使用 [Ollama](https://ollama.ai/) 来运行本地大语言模型。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 设置 Ollama

```bash
npm run setup-ollama
```

这个命令会：
- 显示针对您操作系统的安装指南
- 自动更新 `.env` 文件配置
- 提供推荐的模型列表

### 3. 安装 Ollama

根据您的操作系统选择安装方式：

#### macOS
```bash
# 访问 https://ollama.ai/download 下载安装包
# 或使用 Homebrew
brew install ollama
```

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
sudo systemctl start ollama
sudo systemctl enable ollama
```

#### Windows
```bash
# 访问 https://ollama.ai/download 下载安装包
```

### 4. 下载模型

```bash
# 下载推荐的模型（中文效果好）
ollama pull qwen2.5:7b

# 或下载其他模型
ollama pull llama3.2:3b
ollama pull qwen2.5:14b
```

### 5. 验证安装

```bash
# 检查 Ollama 版本
ollama --version

# 查看已安装的模型
ollama list

# 测试模型
ollama run qwen2.5:7b "你好"
```

## 📋 推荐模型

| 模型名称 | 大小 | 特点 | 推荐用途 |
|---------|------|------|----------|
| `qwen2.5:7b` | ~4GB | 中文效果好，资源占用适中 | 日常对话，中文问答 |
| `llama3.2:3b` | ~2GB | 英文效果好，资源占用小 | 英文对话，轻量级应用 |
| `qwen2.5:14b` | ~8GB | 效果更好，需要更多资源 | 高质量对话，复杂任务 |
| `llama3.2:8b` | ~5GB | 平衡性能和资源占用 | 通用场景 |

## ⚙️ 配置说明

### 环境变量

在 `.env` 文件中配置：

```env
# Ollama 本地 AI 模型配置
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

### API 使用

#### 发送消息（使用本地 AI）

```javascript
// POST /api/chat/send
{
  "message": "你好，请介绍一下自己",
  "useLocalAI": true,
  "context": "校园管理系统"
}
```

#### 获取模型列表

```javascript
// GET /api/chat/models
// 返回可用的本地模型列表
```

#### 切换模型

```javascript
// POST /api/chat/switch-model
{
  "modelName": "llama3.2:3b"
}
```

#### 获取对话历史

```javascript
// GET /api/chat/history?useLocalAI=true
// 获取本地 AI 的对话历史
```

## 🔧 高级配置

### 自定义模型参数

在 `src/services/localAIChat.js` 中可以调整模型参数：

```javascript
const response = await this.ollama.chat({
  model: this.modelName,
  messages: messages,
  options: {
    temperature: 0.7,    // 创造性（0-1）
    num_predict: 1000,   // 最大生成长度
    top_k: 40,          // 词汇选择范围
    top_p: 0.9,         // 核采样
  }
})
```

### 性能优化

1. **内存优化**：
   - 使用较小的模型（3B-7B）
   - 关闭不必要的系统服务
   - 增加系统内存

2. **响应速度优化**：
   - 使用 SSD 存储
   - 调整 `num_predict` 参数
   - 使用更快的 CPU/GPU

3. **GPU 加速**：
   - 安装 CUDA 驱动（NVIDIA GPU）
   - 安装 Metal 支持（Apple Silicon）
   - 安装 ROCm 支持（AMD GPU）

## 🔍 故障排除

### 常见问题

1. **连接失败**
   ```
   错误：ECONNREFUSED
   解决：确保 Ollama 服务正在运行
   ```

2. **模型不可用**
   ```
   错误：模型不存在
   解决：运行 ollama pull <模型名> 下载模型
   ```

3. **响应慢**
   ```
   解决：
   - 使用更小的模型
   - 增加系统内存
   - 使用 GPU 加速
   ```

4. **内存不足**
   ```
   解决：
   - 关闭其他应用程序
   - 使用更小的模型
   - 增加系统内存
   ```

### 日志查看

```bash
# 查看 Ollama 日志
ollama logs

# 查看应用日志
npm start
```

## 📊 性能对比

| 模型 | 内存占用 | 响应时间 | 质量评分 |
|------|----------|----------|----------|
| qwen2.5:7b | ~4GB | 2-5秒 | ⭐⭐⭐⭐ |
| llama3.2:3b | ~2GB | 1-3秒 | ⭐⭐⭐ |
| qwen2.5:14b | ~8GB | 5-10秒 | ⭐⭐⭐⭐⭐ |
| llama3.2:8b | ~5GB | 3-6秒 | ⭐⭐⭐⭐ |

## 🎯 最佳实践

1. **选择合适的模型**：
   - 开发测试：使用 3B 模型
   - 生产环境：使用 7B-14B 模型
   - 中文场景：优先选择 qwen 系列

2. **资源管理**：
   - 监控内存使用情况
   - 定期清理对话历史
   - 合理设置超时时间

3. **用户体验**：
   - 提供加载状态提示
   - 设置合理的超时时间
   - 提供错误恢复机制

## 📚 更多资源

- [Ollama 官方文档](https://ollama.ai/docs)
- [模型库](https://ollama.ai/library)
- [性能优化指南](https://ollama.ai/docs/performance)
- [社区支持](https://github.com/ollama/ollama/discussions) 