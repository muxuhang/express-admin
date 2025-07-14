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
│   ├── README_USER_CHAT.md    # 用户聊天功能文档
│   ├── LOCAL_AI_SETUP.md      # 本地AI配置指南
│   ├── OPENROUTER_SETUP.md    # OpenRouter配置指南
│   └── ...                    # 其他文档
├── 🧪 tests/                   # 测试文件
│   ├── unit/                  # 单元测试
│   ├── integration/           # 集成测试
│   ├── manual/                # 手动测试
│   └── scripts/               # 测试脚本
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
# 运行所有测试
npm test

# 运行特定类型测试
npm run test:unit
npm run test:integration
npm run test:manual
```

## 📖 文档导航

### 🎯 新用户入门
- **[项目文档](./docs/README.md)** - 完整的文档索引
- **[用户聊天功能](./docs/README_USER_CHAT.md)** - AI聊天使用指南
- **[本地AI配置](./docs/LOCAL_AI_SETUP.md)** - Ollama服务配置
- **[OpenRouter配置](./docs/OPENROUTER_SETUP.md)** - 云端AI服务配置

### 🔧 开发者指南
- **[API架构](./docs/CHAT_API_STRUCTURE.md)** - 系统架构说明
- **[用户管理API](./docs/USER_API.md)** - 用户管理接口
- **[角色权限API](./docs/ROLE_API.md)** - 角色权限接口
- **[菜单API](./docs/MENU_API.md)** - 菜单管理接口
- **[推送API](./docs/PUSHER_API.md)** - 推送系统接口

### 🧪 测试文档
- **[测试结构说明](./docs/TEST_STRUCTURE.md)** - 测试文件组织
- **[测试运行指南](./docs/TEST_STRUCTURE.md#运行测试)** - 如何运行测试

### 🚀 部署运维
- **[Docker部署](./docs/DOCKER_README.md)** - 容器化部署指南
- **[推送通知](./docs/PUSHER_API.md)** - 推送系统文档
- **[问题排查](./docs/PUSH_TROUBLESHOOTING.md)** - 故障排除指南
- **[推送测试平台](./docs/PUSH_TEST_PLATFORM_GUIDE.md)** - 推送测试指南

### 📋 项目文档
- **[文件组织](./docs/FILE_ORGANIZATION.md)** - 项目文件结构说明
- **[端口变更](./docs/PORT_CHANGE_SUMMARY.md)** - 端口配置变更记录
- **[功能删除记录](./docs/ICON_GENERATOR_REMOVAL_SUMMARY.md)** - 图标生成器删除记录

### 🔧 技术文档
- **[智能服务检测](./docs/SMART_SERVICE_DETECTION.md)** - 服务自动检测机制
- **[重试错误处理](./docs/RETRY_ERROR_HANDLING.md)** - 错误重试机制
- **[历史记录逻辑](./docs/HISTORY_LOGIC.md)** - 聊天历史管理
- **[数据结构对比](./docs/DATA_STRUCTURE_COMPARISON.md)** - 数据结构说明
- **[模型API](./docs/MODELS_API.md)** - AI模型管理接口

### 🚀 部署和优化
- **[推送优化总结](./docs/PUSH_OPTIMIZATION_SUMMARY.md)** - 推送系统优化
- **[目标类型增强](./docs/TARGET_TYPE_ENHANCEMENT.md)** - 推送目标类型
- **[循环推送状态](./docs/RECURRING_PUSH_STATUS.md)** - 循环推送管理
- **[循环推送修复](./docs/RECURRING_PUSH_FIX.md)** - 推送问题修复
- **[推送成功通知](./docs/PUSH_SUCCESS_NOTIFICATION.md)** - 推送成功处理

### 🔧 系统增强
- **[角色菜单API](./docs/ROLE_MENUS_API.md)** - 角色菜单管理
- **[登录增强](./docs/LOGIN_ENHANCEMENT.md)** - 登录功能增强
- **[驼峰命名统一](./docs/CAMELCASE_UNIFICATION.md)** - 代码命名规范

## 🧪 测试指南

### 功能测试
```bash
# 查看测试文档
cat docs/TEST_STRUCTURE.md

# 运行测试
npm test                    # 运行所有测试
npm run test:unit          # 单元测试
npm run test:integration   # 集成测试
npm run test:manual        # 手动测试
```

### 服务检查
```bash
# 检查AI服务
node tests/scripts/check-ollama.js
node tests/scripts/check-models.js

# 检查推送服务
node tests/scripts/check-tasks.js
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