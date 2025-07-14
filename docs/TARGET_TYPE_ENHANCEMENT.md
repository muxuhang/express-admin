# 推送目标用户类型功能增强

## 概述

参考同级项目 cacti-admin 的推送管理功能，为 express-admin 项目的推送功能添加了完整的目标用户类型管理，支持全部用户、指定用户和指定角色三种推送方式。

## 功能特性

### 1. 目标用户类型支持

**三种推送目标类型：**

1. **全部用户（all）**
   - 推送给系统中所有活跃状态的用户
   - 适用于系统公告、全局通知等场景
   - 无需额外配置

2. **指定用户（specific）**
   - 推送给指定的用户列表
   - 适用于个人消息、特定用户通知等场景
   - 需要配置 `targetUserIds` 数组

3. **指定角色（role）**
   - 推送给指定角色的所有用户
   - 适用于按角色分组通知
   - 需要配置 `targetRoleIds` 数组

### 2. 新增接口

#### 获取推送目标选项
- **接口**: `GET /api/pusher/targets`
- **功能**: 获取可用的用户列表和角色列表
- **用途**: 前端创建推送任务时选择目标用户或角色
- **返回**: 活跃用户列表和活跃角色列表

**响应示例：**
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
      }
    ],
    "roles": [
      {
        "_id": "role-id-1",
        "name": "管理员",
        "code": "admin",
        "description": "系统管理员，拥有所有权限"
      }
    ]
  },
  "message": "获取推送目标选项成功"
}
```

### 3. 数据模型增强

#### PushTask 模型
```javascript
// 目标用户配置
targetType: {
  type: String,
  enum: ['all', 'specific', 'role'],
  default: 'all',
  required: true
},
targetUserIds: {
  type: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  default: []
},
targetRoleIds: {
  type: [{
    type: String
  }],
  default: []
}
```

### 4. 服务层逻辑

#### 目标用户获取逻辑
```javascript
const getTargetUserIds = async (targetUserIds, targetRoleIds, targetType) => {
  const userIds = new Set()
  
  if (targetType === 'all') {
    // 获取所有活跃用户
    const allUsers = await User.find({ status: 'active' }).select('_id')
    allUsers.forEach(user => userIds.add(user._id.toString()))
  } else if (targetType === 'specific' && targetUserIds?.length > 0) {
    // 指定用户
    targetUserIds.forEach(userId => userIds.add(userId.toString()))
  } else if (targetType === 'role' && targetRoleIds?.length > 0) {
    // 指定角色
    const roleUsers = await User.find({ 
      role: { $in: targetRoleIds }, 
      status: 'active' 
    }).select('_id')
    roleUsers.forEach(user => userIds.add(user._id.toString()))
  }
  
  return Array.from(userIds)
}
```

### 5. 验证逻辑

#### 请求参数验证
- 指定用户推送时必须选择目标用户
- 指定角色推送时必须选择目标角色
- 只返回活跃状态的用户和角色

#### 权限控制
- 管理员可以查看所有用户和角色
- 普通用户只能查看自己的推送记录
- 推送目标选项对所有认证用户开放

### 6. 使用示例

#### 获取推送目标选项
```javascript
const response = await fetch('/api/pusher/targets', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const { data } = await response.json();
console.log('可用用户:', data.users);
console.log('可用角色:', data.roles);
```

#### 创建指定用户推送
```javascript
const pushData = {
  title: '个人消息',
  content: '这是专门发给您的消息',
  pushMode: 'immediate',
  targetType: 'specific',
  targetUserIds: ['user-id-1', 'user-id-2']
};

const response = await fetch('/api/pusher/push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(pushData)
});
```

#### 创建指定角色推送
```javascript
const pushData = {
  title: '管理员通知',
  content: '这是管理员专用通知',
  pushMode: 'immediate',
  targetType: 'role',
  targetRoleIds: ['admin', 'manager']
};

const response = await fetch('/api/pusher/push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(pushData)
});
```

### 7. 测试覆盖

#### 单元测试
- 目标选项接口测试
- 指定用户推送测试
- 指定角色推送测试
- 参数验证测试
- 权限控制测试

#### 集成测试
- 完整的推送流程测试
- 目标用户获取逻辑测试
- 错误处理测试

### 8. 文档更新

#### API 文档
- 更新了推送接口的参数说明
- 添加了目标类型的详细描述
- 新增了目标选项接口文档
- 提供了完整的使用示例

#### 使用指南
- 目标类型选择指南
- 前端集成示例
- 最佳实践建议

## 技术实现

### 1. 路由层
- 新增 `/api/pusher/targets` 接口
- 集成用户和角色模型
- 统一的错误处理

### 2. 服务层
- 目标用户获取逻辑
- 数据验证和转换
- 权限控制

### 3. 数据层
- 模型关联关系
- 索引优化
- 数据完整性约束

### 4. 测试层
- 完整的测试覆盖
- 边界条件测试
- 性能测试

## 优势特点

### 1. 灵活性
- 支持三种不同的推送目标类型
- 可以根据业务需求灵活选择

### 2. 可扩展性
- 易于添加新的目标类型
- 支持复杂的用户筛选逻辑

### 3. 性能优化
- 只查询活跃状态的用户和角色
- 使用索引优化查询性能

### 4. 安全性
- 完整的权限控制
- 参数验证和过滤

### 5. 易用性
- 清晰的 API 设计
- 详细的使用文档
- 完整的使用示例

## 总结

通过参考 cacti-admin 项目的推送管理功能，我们成功为 express-admin 项目添加了完整的目标用户类型管理功能。这个增强功能提供了：

1. **完整的推送目标支持**：全部用户、指定用户、指定角色
2. **便捷的目标选项接口**：前端可以轻松获取可用的用户和角色列表
3. **强大的验证机制**：确保推送目标的正确性和有效性
4. **完善的文档和测试**：便于开发和使用

这个功能增强使得 express-admin 项目的推送功能更加完善和实用，能够满足各种不同的推送场景需求。 