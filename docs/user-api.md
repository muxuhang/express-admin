# 用户管理 API 文档

## 概述

用户管理接口提供了完整的用户增删改查功能，支持状态管理、角色分配、权限验证等。

## 数据模型

```javascript
{
  username: String,        // 用户名（必填，唯一）
  password: String,        // 密码（必填，加密存储）
  email: String,           // 邮箱（必填，唯一）
  phone: String,           // 手机号（必填，唯一，11位数字）
  role: String,            // 角色编码（默认user）
  status: String,          // 状态：active/inactive（默认active）
  createdAt: Date,         // 创建时间
  updatedAt: Date,         // 更新时间
  last_login_at: Date      // 最后登录时间
}
```

## 重要说明

- **角色验证**：创建或更新用户时，系统会验证指定的角色是否存在且为启用状态
- **状态管理**：用户可以设置为 `active`（启用）或 `inactive`（停用）
- **停用用户**：停用的用户无法登录系统
- **角色关联**：用户角色与角色管理模块关联，只能分配启用状态的角色

## API 接口

### 1. 获取用户列表

**GET** `/api/users`

**查询参数：**
- `keyword` (可选): 搜索关键词，支持用户名、邮箱、手机号模糊搜索
- `status` (可选): 状态筛选，active 或 inactive
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 10

**响应示例：**
```json
{
  "code": 0,
  "message": "获取用户列表成功",
  "data": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "list": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "username": "admin",
        "email": "admin@example.com",
        "phone": "13800138000",
        "role": "admin",
        "status": "active",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "last_login_at": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 2. 获取可用角色列表

**GET** `/api/users-roles`

**功能：** 获取所有启用状态的角色，用于用户创建/编辑时的角色选择

**响应示例：**
```json
{
  "code": 0,
  "message": "获取角色列表成功",
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "管理员",
      "code": "admin",
      "description": "系统管理员，拥有所有权限"
    },
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "name": "普通用户",
      "code": "user",
      "description": "普通用户，拥有基本权限"
    }
  ]
}
```

### 3. 获取用户详情

**GET** `/api/users/:id`

**响应示例：**
```json
{
  "code": 0,
  "message": "获取用户信息成功",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "username": "admin",
    "email": "admin@example.com",
    "phone": "13800138000",
    "role": "admin",
    "status": "active",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "last_login_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### 4. 创建用户

**POST** `/api/users`

**请求体：**
```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "phone": "13800138001",
  "role": "user",
  "status": "active"
}
```

**注意：** 
- 密码会自动加密存储
- 角色必须是启用状态的角色编码
- 用户名、邮箱、手机号必须唯一

**响应示例：**
```json
{
  "code": 0,
  "message": "创建用户成功",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138001",
    "role": "user",
    "status": "active",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "last_login_at": null
  }
}
```

### 5. 更新用户

**PUT** `/api/users/:id`

**请求体：**
```json
{
  "username": "updateduser",
  "email": "updated@example.com",
  "phone": "13800138002",
  "role": "editor",
  "status": "active"
}
```

**注意：** 
- 不能通过此接口修改密码
- 角色必须是启用状态的角色编码
- 用户名、邮箱、手机号必须唯一

**响应示例：**
```json
{
  "code": 0,
  "message": "更新用户成功",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b5",
    "username": "updateduser",
    "email": "updated@example.com",
    "phone": "13800138002",
    "role": "editor",
    "status": "active",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "last_login_at": null
  }
}
```

### 6. 删除用户

**DELETE** `/api/users/:id`

**响应示例：**
```json
{
  "code": 0,
  "message": "删除用户成功"
}
```

### 7. 启用/停用用户

**PATCH** `/api/users/:id/status`

**请求体：**
```json
{
  "status": "inactive"
}
```

**响应示例：**
```json
{
  "code": 0,
  "message": "用户停用成功",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138001",
    "role": "user",
    "status": "inactive",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "last_login_at": null
  }
}
```

## 错误码说明

- `0`: 成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 资源冲突（如用户名已存在）
- `500`: 服务器内部错误

## 常见错误

1. **用户名已存在**: 创建用户时使用了已存在的用户名
2. **邮箱已存在**: 创建用户时使用了已存在的邮箱
3. **手机号已存在**: 创建用户时使用了已存在的手机号
4. **手机号格式不正确**: 手机号必须是11位数字且以1开头
5. **指定的角色不存在或已被停用**: 尝试分配不存在的角色或已停用的角色
6. **账户已被停用，无权限访问**: 停用的用户尝试登录系统

## 使用示例

### 创建新用户
```javascript
const user = {
  username: 'newuser',
  password: 'password123',
  email: 'newuser@example.com',
  phone: '13800138003',
  role: 'user',
  status: 'active'
}
```

### 搜索用户
```javascript
// 搜索包含"admin"的用户
GET /api/users?keyword=admin

// 获取启用的用户
GET /api/users?status=active

// 分页查询
GET /api/users?page=1&limit=20
```

### 获取可用角色
```javascript
// 获取所有启用状态的角色
GET /api/users-roles
```

## 状态管理说明

### 状态值
- `active`: 启用状态，用户可以正常登录和使用系统
- `inactive`: 停用状态，用户无法登录系统

### 状态影响
- 停用的用户无法通过登录接口获取访问令牌
- 停用的用户无法访问需要认证的接口
- 停用的用户仍然存在于数据库中，可以重新启用

### 状态筛选
- 在用户列表页面可以通过状态筛选查看不同状态的用户
- 在用户管理页面可以批量启用/停用用户

## 角色管理集成

### 角色验证
- 创建或更新用户时，系统会自动验证指定的角色是否存在
- 只能分配启用状态（`status: 'active'`）的角色
- 如果角色不存在或已被停用，会返回错误信息

### 角色选择
- 通过 `/api/users/roles` 接口获取所有可用角色
- 返回的角色信息包含名称、编码和描述
- 前端可以使用这些信息构建角色选择下拉框

### 角色变更
- 当角色被停用时，该角色下的现有用户仍然可以正常使用
- 但不能再为新用户分配已停用的角色
- 建议在停用角色前，先将该角色下的用户迁移到其他角色 