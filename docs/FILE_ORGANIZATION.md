# 文件组织说明

## 📁 整理后的项目结构

项目文件已按照功能分类整理到不同的文件夹中，提高了项目的可维护性和可读性。

### 🗂️ 文件夹结构

```
express-admin/
├── 📚 docs/                    # 项目文档
│   ├── README.md              # 文档索引
│   ├── README_USER_CHAT.md    # 用户聊天功能文档
│   ├── LOCAL_AI_SETUP.md      # 本地AI配置指南
│   ├── OPENROUTER_SETUP.md    # OpenRouter配置指南
│   ├── CHAT_API_STRUCTURE.md  # 聊天API架构
│   ├── SMART_SERVICE_DETECTION.md  # 智能服务检测
│   ├── HISTORY_LOGIC.md       # 历史记录逻辑
│   ├── DATA_STRUCTURE_COMPARISON.md  # 数据结构对比
│   ├── USER_API.md            # 用户管理API
│   ├── ROLE_API.md            # 角色管理API
│   ├── MENU_API.md            # 菜单管理API
│   ├── PUSHER_API.md          # 推送API文档
│   ├── PUSHER_API_SIMPLE.md   # 推送API简化文档
│   ├── PUSH_OPTIMIZATION_SUMMARY.md  # 推送优化总结
│   ├── PUSH_TEST_PLATFORM_GUIDE.md  # 推送测试平台
│   ├── PUSH_TROUBLESHOOTING.md  # 推送问题排查
│   ├── PUSH_SUCCESS_NOTIFICATION.md  # 推送成功通知
│   ├── RECURRING_PUSH_STATUS.md  # 循环推送状态
│   ├── RECURRING_PUSH_FIX.md  # 循环推送修复
│   ├── ROLE_MENUS_API.md      # 角色菜单API
│   ├── LOGIN_ENHANCEMENT.md   # 登录功能增强
│   ├── CAMELCASE_UNIFICATION.md  # 驼峰命名统一
│   ├── TARGET_TYPE_ENHANCEMENT.md  # 目标类型增强
│   ├── MODELS_API.md          # 模型API
│   ├── DOCKER_README.md       # Docker部署指南
│   ├── RETRY_ERROR_HANDLING.md  # 重试错误处理
│   ├── TEST_STRUCTURE.md      # 测试文件结构
│   ├── FILE_ORGANIZATION.md   # 本文档
│   ├── PORT_CHANGE_SUMMARY.md # 端口变更记录
│   ├── ICON_GENERATOR_REMOVAL_SUMMARY.md  # 图标生成器删除记录
│   └── DOCUMENTATION_REORGANIZATION.md  # 文档重新组织总结
├── 🧪 tests/                   # 🧪 测试文件
│   ├── README.md              # 测试文件索引
│   ├── test-user-chat-api.js  # 用户聊天API测试
│   ├── test-chat-api.js       # 基础聊天API测试
│   ├── check-ollama.js        # Ollama服务检查
│   ├── check-models.js        # 模型检查工具
│   ├── diagnose-ollama.js     # Ollama诊断工具
│   ├── debug-tasks.js         # 任务调试工具
│   └── ...                    # 其他测试
├── 🔧 src/                     # 💻 源代码
│   ├── controllers/           # 控制器
│   ├── models/                # 数据模型
│   ├── routes/                # 路由
│   ├── services/              # 服务层
│   ├── middleware/            # 中间件
│   └── ...                    # 其他源码
├── 🐳 Dockerfile*             # 🐳 Docker配置文件
├── 📦 package.json            # 📦 项目配置
└── 🚀 start-*.sh              # 🚀 启动脚本
```

## 📚 文档文件

### 核心功能文档
- `README_USER_CHAT.md` - AI聊天功能完整说明
- `LOCAL_AI_SETUP.md` - 本地AI服务配置指南
- `OPENROUTER_SETUP.md` - OpenRouter服务配置指南
- `CHAT_API_STRUCTURE.md` - 聊天API架构说明
- `SMART_SERVICE_DETECTION.md` - 智能服务检测机制
- `HISTORY_LOGIC.md` - 历史记录逻辑说明
- `DATA_STRUCTURE_COMPARISON.md` - 数据结构对比

### API文档
- `USER_API.md` - 用户管理API
- `ROLE_API.md` - 角色管理API
- `MENU_API.md` - 菜单管理API
- `PUSHER_API.md` - 推送API完整文档
- `PUSHER_API_SIMPLE.md` - 推送API简化文档
- `ROLE_MENUS_API.md` - 角色菜单API
- `MODELS_API.md` - 模型API接口文档

### 推送系统文档
- `PUSH_OPTIMIZATION_SUMMARY.md` - 推送优化总结
- `PUSH_TEST_PLATFORM_GUIDE.md` - 推送测试平台指南
- `PUSH_TROUBLESHOOTING.md` - 推送问题排查指南
- `PUSH_SUCCESS_NOTIFICATION.md` - 推送成功通知文档
- `RECURRING_PUSH_STATUS.md` - 循环推送状态文档
- `RECURRING_PUSH_FIX.md` - 循环推送修复文档

### 系统增强文档
- `LOGIN_ENHANCEMENT.md` - 登录功能增强
- `CAMELCASE_UNIFICATION.md` - 驼峰命名统一
- `TARGET_TYPE_ENHANCEMENT.md` - 目标类型增强

### 部署和运维文档
- `DOCKER_README.md` - Docker部署指南
- `RETRY_ERROR_HANDLING.md` - 重试错误处理机制

### 测试文档
- `TEST_STRUCTURE.md` - 测试文件结构说明

### 项目文档
- `FILE_ORGANIZATION.md` - 本文档
- `PORT_CHANGE_SUMMARY.md` - 端口变更记录
- `ICON_GENERATOR_REMOVAL_SUMMARY.md` - 图标生成器删除记录
- `DOCUMENTATION_REORGANIZATION.md` - 文档重新组织总结

## 🧪 tests/ 文件夹
**包含所有测试文件，按功能分类：**

#### AI聊天功能测试
- `test-user-chat-api.js` - 用户聊天API测试（新增功能）
- `test-chat-api.js` - 基础聊天API测试
- `test-chat-flow.js` - 聊天流程测试
- `test-chat-history.js` - 历史记录测试
- `test-history-logic.js` - 历史记录逻辑测试
- `test-cancel-api.js` - 消息取消功能测试

#### AI服务测试
- `check-ollama.js` - Ollama服务检查
- `diagnose-ollama.js` - Ollama诊断工具
- `test-openrouter.js` - OpenRouter服务测试
- `test-direct-openrouter.js` - 直接OpenRouter测试
- `test-models-api.js` - 模型API测试
- `check-models.js` - 模型检查工具

#### 推送功能测试
- `test-pusher-config.js` - 推送配置测试
- `test-scheduler.js` - 调度器测试
- `test-targets.js` - 推送目标测试
- `debug-tasks.js` - 任务调试工具
- `check-tasks.js` - 任务检查工具

#### 系统工具
- `fix-roles.js` - 角色修复工具
- `test-retry-error.js` - 重试错误处理测试

## 🎯 整理优势

### ✅ 提高可维护性
- **分类清晰** - 按功能分类，便于查找
- **结构统一** - 统一的命名规范和目录结构
- **索引完善** - 每个文件夹都有README索引

### ✅ 提升开发效率
- **快速定位** - 文档和测试文件分类明确
- **示例丰富** - 完整的API使用示例
- **问题排查** - 专门的诊断和修复工具

### ✅ 便于团队协作
- **文档完整** - 详细的功能说明和API文档
- **测试覆盖** - 全面的功能测试和诊断工具
- **部署指南** - 完整的部署和运维文档

## 📖 使用指南

### 🔍 查找文档
```bash
# 查看文档索引
cat docs/README.md

# 查看特定功能文档
cat docs/README_USER_CHAT.md
cat docs/LOCAL_AI_SETUP.md

# 查看用户聊天功能文档
cat docs/README_USER_CHAT.md

# 查看API文档
cat docs/USER_API.md
cat docs/ROLE_API.md
cat docs/MENU_API.md

# 查看推送系统文档
cat docs/PUSHER_API.md
cat docs/PUSH_TROUBLESHOOTING.md

# 查看部署文档
cat docs/DOCKER_README.md
```

### 🧪 运行测试
```bash
# 查看测试索引
cat tests/README.md

# 运行用户聊天测试
node tests/test-user-chat-api.js --all

# 检查服务状态
node tests/check-ollama.js
node tests/check-models.js
```

### 🚀 快速开始
```bash
# 1. 查看项目概述
cat README.md

# 2. 查看详细文档
cat docs/README.md

# 3. 运行功能测试
node tests/test-user-chat-api.js --flow
```

## 📝 维护说明

### 新增文档
- 将新文档放在 `docs/` 文件夹中
- 更新 `docs/README.md` 索引
- 遵循现有的命名规范

### 新增测试
- 将新测试放在 `tests/` 文件夹中
- 更新 `tests/README.md` 索引
- 使用统一的命名规范：
  - `test-*.js` - 功能测试
  - `check-*.js` - 服务检查
  - `diagnose-*.js` - 问题诊断
  - `debug-*.js` - 调试工具
  - `fix-*.js` - 修复工具

### 文件命名规范
- 使用小写字母和连字符
- 功能描述清晰明确
- 保持命名一致性

---

*整理完成时间: 2024年1月* 