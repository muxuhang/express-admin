# 角色管理 API 文档

## 概述

角色管理接口提供了完整的角色增删改查功能，支持状态管理、权限分配、系统角色保护等。

## 默认角色

系统会在首次启动时自动创建以下默认角色：

1. **管理员** - code: `admin`, 权限: `['*']`, 状态: `active`
2. **普通用户** - code: `user`, 权限: `['view_profile', 'edit_profile']`, 状态: `active`

## 数据模型

```javascript
{
  name: String,           // 角色名称（必填）
  code: String,           // 角色编码（必填，唯一）
  description: String,    // 角色描述（可选）
  permissions: [String],  // 权限列表（可选）
  status: String,         // 状态：active/inactive（默认active）
  is_system: Boolean,     // 是否为系统角色（默认false）
  created_at: Date,       // 创建时间
  updated_at: Date        // 更新时间
}
```

## 重要说明

- **系统角色保护**：系统角色（`is_system: true`）不能被修改、停用或删除
- **状态管理**：角色可以设置为 `active`（启用）或 `inactive`（停用）
- **权限字段**：使用字符串数组存储权限标识，`['*']` 表示所有权限
- **编码唯一性**：角色编码必须唯一，用于系统内部标识

## API 接口

### 1. 获取角色列表

**GET** `/api/roles`

**查询参数：**
- `keyword` (可选): 搜索关键词，支持角色名称、编码模糊搜索
- `status` (可选): 状态筛选，active 或 inactive
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 10

**响应示例：**
```json
{
  "code": 0,
  "message": "获取角色列表成功",
  "data": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "list": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "管理员",
        "code": "admin",
        "description": "系统管理员，拥有所有权限",
        "permissions": ["*"],
        "status": "active",
        "is_system": true,
        "created_at": "2023-01-01T00:00:00.000Z",
        "updated_at": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 2. 获取所有角色（用于下拉选择）

**GET** `/api/roles/all`

**查询参数：**
- `status` (可选): 状态筛选，active 或 inactive。如果不传此参数，默认只返回启用状态的角色

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
      "description": "系统管理员，拥有所有权限",
      "status": "active"
    },
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "name": "普通用户",
      "code": "user",
      "description": "普通用户，拥有基本权限",
      "status": "active"
    }
  ]
}
```

**使用示例：**
```javascript
// 获取所有启用状态的角色（默认行为）
GET /api/roles/all

// 获取所有角色（包括禁用状态）
GET /api/roles/all?status=all

// 只获取禁用状态的角色
GET /api/roles/all?status=inactive
```

### 3. 创建角色

**POST** `/api/roles`

**请求体：**
```json
{
  "name": "编辑员",
  "code": "editor",
  "description": "内容编辑员，拥有编辑权限",
  "permissions": ["view_content", "edit_content", "publish_content"],
  "status": "active"
}
```

**响应示例：**
```json
{
  "code": 0,
  "message": "创建角色成功",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "name": "编辑员",
    "code": "editor",
    "description": "内容编辑员，拥有编辑权限",
    "permissions": ["view_content", "edit_content", "publish_content"],
    "status": "active",
    "is_system": false,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### 4. 更新角色

**PUT** `/api/roles/:id`

**请求体：**
```json
{
  "name": "高级编辑员",
  "description": "高级内容编辑员，拥有更多编辑权限",
  "permissions": ["view_content", "edit_content", "publish_content", "delete_content"],
  "status": "active"
}
```

**注意：** 系统角色不能被修改

**响应示例：**
```json
{
  "code": 0,
  "message": "更新角色成功",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "name": "高级编辑员",
    "code": "editor",
    "description": "高级内容编辑员，拥有更多编辑权限",
    "permissions": ["view_content", "edit_content", "publish_content", "delete_content"],
    "status": "active",
    "is_system": false,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### 5. 启用/停用角色

**PATCH** `/api/roles/:id/status`

**请求体：**
```json
{
  "status": "inactive"
}
```

**注意：** 系统角色不能被停用

**响应示例：**
```json
{
  "code": 0,
  "message": "角色停用成功",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "name": "高级编辑员",
    "code": "editor",
    "description": "高级内容编辑员，拥有更多编辑权限",
    "permissions": ["view_content", "edit_content", "publish_content", "delete_content"],
    "status": "inactive",
    "is_system": false,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### 6. 删除角色

**DELETE** `/api/roles/:id`

**注意：** 
- 系统角色不能删除
- 如果角色下还有用户，则无法删除

**响应示例：**
```json
{
  "code": 0,
  "message": "删除角色成功"
}
```

### 7. 初始化默认角色

**POST** `/api/roles/init`

**权限要求：** 仅管理员可访问

**功能：** 重新初始化系统默认角色（如果数据库中已有角色数据，则不会重复创建）

**响应示例：**
```json
{
  "code": 0,
  "message": "默认角色初始化成功",
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "管理员",
      "code": "admin",
      "description": "系统管理员，拥有所有权限",
      "permissions": ["*"],
      "status": "active",
      "is_system": true
    },
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "name": "普通用户",
      "code": "user",
      "description": "普通用户，拥有基本权限",
      "permissions": ["view_profile", "edit_profile"],
      "status": "active",
      "is_system": true
    }
  ]
}
```

## 错误码说明

- `0`: 成功
- `400`: 请求参数错误
- `403`: 权限不足（如尝试修改系统角色）
- `404`: 资源不存在
- `500`: 服务器内部错误

## 常见错误

1. **角色编码已存在**: 创建角色时使用了已存在的编码
2. **系统角色不能修改**: 尝试修改系统角色的任何属性
3. **系统角色不能停用**: 尝试停用系统角色
4. **系统角色不能删除**: 尝试删除系统角色
5. **该角色下还有用户，不能删除**: 删除前需要先移除该角色下的所有用户

## 使用示例

### 创建新角色
```javascript
const role = {
  name: '编辑员',
  code: 'editor',
  description: '内容编辑员，拥有编辑权限',
  permissions: ['view_content', 'edit_content', 'publish_content'],
  status: 'active'
}
```

### 搜索角色
```javascript
// 搜索包含"管理"的角色
GET /api/roles?keyword=管理

// 获取启用的角色
GET /api/roles?status=active

// 分页查询
GET /api/roles?page=1&limit=20
```

### 停用角色
```javascript
// 停用角色
PATCH /api/roles/:id/status
{
  "status": "inactive"
}

// 重新启用角色
PATCH /api/roles/:id/status
{
  "status": "active"
}
```

### 常用权限标识
```javascript
// 用户相关权限
'view_profile'      // 查看个人资料
'edit_profile'      // 编辑个人资料
'view_users'        // 查看用户列表
'edit_users'        // 编辑用户信息
'delete_users'      // 删除用户

// 角色相关权限
'view_roles'        // 查看角色列表
'edit_roles'        // 编辑角色信息
'delete_roles'      // 删除角色

// 菜单相关权限
'view_menus'        // 查看菜单列表
'edit_menus'        // 编辑菜单信息
'delete_menus'      // 删除菜单

// 内容相关权限
'view_content'      // 查看内容
'edit_content'      // 编辑内容
'publish_content'   // 发布内容
'delete_content'    // 删除内容

// 系统权限
'*'                 // 所有权限（管理员专用）
```

### 初始化默认角色
```javascript
// 管理员权限
POST /api/roles/init
```

## 状态管理说明

### 状态值
- `active`: 启用状态，角色可以正常使用
- `inactive`: 停用状态，角色暂时不可用

### 状态影响
- 停用的角色不会在用户创建/编辑时的角色选择列表中显示
- 停用的角色下的用户仍然可以正常使用，但不能再分配给新用户
- 系统角色（管理员、普通用户）不能被停用

### 状态筛选
- 在角色列表页面可以通过状态筛选查看不同状态的角色
- 在用户管理页面选择角色时，默认只显示启用状态的角色 