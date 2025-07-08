# 循环推送状态管理

## 状态管理逻辑

循环推送任务的状态管理遵循以下逻辑：

### 推送状态 (pushStatus)

- **draft**: 草稿状态（循环任务不使用此状态）
- **sending**: 推送中状态
- **sent**: 推送成功状态
- **failed**: 推送失败状态

### 循环任务状态变化流程

#### 1. 任务创建
```javascript
// 循环任务创建时直接设置为 sending 状态
pushStatus: 'sending'
```

#### 2. 任务执行过程
```javascript
// 每次执行前检查状态
if (task.pushStatus !== 'sending') {
  await PushTask.findByIdAndUpdate(task._id, {
    pushStatus: 'sending'
  })
}

// 执行推送...
// 添加执行记录...

// 如果还有下次执行，保持 sending 状态
if (nextExecutionTime && !shouldComplete) {
  await PushTask.findByIdAndUpdate(task._id, {
    'recurringConfig.nextExecutionTime': nextExecutionTime,
    'recurringConfig.executedCount': newExecutedCount,
    pushStatus: 'sending', // 保持推送中状态
    totalSent: task.totalSent + result.sentCount,
    updatedAt: new Date()
  })
}
```

#### 3. 任务完成
```javascript
// 达到最大执行次数时，设置为最终状态，但不自动禁用任务
if (shouldComplete) {
  await PushTask.findByIdAndUpdate(task._id, {
    pushStatus: result.success ? 'sent' : 'failed', // 最后一次执行，设置为最终状态
    'recurringConfig.executedCount': newExecutedCount,
    totalSent: task.totalSent + result.sentCount,
    updatedAt: new Date()
  })
}
```

## 状态持续时间

### 推送中状态 (sending)
- **开始时间**: 任务创建时
- **结束时间**: 最后一次推送完成时
- **持续时间**: 从第一次推送开始到最后一次推送结束前

### 最终状态
- **sent**: 最后一次推送成功
- **failed**: 最后一次推送失败

## 与定时推送的区别

### 定时推送
- 创建时: `draft`
- 执行时: `sending`
- 执行后: `sent` 或 `failed`
- 2秒后: 重置为 `draft`

### 循环推送
- 创建时: `sending`
- 执行过程中: 保持 `sending`
- 最后一次执行后: `sent` 或 `failed`
- **不自动禁用任务**: 达到最大执行次数后，任务状态保持为 `active`，只是不再执行

## 前端显示逻辑

前端可以根据 `pushStatus` 显示不同的状态：

```javascript
const getStatusDisplay = (task) => {
  switch (task.pushStatus) {
    case 'draft':
      return '草稿'
    case 'sending':
      return task.pushMode === 'recurring' ? '推送中' : '发送中'
    case 'sent':
      return '发送成功'
    case 'failed':
      return '发送失败'
    default:
      return '未知状态'
  }
}
```

## 测试验证

使用测试脚本验证状态管理：

```bash
node scripts/test-recurring-status.js
```

测试脚本会检查：
1. 循环任务创建时是否为 `sending` 状态
2. 执行过程中是否保持 `sending` 状态
3. 完成后是否正确设置为最终状态
4. 执行次数与历史记录是否一致

## 注意事项

1. **状态持久化**: 所有状态变更都直接写入数据库
2. **执行次数**: 从1开始计数，包含当前执行
3. **完成条件**: 达到最大执行次数时停止执行，但不自动禁用任务
4. **错误处理**: 执行失败时标记为 `failed` 状态
5. **状态一致性**: 定期运行测试脚本检查状态一致性
6. **任务管理**: 用户需要手动禁用已完成的任务，系统不会自动禁用 