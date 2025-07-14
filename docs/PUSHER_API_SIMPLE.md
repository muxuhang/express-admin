# 推送任务管理 API 文档

## 概述

推送任务管理 API 提供了完整的推送任务生命周期管理功能，包括创建、查看、编辑和删除推送任务。

## 认证

所有 API 请求都需要在请求头中包含有效的 Bearer token：

```
Authorization: Bearer <your-jwt-token>
```

## 核心接口

### 1. 创建推送任务

**POST** `/api/pusher/push`

创建新的推送任务，支持立即推送、定时推送和循环推送。

**请求体：**
```json
{
  "title": "推送标题",
  "content": "推送内容",
  "description": "推送描述（可选）",
  "type": "notification",
  "channel": "system-notifications",
  "event": "notification",
  "pushMode": "immediate",
  "scheduledTime": "2023-12-01T10:00:00.000Z",
  "recurringConfig": {
    "type": "interval",
    "interval": 60,
    "intervalUnit": "minutes",
    "maxExecutions": 10
  },
  "targetType": "all",
  "targetUserIds": ["用户ID1", "用户ID2"],
  "targetRoleIds": ["admin", "user"]
}
```

**参数说明：**
- `title` (必填): 推送标题，最大100字符
- `content` (必填): 推送内容，最大1000字符
- `description` (可选): 推送描述，最大200字符
- `type` (可选): 推送类型，可选值：`notification`、`message`、`announcement`，默认为 `notification`
- `channel` (已固定): 频道名称固定为 `system-notifications`，无需传递
- `event` (可选): 事件名称，默认为 `notification`
- `pushMode` (必填): 推送方式，可选值：`immediate`、`scheduled`、`recurring`
- `scheduledTime` (定时推送必填): 定时推送时间，ISO格式
- `recurringConfig` (循环推送必填): 循环推送配置
- `targetType` (必填): 目标类型，可选值：`all`、`specific`、`role`
- `targetUserIds` (指定用户时必填): 目标用户ID列表
- `targetRoleIds` (指定角色时必填): 目标角色列表

**目标类型（targetType）详细说明：**

1. **全部用户（all）**
   - 推送给系统中所有活跃状态的用户
   - 不需要设置 `targetUserIds` 或 `targetRoleIds`
   - 适用于系统公告、全局通知等场景

2. **指定用户（specific）**
   - 推送给指定的用户列表
   - 必须设置 `targetUserIds` 数组，包含要推送的用户ID
   - 适用于个人消息、特定用户通知等场景
   - 用户ID可通过 `/api/pusher/targets` 接口获取

3. **指定角色（role）**
   - 推送给指定角色的所有用户
   - 必须设置 `targetRoleIds` 数组，包含要推送的角色编码
   - 适用于按角色分组通知，如管理员通知、普通用户通知等
   - 角色编码可通过 `/api/pusher/targets` 接口获取

**频道（Channel）说明：**
系统已将所有推送频道固定为 `system-notifications`，这是一个公共频道，所有用户都可以订阅。前端只需要订阅这一个频道即可接收所有类型的推送消息。

**前端订阅示例：**
```javascript
const pusher = new Pusher('your-app-key', {
  cluster: 'your-cluster'
});

// 订阅系统通知频道
const systemChannel = pusher.subscribe('system-notifications');

// 监听推送事件
systemChannel.bind('notification', function(data) {
  // 根据 data.type 决定显示方式
  switch(data.type) {
    case 'notification':
      showNotification(data);
      break;
    case 'message':
      showMessage(data);
      break;
    case 'announcement':
      showAnnouncement(data);
      break;
  }
});
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "success": true,
    "pushTaskId": "推送任务ID",
    "sentCount": 100,
    "failedCount": 0,
    "error": null
  },
  "message": "消息推送成功"
}
```

### 2. 获取推送任务列表

**GET** `/api/pusher/tasks`

获取推送任务列表，支持多种过滤条件。

**重要说明：**
- 此接口返回所有类型的推送记录，包括立即推送、定时推送和循环推送
- 立即推送记录会显示为 `taskType: 'immediate'`，状态根据发送状态映射
- 定时推送记录会显示为 `taskType: 'scheduled'`
- 循环推送记录会显示为 `taskType: 'recurring'`

**查询参数：**
- `page` (可选): 页码，默认为 1
- `limit` (可选): 每页数量，默认为 10
- `taskType` (可选): 按任务类型过滤 (immediate/scheduled/recurring)
- `status` (可选): 按状态过滤 (active/paused/completed/cancelled)
- `title` (可选): 按标题过滤
- `content` (可选): 按内容过滤
- `channel` (可选): 按频道名称过滤
- `type` (可选): 按推送类型过滤 (notification/message/announcement)
- `pushMode` (可选): 按推送方式过滤 (immediate/scheduled/recurring)
- `sendStatus` (可选): 按发送状态过滤 (draft/sending/sent/failed)
- `startDate` (可选): 开始日期 (ISO 格式)
- `endDate` (可选): 结束日期 (ISO 格式)

**权限说明：**
- 管理员可以查看所有任务
- 普通用户只能查看自己的任务

**响应：**
```json
{
  "code": 0,
  "data": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "list": [
      {
        "_id": "task-id",
        "type": "task",
        "taskType": "scheduled",
        "status": "active",
        "scheduledTime": "2023-12-01T10:00:00.000Z",
        "formattedScheduledTime": "2023-12-01 18:00:00",
        "recurringConfig": null,
        "executionHistory": [],
        "pushTaskId": {
          "_id": "push-history-id",
          "title": "定时推送标题",
          "content": "定时推送内容",
          "description": "推送描述",
          "type": "notification",
          "channel": "system-notifications",
          "event": "notification",
          "pushMode": "scheduled",
          "targetType": "all",
          "targetUserIds": [],
          "targetRoleIds": [],
          "sendStatus": "draft",
          "status": 1,
          "createdBy": {
            "_id": "user-id",
            "username": "用户名",
            "email": "user@example.com"
          },
          "createdByUsername": "用户名",
          "createdAt": "2023-12-01T10:00:00.000Z",
          "updatedAt": "2023-12-01T10:00:00.000Z"
        },
        "title": "定时推送标题",
        "content": "定时推送内容",
        "description": "推送描述",
        "pushMode": "scheduled",
        "sendStatus": "draft",
        "createdBy": {
          "_id": "user-id",
          "username": "用户名"
        },
        "createdAt": "2023-12-01T09:00:00.000Z",
        "updatedAt": "2023-12-01T09:00:00.000Z"
      },
      {
        "_id": "push-history-id-2",
        "type": "immediate",
        "taskType": "immediate",
        "status": "completed",
        "pushTaskId": {
          "_id": "push-history-id-2",
          "title": "立即推送标题",
          "content": "立即推送内容",
          "description": "推送描述",
          "type": "notification",
          "channel": "system-notifications",
          "event": "notification",
          "pushMode": "immediate",
          "targetType": "all",
          "targetUserIds": [],
          "targetRoleIds": [],
          "sendStatus": "sent",
          "sentAt": "2023-12-01T10:00:00.000Z",
          "sentCount": 100,
          "failedCount": 0,
          "createdBy": {
            "_id": "user-id",
            "username": "用户名",
            "email": "user@example.com"
          },
          "createdByUsername": "用户名",
          "createdAt": "2023-12-01T10:00:00.000Z",
          "updatedAt": "2023-12-01T10:00:00.000Z"
        },
        "title": "立即推送标题",
        "content": "立即推送内容",
        "description": "推送描述",
        "pushMode": "immediate",
        "sendStatus": "sent",
        "sentAt": "2023-12-01T10:00:00.000Z",
        "sentCount": 100,
        "failedCount": 0,
        "createdBy": {
          "_id": "user-id",
          "username": "用户名"
        },
        "createdAt": "2023-12-01T10:00:00.000Z",
        "updatedAt": "2023-12-01T10:00:00.000Z"
      }
    ]
  },
  "message": "获取推送任务列表成功"
}
```

### 3. 修改推送任务

**PUT** `/api/pusher/tasks/:taskId`

修改推送任务的配置信息。

**路径参数：**
- `taskId`: 任务ID

**请求体：**
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "description": "更新后的描述",
  "type": "message",
  "channel": "updated-channel",
  "event": "updated-event",
  "scheduledTime": "2023-12-02T10:00:00.000Z",
  "recurringConfig": {
    "type": "daily",
    "dailyTime": "10:00",
    "maxExecutions": 20
  },
  "targetType": "role",
  "targetRoleIds": ["admin", "manager"],
  "status": "paused"
}
```

**权限说明：**
- 管理员可以编辑所有任务
- 普通用户只能编辑自己的任务
- 只能编辑草稿状态的推送记录
- 只能编辑活跃或暂停状态的任务

**响应：**
```json
{
  "code": 0,
  "data": {
    "_id": "task-id",
    "status": "paused",
    "updatedAt": "2023-12-01T11:00:00.000Z"
  },
  "message": "推送任务更新成功"
}
```

### 4. 删除推送任务

**DELETE** `/api/pusher/tasks/:taskId`

删除推送任务。

**路径参数：**
- `taskId`: 任务ID

**权限说明：**
- 管理员可以删除所有任务
- 普通用户只能删除自己的任务
- 只能删除草稿状态的推送记录
- 只能删除活跃或暂停状态的任务

**响应：**
```json
{
  "code": 0,
  "data": {
    "_id": "task-id"
  },
  "message": "推送任务删除成功"
}
```

## 辅助接口

### 获取推送目标选项

**GET** `/api/pusher/targets`

获取可用的用户列表和角色列表，用于前端选择推送目标。

**功能说明：**
- 返回所有活跃状态的用户列表
- 返回所有活跃状态的角色列表
- 用于创建推送任务时选择目标用户或目标角色

**响应：**
```json
{
  "code": 0,
  "data": {
    "users": [
      {
        "_id": "user-id-1",
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin"
      },
      {
        "_id": "user-id-2",
        "username": "user1",
        "email": "user1@example.com",
        "role": "user"
      }
    ],
    "roles": [
      {
        "_id": "role-id-1",
        "name": "管理员",
        "code": "admin",
        "description": "系统管理员，拥有所有权限"
      },
      {
        "_id": "role-id-2",
        "name": "普通用户",
        "code": "user",
        "description": "普通用户，拥有基本权限"
      }
    ]
  },
  "message": "获取推送目标选项成功"
}
```

**使用场景：**
1. 创建推送任务时，前端需要显示可选择的用户列表
2. 创建推送任务时，前端需要显示可选择的角色列表
3. 编辑推送任务时，需要预填充已选择的用户或角色

### 获取推送任务详情

**GET** `/api/pusher/tasks/:taskId`

获取单个推送任务的详细信息。

**路径参数：**
- `taskId`: 任务ID

**响应：**
```json
{
  "code": 0,
  "data": {
    "_id": "task-id",
    "pushTaskId": {
      // 推送历史记录详细信息
    },
    "taskType": "scheduled",
    "status": "active",
    "scheduledTime": "2023-12-01T10:00:00.000Z",
    "executionHistory": [],
    "createdBy": {
      "_id": "user-id",
      "username": "用户名"
    },
    "createdAt": "2023-12-01T09:00:00.000Z",
    "updatedAt": "2023-12-01T09:00:00.000Z"
  },
  "message": "获取推送任务详情成功"
}
```

### 更新任务状态

**PATCH** `/api/pusher/tasks/:taskId/status`

暂停、恢复或取消推送任务。

**路径参数：**
- `taskId`: 任务ID

**请求体：**
```json
{
  "status": "paused"
}
```

**状态说明：**
- `active`: 激活任务
- `paused`: 暂停任务
- `cancelled`: 取消任务

**响应：**
```json
{
  "code": 0,
  "data": {
    "_id": "task-id",
    "status": "paused"
  },
  "message": "任务状态更新成功"
}
```

### 获取推送统计信息

**GET** `/api/pusher/stats`

获取推送统计信息。

**查询参数：**
- `startDate` (可选): 开始日期 (ISO 格式)
- `endDate` (可选): 结束日期 (ISO 格式)

**响应：**
```json
{
  "code": 0,
  "data": {
    "total": 1000,
    "sent": 800,
    "failed": 50,
    "draft": 150,
    "successRate": "80.00",
    "totalSent": 8000,
    "totalRead": 6000,
    "typeStats": [
      { "_id": "notification", "count": 600 },
      { "_id": "message", "count": 300 },
      { "_id": "announcement", "count": 100 }
    ],
    "modeStats": [
      { "_id": "immediate", "count": 700 },
      { "_id": "scheduled", "count": 200 },
      { "_id": "recurring", "count": 100 }
    ]
  },
  "message": "获取推送统计信息成功"
}
```

## 使用示例

### 获取推送目标选项
```javascript
// 获取可用的用户和角色列表
const response = await fetch('/api/pusher/targets', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const { data } = await response.json();
console.log('可用用户:', data.users);
console.log('可用角色:', data.roles);
```

### 创建定时推送任务
```javascript
const response = await fetch('/api/pusher/push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    title: '定时提醒',
    content: '这是定时提醒消息',
    description: '每日工作提醒',
    type: 'message',
    pushMode: 'scheduled',
    scheduledTime: '2023-12-01T10:00:00.000Z',
    targetType: 'all'
  })
});
```

### 获取任务列表
```javascript
const response = await fetch('/api/pusher/tasks?page=1&limit=20&status=active&pushMode=scheduled', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### 修改任务
```javascript
const response = await fetch('/api/pusher/tasks/task-id', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    title: '更新后的标题',
    content: '更新后的内容',
    scheduledTime: '2023-12-02T10:00:00.000Z',
    status: 'paused'
  })
});
```

### 删除任务
```javascript
const response = await fetch('/api/pusher/tasks/task-id', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

## 权限控制

### 管理员权限
- 查看所有用户的推送任务
- 编辑所有推送任务
- 删除所有推送任务
- 查看所有统计信息

### 普通用户权限
- 只能查看自己的推送任务
- 只能编辑自己的推送任务
- 只能删除自己的推送任务
- 只能查看自己的统计信息

## 状态管理

### 推送记录状态
- `draft`: 草稿状态（可编辑）
- `sending`: 发送中
- `sent`: 已发送
- `failed`: 发送失败

### 任务状态
- `active`: 活跃状态（可编辑）
- `paused`: 暂停状态（可编辑）
- `completed`: 已完成（不可编辑）
- `cancelled`: 已取消（不可编辑）

## 错误码说明

- `400`: 请求参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 注意事项

1. 只能编辑草稿状态的推送记录
2. 只能编辑活跃或暂停状态的任务
3. 删除任务时会同时删除相关的推送历史记录
4. 定时和循环推送任务需要外部调度器处理
5. 所有时间字段都使用 ISO 8601 格式 