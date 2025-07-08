# Docker 部署指南

本项目支持使用 Docker 进行开发和生产环境部署。

## 📁 项目结构

```
express-admin/          # 后端项目
├── docker-compose.dev.yml    # 开发环境配置
├── docker-compose.prod.yml   # 生产环境配置
├── Dockerfile.dev            # 后端开发版Dockerfile
├── Dockerfile.prod           # 后端生产版Dockerfile
├── Dockerfile.nginx          # Nginx Dockerfile
├── nginx.conf               # Nginx配置
├── start-dev.sh             # 开发环境启动脚本
└── start-prod.sh            # 生产环境启动脚本

cacti-admin/             # 前端项目
├── Dockerfile.dev        # 前端开发版Dockerfile
├── Dockerfile.prod       # 前端生产版Dockerfile
└── nginx.conf           # 前端Nginx配置
```

## 🚀 快速开始

### 开发环境

开发环境支持热重载，适合日常开发使用。

```bash
# 启动开发环境
./start-dev.sh

# 或者手动启动
docker-compose -f docker-compose.dev.yml up --build -d
```

**访问地址：**
- 前端: http://localhost:3333
- 后端: http://localhost:8888
- MongoDB管理: http://localhost:8081
- Ollama: http://localhost:11434

### 生产环境

生产环境使用优化配置，适合部署到服务器。

```bash
# 启动生产环境
./start-prod.sh

# 或者手动启动
docker-compose -f docker-compose.prod.yml up --build -d
```

**访问地址：**
- 前端: http://localhost
- 后端API: http://localhost/api
- MongoDB管理: http://localhost:8081
- Ollama: http://localhost:11434

## 🔧 服务说明

### 开发环境服务

1. **backend** - Express.js 后端服务
   - 端口: 8888
   - 支持热重载
   - 挂载源代码目录

2. **frontend** - React 前端服务
   - 端口: 3333
   - 支持热重载
   - 挂载源代码目录

3. **mongo** - MongoDB 数据库
   - 端口: 27017
   - 数据持久化到 `./db2`

4. **mongo-express** - MongoDB 管理界面
   - 端口: 8081
   - 用户名: root
   - 密码: example

5. **ollama** - AI 服务
   - 端口: 11434
   - 内存限制: 6GB
   - CPU限制: 2核

### 生产环境服务

1. **backend** - Express.js 后端服务
   - 端口: 8888
   - 生产优化配置
   - 非root用户运行

2. **nginx** - Nginx 反向代理
   - 端口: 80, 443
   - 提供前端静态文件
   - 代理后端API请求
   - 支持WebSocket

3. **mongo** - MongoDB 数据库
   - 端口: 27017
   - 数据持久化到 `./db2`

4. **mongo-express** - MongoDB 管理界面
   - 端口: 8081

5. **ollama** - AI 服务
   - 端口: 11434

## 📝 常用命令

### 查看服务状态
```bash
# 开发环境
docker-compose -f docker-compose.dev.yml ps

# 生产环境
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.dev.yml logs -f backend

# 生产环境
docker-compose -f docker-compose.prod.yml logs -f
```

### 停止服务
```bash
# 开发环境
docker-compose -f docker-compose.dev.yml down

# 生产环境
docker-compose -f docker-compose.prod.yml down
```

### 重新构建
```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up --build -d

# 生产环境
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🔧 配置说明

### 环境变量

开发环境和生产环境的主要区别：

| 环境变量 | 开发环境 | 生产环境 |
|---------|---------|---------|
| NODE_ENV | development | production |
| 热重载 | 启用 | 禁用 |
| 代码挂载 | 是 | 否 |
| 优化级别 | 低 | 高 |

### 端口配置

| 服务 | 开发环境端口 | 生产环境端口 |
|------|-------------|-------------|
| 前端 | 3333 | 80 |
| 后端 | 8888 | 8888 (内部) |
| MongoDB | 27017 | 27017 |
| MongoDB管理 | 8081 | 8081 |
| Ollama | 11434 | 11434 |

## 🛠️ 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3333
   lsof -i :8888
   
   # 修改docker-compose文件中的端口映射
   ```

2. **权限问题**
   ```bash
   # 给脚本添加执行权限
   chmod +x start-dev.sh start-prod.sh
   ```

3. **内存不足**
   ```bash
   # 调整Ollama内存限制
   # 编辑docker-compose文件中的deploy.resources.limits.memory
   ```

4. **构建失败**
   ```bash
   # 清理Docker缓存
   docker system prune -a
   
   # 重新构建
   docker-compose -f docker-compose.dev.yml build --no-cache
   ```

### 日志查看

```bash
# 查看所有容器日志
docker-compose -f docker-compose.dev.yml logs

# 查看特定服务日志
docker-compose -f docker-compose.dev.yml logs backend

# 实时查看日志
docker-compose -f docker-compose.dev.yml logs -f
```

## 🔒 安全建议

1. **生产环境**
   - 修改默认密码
   - 启用HTTPS
   - 配置防火墙
   - 定期更新镜像

2. **数据库安全**
   - 使用强密码
   - 限制网络访问
   - 定期备份数据

3. **API安全**
   - 启用CORS
   - 配置速率限制
   - 使用JWT认证

## 📚 更多信息

- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [MongoDB Docker 镜像](https://hub.docker.com/_/mongo)
- [Ollama 文档](https://ollama.ai/docs) 