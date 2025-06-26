# 角色菜单权限 API 文档

## 概述

本文档描述了角色菜单权限管理的API接口，用于获取和更新角色可以访问的菜单权限。

## 接口列表

### 1. 获取角色菜单权限

**接口地址：** `GET /api/roles/:id/menus`

**请求参数：**
- `id` (路径参数): 角色ID

**请求头：**
```
Authorization: Bearer YOUR_TOKEN
```

**响应示例：**
```json
{
  "code": 0,
  "message": "获取角色菜单权限成功",
  "data": {
    "roleId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "roleName": "管理员",
    "menuIds": [
      "64f8a1b2c3d4e5f6a7b8c9d1",
      "64f8a1b2c3d4e5f6a7b8c9d2"
    ],
    "menus": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "label": "用户管理",
        "key": "64f8a1b2c3d4e5f6a7b8c9d1",
        "path": "/users",
        "parentId": null,
        "order": 2,
        "icon": "UserOutlined",
        "status": "active",
        "createdAt": "2023-09-06T10:00:00.000Z",
        "updatedAt": "2023-09-06T10:00:00.000Z"
      }
    ]
  }
}
```

### 2. 更新角色菜单权限

**接口地址：** `PUT /api/roles/:id/menus`

**请求参数：**
- `id` (路径参数): 角色ID

**请求头：**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**请求体：**
```json
{
  "menuIds": [
    "64f8a1b2c3d4e5f6a7b8c9d1",
    "64f8a1b2c3d4e5f6a7b8c9d2",
    "64f8a1b2c3d4e5f6a7b8c9d3"
  ]
}
```

**响应示例：**
```json
{
  "code": 0,
  "message": "更新角色菜单权限成功",
  "data": {
    "roleId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "roleName": "管理员",
    "menuIds": [
      "64f8a1b2c3d4e5f6a7b8c9d1",
      "64f8a1b2c3d4e5f6a7b8c9d2",
      "64f8a1b2c3d4e5f6a7b8c9d3"
    ],
    "menus": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "label": "用户管理",
        "key": "64f8a1b2c3d4e5f6a7b8c9d1",
        "path": "/users",
        "parentId": null,
        "order": 2,
        "icon": "UserOutlined",
        "status": "active",
        "createdAt": "2023-09-06T10:00:00.000Z",
        "updatedAt": "2023-09-06T10:00:00.000Z"
      }
    ]
  }
}
```

## 错误响应

### 404 - 角色不存在
```json
{
  "code": 404,
  "message": "角色不存在"
}
```

### 403 - 系统角色不能修改
```json
{
  "code": 403,
  "message": "系统角色不能修改菜单权限"
}
```

### 400 - 无效的菜单ID
```json
{
  "code": 400,
  "message": "包含无效的菜单ID"
}
```

### 400 - 菜单不存在
```json
{
  "code": 400,
  "message": "部分菜单不存在"
}
```

### 500 - 服务器错误
```json
{
  "code": 500,
  "message": "获取角色菜单权限失败",
  "error": "错误详情"
}
```

## 使用说明

1. **获取角色菜单权限**：用于查看某个角色当前可以访问的菜单列表
2. **更新角色菜单权限**：用于修改某个角色可以访问的菜单列表
3. **系统角色限制**：系统角色（如管理员）的菜单权限不能通过API修改
4. **菜单ID验证**：更新时会验证所有菜单ID的有效性和存在性

## 数据模型变更

在角色模型中新增了 `menuIds` 字段：

```javascript
menuIds: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Menu'
}]
```

该字段存储角色可以访问的菜单ID数组，与Menu模型建立关联关系。 