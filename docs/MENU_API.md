# 菜单管理 API 文档

## 概述

菜单管理接口提供了完整的菜单增删改查功能，支持树形结构、分页查询、状态管理等。

## 默认菜单

系统会在首次启动时自动创建以下默认菜单：

1. **首页** - path: `/`, icon: `HomeOutlined`
2. **用户管理** - path: `/users`, icon: `UserOutlined`
3. **角色管理** - path: `/roles`, icon: `TeamOutlined`
4. **菜单管理** - path: `/menus`, icon: `MenuOutlined`
5. **系统设置** - path: `/settings`, icon: `SettingOutlined`

## 数据模型

```javascript
{
  label: String,        // 菜单名称（必填）
  key: String,          // 菜单唯一标识（自动生成，前端不需要传入）
  path: String,         // 菜单路径（必填）
  parentId: ObjectId,   // 父菜单ID（可选，只返回ID，不返回完整对象）
  order: Number,        // 排序（默认0）
  icon: String,         // Ant Design 图标名称（可选）
  status: String,       // 状态：active/inactive（默认active）
  createdAt: Date,      // 创建时间
  updatedAt: Date       // 更新时间
}
```

## 重要说明

- **key 字段**：系统会自动使用后台生成的 ID 作为 key 值，前端创建菜单时不需要传入此字段
- **parentId 字段**：只返回上级菜单的 ID，不返回完整的上级菜单对象。如果传入空字符串、null 或 undefined，则设为顶级菜单
- **图标字段**：使用 Ant Design 的图标名称，如 `HomeOutlined`、`UserOutlined` 等

## 图标说明

`icon` 字段使用 Ant Design 的图标名称，例如：
- `HomeOutlined` - 首页图标
- `UserOutlined` - 用户图标
- `TeamOutlined` - 团队图标
- `MenuOutlined` - 菜单图标
- `SettingOutlined` - 设置图标
- `DashboardOutlined` - 仪表盘图标
- `FileOutlined` - 文件图标
- `FolderOutlined` - 文件夹图标

更多图标请参考：[Ant Design 图标库](https://ant.design/components/icon)

## API 接口

### 1. 获取菜单列表

**GET** `/api/menus`

**查询参数：**
- `keyword` (可选): 搜索关键词，支持菜单名称、key、路径模糊搜索
- `status` (可选): 状态筛选，active 或 inactive
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 10

**响应示例：**
```json
{
  "code": 0,
  "message": "获取菜单列表成功",
  "data": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "list": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "label": "首页",
        "key": "60f7b3b3b3b3b3b3b3b3b3b3",
        "path": "/",
        "parentId": null,
        "order": 1,
        "icon": "HomeOutlined",
        "status": "active",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 2. 获取菜单树

**GET** `/api/menus-tree`

**查询参数：**
- `status` (可选): 状态筛选，active 或 inactive。如果不传此参数，默认只返回启用状态的菜单

**响应示例：**
```json
{
  "code": 0,
  "message": "获取菜单树成功",
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "label": "首页",
      "key": "60f7b3b3b3b3b3b3b3b3b3b3",
      "path": "/",
      "parentId": null,
      "order": 1,
      "icon": "HomeOutlined",
      "status": "active",
      "children": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "label": "用户管理",
          "key": "60f7b3b3b3b3b3b3b3b3b3b4",
          "path": "/users",
          "parentId": "60f7b3b3b3b3b3b3b3b3b3b3",
          "order": 1,
          "icon": "UserOutlined",
          "status": "active",
          "children": []
        }
      ]
    }
  ]
}
```

**使用示例：**
```javascript
// 获取所有启用状态的菜单树（默认行为）
GET /api/menus-tree

// 获取所有菜单树（包括禁用状态）
GET /api/menus-tree?status=all

// 只获取禁用状态的菜单树
GET /api/menus-tree?status=inactive
```

### 3. 获取所有菜单树（用于管理）

**GET** `/api/menus-all`

**功能：** 获取所有菜单的树形结构，包括禁用状态的菜单，专门用于菜单管理页面

**响应示例：**
```json
{
  "code": 0,
  "message": "获取所有菜单树成功",
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "label": "首页",
      "key": "60f7b3b3b3b3b3b3b3b3b3b3",
      "path": "/",
      "parentId": null,
      "order": 1,
      "icon": "HomeOutlined",
      "status": "active",
      "children": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "label": "用户管理",
          "key": "60f7b3b3b3b3b3b3b3b3b3b4",
          "path": "/users",
          "parentId": "60f7b3b3b3b3b3b3b3b3b3b3",
          "order": 1,
          "icon": "UserOutlined",
          "status": "inactive",
          "children": []
        }
      ]
    }
  ]
}
```

### 4. 获取菜单详情

**GET** `/api/menus/:id`

**响应示例：**
```json
{
  "code": 0,
  "message": "获取菜单信息成功",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "label": "首页",
    "key": "60f7b3b3b3b3b3b3b3b3b3b3",
    "path": "/",
    "parentId": null,
    "order": 1,
    "icon": "HomeOutlined",
    "status": "active",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 5. 创建菜单

**POST** `/api/menus`

**请求体：**
```json
{
  "label": "首页",
  "path": "/",
  "parentId": null,
  "order": 1,
  "icon": "HomeOutlined",
  "status": "active"
}
```

**注意：** 不需要传入 `key` 字段，系统会自动生成

**响应示例：**
```json
{
  "code": 0,
  "message": "创建菜单成功",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "label": "首页",
    "key": "60f7b3b3b3b3b3b3b3b3b3b3",
    "path": "/",
    "parentId": null,
    "order": 1,
    "icon": "HomeOutlined",
    "status": "active",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 6. 更新菜单

**PUT** `/api/menus/:id`

**请求体：**
```json
{
  "label": "首页-已更新",
  "path": "/",
  "order": 1,
  "icon": "HomeOutlined",
  "status": "active"
}
```

**注意：** 不需要传入 `key` 字段，系统会自动维护

**响应示例：**
```json
{
  "code": 0,
  "message": "更新菜单成功",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "label": "首页-已更新",
    "key": "60f7b3b3b3b3b3b3b3b3b3b3",
    "path": "/",
    "parentId": null,
    "order": 1,
    "icon": "HomeOutlined",
    "status": "active",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 7. 删除菜单

**DELETE** `/api/menus/:id`

**注意：** 如果菜单下有子菜单，则无法删除

**响应示例：**
```json
{
  "code": 0,
  "message": "删除菜单成功"
}
```

### 8. 批量更新菜单排序

**PUT** `/api/menus-order`

**功能：** 批量更新菜单的排序

**请求体：**
```json
{
  "menuOrders": [
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "order": 1
    },
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b4", 
      "order": 2
    },
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "order": 3
    }
  ]
}
```

**参数说明：**
- `menuOrders`: 菜单排序数组
  - `id`: 菜单ID（必填）
  - `order`: 排序值（必填，数字类型）

**功能特性：**
1. **批量排序**：支持一次性更新多个菜单的排序
2. **数据验证**：确保请求数据格式正确

**响应示例：**
```json
{
  "code": 0,
  "message": "菜单排序更新成功",
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "label": "系统管理",
      "key": "60f7b3b3b3b3b3b3b3b3b3b3",
      "path": "/system",
      "parentId": null,
      "order": 1,
      "icon": "SettingOutlined",
      "status": "active",
      "children": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "label": "用户管理",
          "key": "60f7b3b3b3b3b3b3b3b3b3b4",
          "path": "/system/users",
          "parentId": "60f7b3b3b3b3b3b3b3b3b3b3",
          "order": 1,
          "icon": "UserOutlined",
          "status": "active",
          "children": []
        }
      ]
    }
  ]
}
```

**使用示例：**

```javascript
// 批量更新菜单排序
{
  "menuOrders": [
    {
      "id": "菜单ID1",
      "order": 1
    },
    {
      "id": "菜单ID2", 
      "order": 2
    },
    {
      "id": "菜单ID3",
      "order": 3
    }
  ]
}
```

### 9. 初始化默认菜单

**POST** `/api/menusInit`

**权限要求：** 仅管理员可访问

**功能：** 重新初始化系统默认菜单（如果数据库中已有菜单数据，则不会重复创建）

**响应示例：**
```json
{
  "code": 0,
  "message": "默认菜单初始化成功",
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "label": "首页",
      "key": "60f7b3b3b3b3b3b3b3b3b3b3",
      "path": "/",
      "parentId": null,
      "order": 1,
      "icon": "HomeOutlined",
      "status": "active"
    },
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "label": "用户管理",
      "key": "60f7b3b3b3b3b3b3b3b3b3b4",
      "path": "/users",
      "parentId": null,
      "order": 2,
      "icon": "UserOutlined",
      "status": "active"
    }
  ]
}
```

## 错误码说明

- `0`: 成功
- `400`: 请求参数错误
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 常见错误

1. **父菜单不存在**: 指定的父菜单ID不存在
2. **不能将自己设为父菜单**: 防止循环引用
3. **该菜单下有子菜单，无法删除**: 删除前需要先删除所有子菜单
4. **只有管理员可以初始化默认菜单**: 初始化接口需要管理员权限
5. **菜单排序数据格式错误**: 每个菜单项必须包含 id 和 order 字段

## 使用示例

### 创建顶级菜单
```javascript
const menu = {
  label: '首页',
  path: '/',
  order: 1,
  icon: 'HomeOutlined',
  status: 'active'
}
// 注意：不需要传入 key 字段，parentId 不传或传空值则为顶级菜单
```

### 创建子菜单
```javascript
const subMenu = {
  label: '用户管理',
  path: '/users',
  parentId: '60f7b3b3b3b3b3b3b3b3b3b3', // 父菜单ID
  order: 1,
  icon: 'UserOutlined',
  status: 'active'
}
// 注意：不需要传入 key 字段
```

### 将子菜单改为顶级菜单
```javascript
// 更新菜单，将子菜单改为顶级菜单
PUT /api/menus/:id
{
  "label": "用户管理",
  "path": "/users",
  "parentId": "", // 空字符串，将设为顶级菜单
  "order": 1,
  "icon": "UserOutlined",
  "status": "active"
}

// 或者
{
  "label": "用户管理",
  "path": "/users",
  "parentId": null, // null 值，将设为顶级菜单
  "order": 1,
  "icon": "UserOutlined",
  "status": "active"
}
```

### 常用 Ant Design 图标
```javascript
// 导航类
'HomeOutlined'      // 首页
'DashboardOutlined' // 仪表盘
'MenuOutlined'      // 菜单

// 用户类
'UserOutlined'      // 用户
'TeamOutlined'      // 团队
'UserAddOutlined'   // 添加用户

// 系统类
'SettingOutlined'   // 设置
'ToolOutlined'      // 工具
'ApiOutlined'       // API

// 文件类
'FileOutlined'      // 文件
'FolderOutlined'    // 文件夹
'FileTextOutlined'  // 文档

// 其他
'AppstoreOutlined'  // 应用
'DatabaseOutlined'  // 数据库
'MonitorOutlined'   // 监控
```

### 搜索菜单
```javascript
// 搜索包含"用户"的菜单
GET /api/menus?keyword=用户

// 获取启用的菜单
GET /api/menus?status=active

// 分页查询
GET /api/menus?page=1&limit=20
```

### 初始化默认菜单
```javascript
// 管理员权限
POST /api/menusInit
```