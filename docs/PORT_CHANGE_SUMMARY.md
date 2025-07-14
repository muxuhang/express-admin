# 端口号更改总结

## 概述

已将项目的默认端口从 `3000` 更改为 `8888`。

## 更改的文件

### 核心配置文件
- `src/mongodb.js` - 数据库连接配置中的默认端口
- `src/services/openRouterService.js` - OpenRouter服务中的默认端口
- `scripts/setup-env.js` - 环境配置模板中的默认端口
- `scripts/start-project.js` - 项目启动脚本中的端口说明

### 其他测试和示例文件
- `examples/pusher-usage.js` - Pusher使用示例中的基础URL
- `tests/test-targets.js` - 测试文件中的基础URL
- `tests/check-models.js` - 模型检查脚本中的默认端口
- `test-openrouter-key.js` - OpenRouter测试脚本中的默认端口

### 文档文件
- `docs/PUSHER_API.md` - Pusher API文档
- `docs/OPENROUTER_SETUP.md` - OpenRouter设置文档
- `docs/PUSH_TROUBLESHOOTING.md` - 推送故障排除文档

## 访问地址

### 主要服务
- **推送测试页面**: http://localhost:8888/pusher-test.html
- **API基础地址**: http://localhost:8888

### API端点
- **推送API**: POST http://localhost:8888/api/pusher/push

## 环境变量

如果需要自定义端口，可以通过环境变量设置：

```bash
export PORT=8888
```

或者在 `.env` 文件中：

```bash
PORT=8888
```

## 注意事项

1. **Docker服务**: 确保端口8888未被其他服务占用
2. **防火墙**: 如果使用防火墙，需要开放8888端口
3. **反向代理**: 如果使用Nginx等反向代理，需要更新配置
4. **开发环境**: 开发工具中的端口配置也需要相应更新

## 验证更改

启动服务后，可以通过以下方式验证端口更改：

```bash
# 检查服务是否在8888端口运行
curl http://localhost:8888/api/health
```

## 回滚

如果需要回滚到3000端口，只需要：

1. 设置环境变量：`export PORT=3000`
2. 或者在 `.env` 文件中设置：`PORT=3000`
3. 重启服务

## 更新日志

- **2024-01-XX**: 将默认端口从3000更改为8888
- 更新了所有相关的配置文件、文档和示例代码 