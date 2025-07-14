# Express Admin API 文档

## 概述

Express Admin 系统提供完整的用户管理、角色权限、内容管理等功能API。本文档包含了所有可用的API接口信息。

## 文档文件

- `api-documentation.json` - OpenAPI 3.0格式的API文档，可直接导入到Apifox等工具中
- `apidoc.json` - apidoc配置文件

## 使用方法

### 1. 导入到Apifox

1. 打开Apifox
2. 选择"导入" → "OpenAPI 3.0"
3. 选择 `api-documentation.json` 文件
4. 完成导入后即可使用

### 2. 生成文档

```bash
# 生成API文档JSON文件
npm run api:generate

# 生成apidoc文档（需要先安装apidoc）
npm run docs:generate

# 生成并启动文档服务
npm run docs:serve
```

## API接口分类

### 认证相关
- `POST /api/login` - 用户登录
- `POST /api/register` - 用户注册
- `GET /api/login-logs` - 获取登录日志

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建新用户
- `GET /api/users/{id}` - 获取用户详情
- `PUT /api/users/{id}` - 更新用户信息
- `DELETE /api/users/{id}` - 删除用户

### 角色管理
- `GET /api/roles` - 获取角色列表
- `POST /api/roles` - 创建新角色
- `PUT /api/roles/{id}` - 更新角色
- `DELETE /api/roles/{id}` - 删除角色

### 文章管理
- `GET /api/articles` - 获取文章列表
- `POST /api/articles` - 创建新文章
- `GET /api/articles/{id}` - 获取文章详情
- `PUT /api/articles/{id}` - 更新文章
- `DELETE /api/articles/{id}` - 删除文章

### 聊天功能
- `POST /api/chat/send` - 发送聊天消息
- `GET /api/chat/history` - 获取聊天历史

## 认证方式

大部分API接口需要JWT认证，在请求头中添加：

```
Authorization: Bearer <your-jwt-token>
```

## 响应格式

所有API响应都遵循统一的格式：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}
```

## 错误处理

错误响应格式：

```json
{
  "code": 400,
  "message": "错误信息"
}
```

## 分页参数

支持分页的接口使用以下参数：

- `page` - 页码（默认1）
- `limit` - 每页数量（默认10）

## 搜索参数

支持搜索的接口使用以下参数：

- `keyword` - 搜索关键词
- `status` - 状态筛选
- `category` - 分类筛选

## 开发环境

- 服务器地址：`http://localhost:3000`
- 数据库：MongoDB
- 认证：JWT

## 更新文档

当API接口发生变化时，请运行以下命令更新文档：

```bash
npm run api:generate
```

这将重新生成 `api-documentation.json` 文件。 