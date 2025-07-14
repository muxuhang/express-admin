# Pusher API 文档

## 概述

Pusher API 提供了完整的实时消息推送功能，包括立即推送、定时推送、循环推送、目标用户/角色推送以及推送历史记录管理。

## 认证

所有 API 请求都需要在请求头中包含有效的 Bearer token：

```
Authorization: Bearer <your-jwt-token>
```

## API 端点

### 1. 添加推送

**POST** `/api/pusher/push`

统一的推送接口，支持立即推送、定时推送和循环推送。

**请求体：**
```json
{
  "title": "推送标题",
  "content": "推送内容",
  "description": "推送描述（可选）",
  "type": "notification",
  "channel": "频道名称",
  "event": "事件名称",
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
- `channel` (必填): 频道名称
- `event` (可选): 事件名称，默认为 `notification`
- `pushMode` (必填): 推送方式，可选值：`immediate`、`scheduled`、`recurring`
- `scheduledTime` (定时推送必填): 定时推送时间，ISO格式
- `recurringConfig` (循环推送必填): 循环推送配置
- `targetType` (必填): 目标类型，可选值：`all`、`specific`、`role`
- `targetUserIds` (指定用户时必填): 目标用户ID列表
- `targetRoleIds` (指定角色时必填): 目标角色列表

**pushMode 说明：**
- `immediate`: 立即推送
- `scheduled`: 定时推送，需要设置 `scheduledTime`
- `recurring`: 循环推送，需要设置 `recurringConfig`

**recurringConfig 说明：**
- `type`: 循环类型
  - `interval`: 间隔推送
  - `daily`: 每日推送
- `interval`: 间隔时间（仅 interval 类型需要）
- `intervalUnit`: 时间单位，可选值：`minutes`、`hours`、`days`（仅 interval 类型需要）
- `dailyTime`: 每日推送时间（HH:mm 格式，仅 daily 类型需要）
- `maxExecutions`: 最大执行次数（可选，null 表示无限）

**targetType 说明：**
- `all`: 推送给所有用户
- `specific`: 推送给指定用户，需要设置 `targetUserIds`
- `role`: 推送给指定角色，需要设置 `targetRoleIds`

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

**使用示例：**

1. 立即推送
```json
{
  "title": "重要通知",
  "content": "这是一条重要通知",
  "channel": "notifications",
  "pushMode": "immediate",
  "targetType": "role",
  "targetRoleIds": ["admin", "manager"]
}
```

2. 定时推送
```json
{
  "title": "定时提醒",
  "content": "这是定时提醒消息",
  "channel": "reminders",
  "pushMode": "scheduled",
  "scheduledTime": "2023-12-01T10:00:00.000Z",
  "targetType": "all"
}
```

3. 循环推送（间隔）
```json
{
  "title": "定期提醒",
  "content": "这是定期提醒消息",
  "channel": "periodic-reminders",
  "pushMode": "recurring",
  "recurringConfig": {
    "type": "interval",
    "interval": 60,
    "intervalUnit": "minutes",
    "maxExecutions": 10
  },
  "targetType": "all"
}
```

4. 循环推送（每日）
```json
{
  "title": "每日提醒",
  "content": "这是每日提醒消息",
  "channel": "daily-reminders",
  "pushMode": "recurring",
  "recurringConfig": {
    "type": "daily",
    "dailyTime": "09:00",
    "maxExecutions": 30
  },
  "targetType": "all"
}
```

### 2. 获取频道列表

**GET** `/api/pusher/channels`

获取所有可用的 Pusher 频道列表。

**查询参数：**
- `page` (可选): 页码，默认为 1
- `limit` (可选): 每页数量，默认为 10

**响应：**
```json
{
  "code": 0,
  "data": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "list": [
      {
        "name": "channel-name",
        "occupied": true,
        "user_count": 5
      }
    ]
  },
  "message": "获取频道列表成功"
}
```

### 3. 获取频道在线用户

**GET** `/api/pusher/channels/:channel/users`

获取指定频道的在线用户列表。

**路径参数：**
- `channel`: 频道名称

**查询参数：**
- `page` (可选): 页码，默认为 1
- `limit` (可选): 每页数量，默认为 10

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
        "id": "user-id",
        "name": "用户名"
      }
    ]
  },
  "message": "获取在线用户成功"
}
```

### 4. 获取推送历史记录

**GET** `/api/pusher/history`

获取推送历史记录列表（只读）。

**查询参数：**
- `page` (可选): 页码，默认为 1
- `limit` (可选): 每页数量，默认为 10
- `title` (可选): 按标题过滤
- `content` (可选): 按内容过滤
- `channel` (可选): 按频道名称过滤
- `type` (可选): 按推送类型过滤 (notification/message/announcement)
- `pushMode` (可选): 按推送方式过滤 (immediate/scheduled/recurring)
- `sendStatus` (可选): 按发送状态过滤 (draft/sending/sent/failed)
- `status` (可选): 按状态过滤 (0/1)
- `startDate` (可选): 开始日期 (ISO 格式)
- `endDate` (可选): 结束日期 (ISO 格式)

**权限说明：**
- 管理员可以查看所有用户的推送记录
- 普通用户只能查看自己的推送记录

**响应：**
```json
{
  "code": 0,
  "data": {
    "total": 1000,
    "page": 1,
    "limit": 10,
    "list": [
      {
        "_id": "record-id",
        "title": "推送标题",
        "content": "推送内容",
        "description": "推送描述",
        "type": "notification",
        "channel": "test-channel",
        "event": "notification",
        "pushMode": "immediate",
        "targetType": "all",
        "targetUserIds": [],
        "targetRoleIds": [],
        "sendStatus": "sent",
        "sentCount": 100,
        "failedCount": 0,
        "readCount": 50,
        "errorMessage": null,
        "sentAt": "2023-12-01T10:00:00.000Z",
        "formattedSentAt": "2023-12-01 18:00:00",
        "createdBy": {
          "_id": "user-id",
          "username": "用户名",
          "email": "user@example.com"
        },
        "createdByUsername": "用户名",
        "createdAt": "2023-12-01T10:00:00.000Z",
        "updatedAt": "2023-12-01T10:00:00.000Z"
      }
    ]
  },
  "message": "获取推送历史记录成功"
}
```

### 5. 获取推送任务列表

**GET** `/api/pusher/tasks`

获取推送任务列表（定时和循环任务）。

**查询参数：**
- `page` (可选): 页码，默认为 1
- `limit` (可选): 每页数量，默认为 10
- `taskType` (可选): 按任务类型过滤 (scheduled/recurring)
- `status` (可选): 按状态过滤 (active/paused/completed/cancelled)

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
        "pushTaskId": {
          "_id": "push-history-id",
          "title": "推送标题",
          "content": "推送内容"
        },
        "taskType": "scheduled",
        "status": "active",
        "scheduledTime": "2023-12-01T10:00:00.000Z",
        "formattedScheduledTime": "2023-12-01 18:00:00",
        "executionHistory": [],
        "createdBy": {
          "_id": "user-id",
          "username": "用户名"
        },
        "createdAt": "2023-12-01T09:00:00.000Z"
      }
    ]
  },
  "message": "获取推送任务列表成功"
}
```

### 6. 更新任务状态

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

### 7. 获取推送统计信息

**GET** `/api/pusher/stats`

获取推送统计信息，包括总数、成功率、按类型分类的统计。

**查询参数：**
- `startDate` (可选): 开始日期 (ISO 格式)
- `endDate` (可选): 结束日期 (ISO 格式)

**权限说明：**
- 管理员可以查看所有用户的统计信息
- 普通用户只能查看自己的统计信息

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
    ],
    "channelStats": [
      { "_id": "notifications", "count": 500 },
      { "_id": "reminders", "count": 300 }
    ],
    "creatorStats": [
      { "_id": "user-id-1", "count": 400 },
      { "_id": "user-id-2", "count": 300 }
    ]
  },
  "message": "获取推送统计信息成功"
}
```

### 8. 获取推送目标选项

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

## 数据模型

### PushTask 模型

```javascript
{
  _id: ObjectId,           // 推送任务ID (自动生成)
  title: String,           // 推送标题 (必填，最大100字符)
  content: String,         // 推送内容 (必填，最大1000字符)
  description: String,     // 推送描述 (可选，最大200字符)
  type: String,            // 推送类型 (必填，enum: ['notification', 'alert', 'announcement', 'reminder'])
  pushMode: String,        // 推送方式 (必填，enum: ['immediate', 'scheduled', 'recurring'])
  scheduledTime: Date,     // 定时推送时间 (定时推送时必填)
  recurringConfig: {       // 循环推送配置 (循环推送时必填)
    type: String,          // 循环类型 (enum: ['interval', 'daily'])
    interval: Number,      // 间隔数值 (间隔推送时必填)
    intervalUnit: String,  // 时间单位 (enum: ['minutes', 'hours', 'days'])
    dailyTime: String,     // 每日推送时间 (每日推送时必填，格式: HH:mm)
    nextExecutionTime: Date, // 下次执行时间
    executedCount: Number, // 已执行次数
    maxExecutions: Number  // 最大执行次数
  },
  targetType: String,      // 目标用户类型 (必填，enum: ['all', 'specific', 'role'])
  targetUserIds: [ObjectId], // 目标用户ID列表 (指定用户时必填)
  targetRoleIds: [String], // 目标角色ID列表 (指定角色时必填)
  status: String,          // 启停状态 (必填，enum: ['active', 'inactive'])
  pushStatus: String,      // 推送执行状态 (系统控制，enum: ['draft', 'sending', 'sent', 'failed'])
  executionHistory: [{     // 执行历史记录
    executionTime: Date,   // 执行时间
    status: String,        // 执行状态 (enum: ['success', 'failed'])
    sentCount: Number,     // 发送成功数
    failedCount: Number,   // 发送失败数
    errorMessage: String   // 错误信息
  }],
  totalSent: Number,       // 总发送数
  totalRead: Number,       // 总阅读数
  createdBy: ObjectId,     // 创建者ID (必填)
  createdByUsername: String, // 创建者用户名 (必填)
  createdAt: Date,         // 创建时间 (自动生成)
  updatedAt: Date,         // 更新时间 (自动更新)
  lastExecutedAt: Date     // 最后执行时间
}
```

## 使用示例

### JavaScript 示例

```javascript
// 立即推送
const immediateResponse = await fetch('/api/pusher/push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    title: '重要通知',
    content: '这是一条重要通知',
    channel: 'notifications',
    pushMode: 'immediate',
    targetType: 'role',
    targetRoleIds: ['admin', 'manager']
  })
});

// 定时推送
const scheduledResponse = await fetch('/api/pusher/push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    title: '定时提醒',
    content: '这是定时提醒消息',
    channel: 'reminders',
    pushMode: 'scheduled',
    scheduledTime: '2023-12-01T10:00:00.000Z',
    targetType: 'all'
  })
});

// 循环推送
const recurringResponse = await fetch('/api/pusher/push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    title: '每日提醒',
    content: '这是每日提醒消息',
    channel: 'daily-reminders',
    pushMode: 'recurring',
    recurringConfig: {
      type: 'daily',
      dailyTime: '09:00',
      maxExecutions: 30
    },
    targetType: 'all'
  })
});

// 获取推送历史
const history = await fetch('/api/pusher/history?page=1&limit=20&pushMode=immediate', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

// 获取任务列表
const tasks = await fetch('/api/pusher/tasks?taskType=scheduled&status=active', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

// 暂停任务
const pauseTask = await fetch('/api/pusher/tasks/task-id/status', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({ status: 'paused' })
});
```

### cURL 示例

```bash
# 立即推送
curl -X POST http://localhost:8888/api/pusher/push \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "重要通知",
    "content": "这是一条重要通知",
    "channel": "notifications",
    "pushMode": "immediate",
    "targetType": "role",
    "targetRoleIds": ["admin"]
  }'

# 定时推送
curl -X POST http://localhost:8888/api/pusher/push \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "定时提醒",
    "content": "这是定时提醒消息",
    "channel": "reminders",
    "pushMode": "scheduled",
    "scheduledTime": "2023-12-01T10:00:00.000Z",
    "targetType": "all"
  }'

# 循环推送
curl -X POST http://localhost:8888/api/pusher/push \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "每日提醒",
    "content": "这是每日提醒消息",
    "channel": "daily-reminders",
    "pushMode": "recurring",
    "recurringConfig": {
      "type": "daily",
      "dailyTime": "09:00",
      "maxExecutions": 30
    },
    "targetType": "all"
  }'
```

## 错误码说明

- `400`: 请求参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 注意事项

1. 所有时间字段都使用 ISO 8601 格式
2. 定时和循环推送任务需要外部调度器处理
3. 只有管理员可以查看所有用户的推送记录
4. 普通用户只能查看和管理自己的推送记录
5. 推送任务状态可以通过 API 进行管理 