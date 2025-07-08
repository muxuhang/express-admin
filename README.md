# Express Admin - AI聊天管理系统

一个基于Express.js的现代化AI聊天管理系统，支持本地AI和云端AI服务，提供完整的用户管理、角色权限、推送通知等功能。

## 🚀 核心特性

- 🤖 **多AI服务支持** - 本地Ollama + OpenRouter云端服务
- 💬 **智能聊天系统** - 流式响应、会话管理、历史记录
- 👥 **用户权限管理** - 角色、菜单、权限控制
- 📱 **推送通知系统** - 实时消息推送
- 🐳 **Docker部署** - 完整的容器化部署方案
- 📊 **数据持久化** - MongoDB数据库存储

## 📁 项目结构

```
express-admin/
├── 📚 docs/                    # 项目文档
│   ├── README.md              # 文档索引
│   ├── README-USER-CHAT.md    # 用户聊天功能文档
│   ├── LOCAL_AI_SETUP.md      # 本地AI配置指南
│   ├── OPENROUTER_SETUP.md    # OpenRouter配置指南
│   └── ...                    # 其他文档
├── 🧪 tests/                   # 测试文件
│   ├── README.md              # 测试文件索引
│   ├── test-user-chat-api.js  # 用户聊天API测试
│   ├── check-ollama.js        # Ollama服务检查
│   └── ...                    # 其他测试
├── 🔧 src/                     # 源代码
│   ├── controllers/           # 控制器
│   ├── models/                # 数据模型
│   ├── routes/                # 路由
│   ├── services/              # 服务层
│   └── middleware/            # 中间件
├── 🐳 Dockerfile*             # Docker配置文件
├── 📦 package.json            # 项目配置
└── 🚀 start-*.sh              # 启动脚本
```

## 🎯 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd express-admin

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库和API密钥
```

### 2. 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm start

# Docker部署
docker-compose up -d
```

### 3. 功能测试

```bash
# 测试用户聊天功能
node tests/test-user-chat-api.js --all

# 检查AI服务状态
node tests/check-ollama.js
node tests/check-models.js
```

## 📖 文档导航

### 🎯 新用户入门
- **[项目文档](./docs/README.md)** - 完整的文档索引
- **[用户聊天功能](./docs/README-USER-CHAT.md)** - AI聊天使用指南
- **[本地AI配置](./docs/LOCAL_AI_SETUP.md)** - Ollama服务配置

### 🔧 开发者指南
- **[API架构](./docs/CHAT_API_STRUCTURE.md)** - 系统架构说明
- **[用户管理API](./docs/user-api.md)** - 用户管理接口
- **[角色权限API](./docs/role-api.md)** - 角色权限接口

### 🚀 部署运维
- **[Docker部署](./docs/DOCKER_README.md)** - 容器化部署指南
- **[推送通知](./docs/pusher-api.md)** - 推送系统文档
- **[问题排查](./docs/PUSH_TROUBLESHOOTING.md)** - 故障排除指南

## 🧪 测试指南

### 功能测试
```bash
# 查看测试文件索引
cat tests/README.md

# 运行特定测试
node tests/test-user-chat-api.js --flow
node tests/test-chat-api.js
```

### 服务检查
```bash
# 检查AI服务
node tests/check-ollama.js
node tests/check-models.js

# 检查推送服务
node tests/check-tasks.js
```

## 🔧 主要功能

### 💬 AI聊天系统
- **无需登录** - 通过用户ID识别用户
- **会话管理** - 支持多会话和会话历史
- **流式响应** - 实时显示AI回复
- **多服务支持** - 本地Ollama + OpenRouter

### 👥 用户管理系统
- **用户管理** - 用户CRUD操作
- **角色权限** - 基于角色的权限控制
- **菜单管理** - 动态菜单配置

### 📱 推送通知
- **实时推送** - WebSocket + Pusher
- **定时任务** - 循环推送和状态更新
- **多平台支持** - Web、移动端推送

## 🛠️ 技术栈

- **后端**: Node.js + Express.js
- **数据库**: MongoDB + Mongoose
- **AI服务**: Ollama (本地) + OpenRouter (云端)
- **推送**: Pusher + WebSocket
- **部署**: Docker + Docker Compose
- **测试**: Jest + 自定义测试脚本

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

*更多详细信息请查看 [docs/README.md](./docs/README.md)* 