# 驼峰命名法统一工作

## 概述

本项目已将所有模型和相关代码统一使用驼峰命名法（camelCase），确保代码风格的一致性和可维护性。

## 修改的文件

### 模型文件 (src/models/)

1. **role.js**
   - `is_system` → `isSystem`
   - `created_at` → `createdAt`
   - `updated_at` → `updatedAt`

2. **loginLog.js**
   - `user_id` → `userId`
   - `login_time` → `loginTime`
   - `ip_address` → `ipAddress`
   - `user_agent` → `userAgent`
   - `login_source` → `loginSource`
   - `fail_reason` → `failReason`

3. **user.js**
   - `last_login_at` → `lastLoginAt`

4. **menu.js**
   - 已使用驼峰命名法，无需修改

### 路由文件 (src/routes/)

1. **roles.js**
   - 更新所有字段引用为驼峰命名法
   - 更新排序字段：`created_at` → `createdAt`
   - 更新系统角色检查：`is_system` → `isSystem`

2. **users.js**
   - 更新排序字段：`created_at` → `createdAt`

3. **loginLogs.js**
   - 完全重写，使用新的驼峰命名法字段

4. **auth.js**
   - 完全重写，使用新的驼峰命名法字段
   - 更新JWT payload：`id` → `userId`

5. **menus.js**
   - 更新排序字段：`order` → `sort`

6. **login.js**
   - 更新所有字段引用为驼峰命名法
   - 更新JWT payload：`id` → `userId`
   - 更新查询参数：`start_date` → `startDate`, `end_date` → `endDate`, `login_source` → `loginSource`

### 中间件文件 (src/middleware/)

1. **authLogin.js**
   - 完全重写，使用新的驼峰命名法字段
   - 更新JWT验证逻辑

### 配置文件 (src/config/)

1. **db.js**
   - 完全重写，使用新的驼峰命名法字段

## 字段映射表

| 旧字段名 | 新字段名 | 说明 |
|---------|---------|------|
| `created_at` | `createdAt` | 创建时间 |
| `updated_at` | `updatedAt` | 更新时间 |
| `user_id` | `userId` | 用户ID |
| `login_time` | `loginTime` | 登录时间 |
| `ip_address` | `ipAddress` | IP地址 |
| `user_agent` | `userAgent` | 用户代理 |
| `login_source` | `loginSource` | 登录来源 |
| `fail_reason` | `failReason` | 失败原因 |
| `is_system` | `isSystem` | 是否系统角色 |
| `last_login_at` | `lastLoginAt` | 最后登录时间 |

## 影响范围

### API 响应
所有API响应中的字段名现在都使用驼峰命名法，前端需要相应更新字段名引用。

### 数据库查询
所有数据库查询和排序操作都已更新为使用新的字段名。

### JWT Token
JWT payload中的字段名已更新，确保与新的字段命名保持一致。

## 注意事项

1. **数据库迁移**：如果数据库中已有数据，可能需要执行数据迁移脚本
2. **前端更新**：前端代码需要更新字段名引用
3. **API文档**：需要更新API文档以反映新的字段名
4. **测试用例**：需要更新所有测试用例以使用新的字段名

## 验证

可以通过以下方式验证修改：

1. 启动服务器，检查控制台是否有错误
2. 测试各个API端点，确保功能正常
3. 检查数据库连接和初始化是否正常
4. 验证JWT token的生成和验证是否正常

## 后续工作

1. 更新前端代码以使用新的字段名
2. 更新API文档
3. 更新测试用例
4. 执行数据库迁移（如需要） 