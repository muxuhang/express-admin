# 本地 AI 服务设置指南

本项目支持使用本地 AI 服务，无需依赖在线 API 服务。我们使用 [Ollama](https://ollama.ai/) 来运行本地大语言模型。

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

### 4. 验证安装

```bash
# 检查 Ollama 版本
ollama --version

# 查看已安装的模型
ollama list
```

## ⚙️ 配置说明

### 环境变量

在 `.env` 文件中配置：

```env
# Ollama 本地 AI 服务配置
OLLAMA_HOST=http://localhost:11434
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

#### 获取对话历史

```javascript
// GET /api/chat/history?useLocalAI=true
// 获取本地 AI 的对话历史
```

## 🔍 故障排除

### 常见问题

1. **连接失败**
   ```
   错误：ECONNREFUSED
   解决：确保 Ollama 服务正在运行
   ```

2. **响应慢**
   ```
   解决：
   - 使用更小的模型
   - 增加系统内存
   - 使用 GPU 加速
   ```

3. **内存不足**
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

## 📚 更多资源

- [Ollama 官方文档](https://ollama.ai/docs)
- [社区支持](https://github.com/ollama/ollama/discussions) 