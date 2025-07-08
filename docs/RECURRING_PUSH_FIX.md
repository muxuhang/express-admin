# 循环推送执行次数持久化修复

## 问题描述

在之前的版本中，循环推送的执行次数计数器存在以下问题：

1. **服务器重启后计数器重置**：执行次数在内存中管理，服务器重启后会丢失
2. **状态持久化不完整**：循环任务的执行状态没有完全持久化到数据库
3. **重启后重新开始**：服务器重启后，循环任务会重新从1开始计数

## 修复内容

### 1. 执行次数持久化

**修复前：**
```javascript
// 在 addExecutionRecord 方法中递增执行次数
this.recurringConfig.executedCount += 1
```

**修复后：**
```javascript
// 在服务层直接更新数据库中的执行次数
await PushTask.findByIdAndUpdate(task._id, {
  'recurringConfig.executedCount': newExecutedCount,
  // ... 其他字段
})
```

### 2. 新增完成状态

在 `pushStatus` 枚举中添加了 `completed` 状态：

```javascript
enum: {
  values: ['draft', 'sending', 'sent', 'failed', 'completed'],
  message: '无效的推送状态'
}
```

### 3. 完善任务生命周期管理

- ✅ **执行前检查**：检查是否达到最大执行次数
- ✅ **执行后更新**：更新执行次数和下次执行时间
- ✅ **完成状态处理**：达到最大执行次数时自动标记为完成
- ✅ **状态持久化**：所有状态变更都直接写入数据库

## 修复后的逻辑流程

### 循环任务执行流程：

1. **检查任务状态**
   ```javascript
   // 检查是否达到最大执行次数
   if (task.recurringConfig.maxExecutions && 
       task.recurringConfig.executedCount >= task.recurringConfig.maxExecutions) {
     // 标记为已完成
     await PushTask.findByIdAndUpdate(task._id, {
       status: 'inactive',
       pushStatus: 'completed'
     })
     return
   }
   ```

2. **执行推送**
   ```javascript
   // 执行推送逻辑
   const result = await executePush(task, targetUsers)
   ```

3. **更新执行次数**
   ```javascript
   // 计算新的执行次数
   const newExecutedCount = (task.recurringConfig.executedCount || 0) + 1
   ```

4. **检查是否完成**
   ```javascript
   // 检查是否达到最大执行次数
   const shouldComplete = task.recurringConfig.maxExecutions && 
                         newExecutedCount >= task.recurringConfig.maxExecutions
   ```

5. **更新任务状态**
   ```javascript
   if (nextExecutionTime && !shouldComplete) {
     // 还有下次执行
     await PushTask.findByIdAndUpdate(task._id, {
       'recurringConfig.nextExecutionTime': nextExecutionTime,
       'recurringConfig.executedCount': newExecutedCount,
       pushStatus: 'draft'
     })
   } else if (shouldComplete) {
     // 已完成
     await PushTask.findByIdAndUpdate(task._id, {
       status: 'inactive',
       pushStatus: 'completed',
       'recurringConfig.executedCount': newExecutedCount
     })
   }
   ```

## 数据库迁移

### 运行修复脚本

对于现有的循环任务，需要运行修复脚本来同步执行次数：

```bash
npm run fix-recurring-tasks
```

### 修复脚本功能

1. **查找所有活跃的循环任务**
2. **检查执行次数是否正确**
3. **根据执行历史计算实际执行次数**
4. **更新数据库中的执行次数**
5. **标记已完成的任务**

## 使用示例

### 创建循环推送任务

```javascript
// POST /api/pusher/push
{
  "title": "定期提醒",
  "content": "这是定期提醒消息",
  "pushMode": "recurring",
  "recurringConfig": {
    "type": "interval",
    "interval": 30,
    "intervalUnit": "minutes",
    "maxExecutions": 10  // 最多执行10次
  },
  "targetType": "all"
}
```

### 任务状态变化

1. **创建时**：`executedCount: 1`, `status: active`, `pushStatus: draft`
2. **执行1次后**：`executedCount: 2`, `status: active`, `pushStatus: draft`
3. **执行10次后**：`executedCount: 10`, `status: inactive`, `pushStatus: completed`

## 验证方法

### 1. 检查数据库

```javascript
// 查看循环任务的执行次数
const task = await PushTask.findById(taskId)
console.log('执行次数:', task.recurringConfig.executedCount)
console.log('最大执行次数:', task.recurringConfig.maxExecutions)
console.log('任务状态:', task.status)
console.log('推送状态:', task.pushStatus)
```

### 2. 查看执行历史

```javascript
// 查看执行历史记录
console.log('执行历史:', task.executionHistory.length)
```

### 3. 重启服务器测试

1. 创建循环推送任务
2. 等待执行几次
3. 重启服务器
4. 检查执行次数是否保持正确

## 注意事项

1. **向后兼容**：修复后的代码完全向后兼容
2. **数据安全**：所有状态变更都有日志记录
3. **性能优化**：减少了不必要的数据库查询
4. **错误处理**：完善的错误处理和回滚机制

## 更新日志

### v2.1.0
- ✅ 修复循环推送执行次数持久化问题
- ✅ 新增 `completed` 推送状态
- ✅ 完善任务生命周期管理
- ✅ 添加数据库迁移脚本
- ✅ 优化错误处理和日志记录 