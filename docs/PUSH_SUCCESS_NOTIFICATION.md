# 推送成功通知功能

## 功能概述

推送成功通知功能允许在推送任务执行成功后，自动向推送任务的创建者发送一条通知消息，告知推送执行的结果。

## 功能特性

- ✅ 支持立即推送、定时推送、循环推送的成功通知
- ✅ 可配置是否启用成功通知
- ✅ 自定义成功通知的标题和内容
- ✅ 成功通知发送到推送创建者的私有频道
- ✅ 同时发送到系统通知频道供管理员查看
- ✅ 失败时不影响主推送结果，只记录错误日志

## 数据模型

在 `PushTask` 模型中新增了以下字段：

```javascript
// 推送成功通知配置
notifyOnSuccess: {
  type: Boolean,
  default: false,
  description: '推送成功后是否推送消息给用户'
},
successNotificationTitle: {
  type: String,
  maxlength: [100, '成功通知标题不能超过100个字符'],
  trim: true,
  validate: {
    validator: function(value) {
      if (this.notifyOnSuccess && !value) {
        return false
      }
      return true
    },
    message: '启用成功通知时必须设置通知标题'
  }
},
successNotificationContent: {
  type: String,
  maxlength: [500, '成功通知内容不能超过500个字符'],
  trim: true,
  validate: {
    validator: function(value) {
      if (this.notifyOnSuccess && !value) {
        return false
      }
      return true
    },
    message: '启用成功通知时必须设置通知内容'
  }
}
```

## API 使用

### 创建推送任务（启用成功通知）

```javascript
// POST /api/pusher/push
{
  "title": "系统维护通知",
  "content": "系统将于今晚22:00-24:00进行维护，期间可能影响服务使用。",
  "description": "重要系统维护通知",
  "type": "announcement",
  "pushMode": "immediate",
  "targetType": "all",
  "notifyOnSuccess": true,
  "successNotificationTitle": "推送任务执行成功",
  "successNotificationContent": "您的推送任务'系统维护通知'已成功发送给所有用户。"
}
```

### 创建定时推送任务（启用成功通知）

```javascript
{
  "title": "每日提醒",
  "content": "请记得完成今日任务！",
  "description": "每日任务提醒",
  "type": "notification",
  "pushMode": "scheduled",
  "scheduledTime": "2024-01-15T09:00:00.000Z",
  "targetType": "role",
  "targetRoleIds": ["user"],
  "notifyOnSuccess": true,
  "successNotificationTitle": "定时推送任务创建成功",
  "successNotificationContent": "您的定时推送任务'每日提醒'已成功创建，将在指定时间自动执行。"
}
```

### 创建循环推送任务（启用成功通知）

```javascript
{
  "title": "健康提醒",
  "content": "请记得喝水休息！",
  "description": "健康提醒推送",
  "type": "notification",
  "pushMode": "recurring",
  "recurringConfig": {
    "type": "interval",
    "interval": 2,
    "intervalUnit": "hours",
    "executedCount": 1
  },
  "targetType": "specific",
  "targetUserIds": ["user1", "user2"],
  "notifyOnSuccess": true,
  "successNotificationTitle": "循环推送任务创建成功",
  "successNotificationContent": "您的循环推送任务'健康提醒'已成功创建，将每2小时执行一次。"
}
```

### 更新推送任务（启用成功通知）

```javascript
// PUT /api/pusher/tasks/:taskId
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "notifyOnSuccess": true,
  "successNotificationTitle": "推送任务更新成功",
  "successNotificationContent": "您的推送任务已成功更新并执行。"
}
```

## 验证规则

1. **启用成功通知时的必填验证**：
   - 如果 `notifyOnSuccess` 为 `true`，则 `successNotificationTitle` 和 `successNotificationContent` 为必填项
   - 标题长度不能超过100个字符
   - 内容长度不能超过500个字符

2. **推送任务基础验证**：
   - 标题和内容为必填项
   - 推送方式必须为 `immediate`、`scheduled` 或 `recurring`
   - 目标类型验证（指定用户时必须选择目标用户，指定角色时必须选择目标角色）

## 成功通知发送机制

### 立即推送
- 推送执行完成后，如果成功且启用了成功通知，立即发送成功通知

### 定时推送
- 定时任务执行完成后，如果成功且启用了成功通知，发送成功通知

### 循环推送
- 每次循环执行完成后，如果成功且启用了成功通知，发送成功通知

### 通知发送目标
1. **推送创建者的私有频道**：`private-user-{userId}`
2. **系统通知频道**：`system-notifications`（供管理员查看）

### 通知数据结构
```javascript
{
  title: "成功通知标题",
  content: "成功通知内容",
  type: "success_notification",
  from: "system",
  timestamp: "2024-01-15T09:00:00.000Z",
  targetUserId: "推送创建者ID",
  createdBy: "推送创建者用户名"
}
```

## 错误处理

- 成功通知发送失败不会影响主推送任务的结果
- 失败时会记录错误日志到控制台
- 主推送任务仍然会正常完成并更新状态

## 前端集成

前端可以通过监听以下事件来接收成功通知：

```javascript
// 监听推送创建者的私有频道
const channel = pusher.subscribe(`private-user-${userId}`)
channel.bind('success_notification', function(data) {
  console.log('收到推送成功通知:', data)
  // 显示成功通知
  showNotification(data.title, data.content)
})

// 监听系统通知频道（管理员）
const systemChannel = pusher.subscribe('system-notifications')
systemChannel.bind('success_notification', function(data) {
  console.log('收到系统成功通知:', data)
  // 显示系统通知
  showSystemNotification(data.message)
})
```

## 注意事项

1. 成功通知功能默认关闭，需要手动启用
2. 启用成功通知时必须提供通知标题和内容
3. 成功通知只发送给推送任务的创建者
4. 循环推送任务每次执行成功后都会发送成功通知
5. 成功通知发送失败不会影响主推送任务的执行结果 