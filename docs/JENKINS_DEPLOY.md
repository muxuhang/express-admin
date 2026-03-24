# cacti-api Jenkins 部署指南

## 前置条件

1. **Jenkins 服务器** 需安装：
   - Docker
   - Docker Compose
   - Node.js 16+（用于 npm ci）

2. **Jenkins 插件**：
   - Pipeline
   - Docker Pipeline（可选，用于构建镜像）

## 创建 Jenkins 任务

### 1. 新建 Pipeline 任务

1. 登录 Jenkins → 新建任务
2. 输入任务名称（如 `cacti-api`）
3. 选择「流水线」
4. 确定

### 2. 配置流水线

**流水线** 配置：

- **定义**：Pipeline script from SCM
- **SCM**：Git
- **仓库 URL**：填写 CRM 项目 Git 地址
- **凭据**：添加 Git 访问凭据
- **分支**：`*/main` 或 `*/master`
- **脚本路径**：`cacti-api/Jenkinsfile`

### 3. 环境变量（可选）

在 Jenkins 任务配置 → 参数化构建 中，Jenkinsfile 已定义：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| DEPLOY_ENV | 部署环境 | staging |
| IMAGE_TAG | Docker 镜像标签 | latest |
| SKIP_TESTS | 是否跳过测试 | false |

## 流水线阶段说明

1. **检出代码**：从 Git 拉取最新代码
2. **安装依赖**：在 cacti-api 目录执行 `npm ci`
3. **代码检查**：执行 `npm run lint`（可跳过）
4. **构建 Docker 镜像**：使用 Dockerfile.prod 构建
5. **部署**：执行 `docker-compose -f docker-compose.prod.yml up -d --build backend`

## 部署说明

- 部署会启动 **MongoDB** 和 **cacti-api 后端**（backend 依赖 mongo）
- MongoDB 数据卷：`./db2`（相对于 cacti-api 目录）
- 后端服务端口：**8888**
- 生产环境变量需在部署服务器上的 docker-compose 或 `.env` 中配置

## 部署到远程服务器

若需通过 SSH 部署到远程机器，可在 Jenkinsfile 中增加阶段，例如：

```groovy
stage('远程部署') {
    steps {
        sshagent(credentials: ['your-ssh-credentials-id']) {
            sh '''
                ssh user@deploy-server "
                    cd /opt/cacti-api &&
                    git pull &&
                    docker-compose -f docker-compose.prod.yml up -d --build backend
                "
            '''
        }
    }
}
```

或使用 Jenkins 的「Remote Agent」在目标服务器上执行流水线。

## 常用配置

### 使用 .env 配置环境变量

在 cacti-api 目录创建 `.env`（不要提交到 Git）：

```env
MONGODB_URI=mongodb://root:your_password@mongo:27017/admin?authSource=admin
NODE_ENV=production
```

docker-compose 会自动加载同目录下的 `.env`。

### 自定义构建

在 Jenkins 任务中可增加构建后操作，例如：
- 归档构建产物
- 发送邮件/钉钉通知
- 触发下游任务
