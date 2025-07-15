# 系统使用统计功能

## 概述

系统使用统计功能提供了全面的用户活动监控和数据分析能力，包括页面访问、API调用、用户行为等统计信息。

## 功能特性

### 1. 自动数据收集
- **页面访问统计**: 自动记录用户访问的页面和响应时间
- **API调用统计**: 记录所有API调用的性能指标
- **用户登录/登出**: 记录用户登录和登出活动
- **错误统计**: 自动捕获和记录系统错误

### 2. 统计数据类型
- `page_view`: 页面访问
- `api_call`: API调用
- `login`: 用户登录
- `logout`: 用户登出
- `action`: 用户操作
- `error`: 系统错误

### 3. 性能监控
- 响应时间统计
- 请求/响应大小统计
- 错误率统计
- 慢请求检测

## API接口

### 系统统计
```http
GET /api/statistics/system?startDate=2024-01-01&endDate=2024-12-31
```
获取系统总体统计信息，需要管理员权限。

### 用户统计
```http
GET /api/statistics/user/:userId?startDate=2024-01-01&endDate=2024-12-31
```
获取指定用户的统计信息，需要管理员权限。

**路径参数：**
- `:userId` - 用户ID (MongoDB ObjectId格式)

### 当前用户统计
```http
GET /api/statistics/my-stats?startDate=2024-01-01&endDate=2024-12-31
```
获取当前登录用户的统计信息。

### 热门页面
```http
GET /api/statistics/popular-pages?limit=10&startDate=2024-01-01&endDate=2024-12-31
```
获取访问量最高的页面，需要管理员权限。

### API性能统计
```http
GET /api/statistics/api-performance?startDate=2024-01-01&endDate=2024-12-31&avgResponseTime=ascend
```
获取API性能统计信息，需要管理员权限。

**路径规范化功能：**
系统会自动将带有ID参数的路径合并为参数化路径，例如：
- `/api/statistics/user/6834255c5616d1fa6395dabd` → `/api/statistics/user/:id`
- `/api/users/507f1f77bcf86cd799439011` → `/api/users/:id`
- `/api/articles/507f1f77bcf86cd799439012` → `/api/articles/:id`
- `/api/menus/507f1f77bcf86cd799439013` → `/api/menus/:id`
- `/api/pusher/tasks/507f1f77bcf86cd799439014` → `/api/pusher/tasks/:id`

这样可以更准确地统计API性能，避免因为不同的ID参数导致同一接口被分散统计。

**查询参数：**
- `startDate` (可选): 开始日期 (ISO 8601格式)
- `endDate` (可选): 结束日期 (ISO 8601格式)
- `page` (可选): 页码，默认为1
- `limit` (可选): 每页数量，默认为10，最大100
- `avgResponseTime` (可选): 按平均响应时间排序，可选值：`asc`, `desc`, `ascend`, `descend`
- `count` (可选): 按调用次数排序，可选值：`asc`, `desc`, `ascend`, `descend`
- `errorCount` (可选): 按错误次数排序，可选值：`asc`, `desc`, `ascend`, `descend`
- `errorRate` (可选): 按错误率排序，可选值：`asc`, `desc`, `ascend`, `descend`

**注意：** 
- 如果不指定任何排序参数，则返回的数据不进行排序，按数据库自然顺序返回
- 只能同时使用一个排序参数，多个排序参数时按优先级：avgResponseTime > count > errorCount > errorRate

**使用示例：**
```http
# 按平均响应时间升序
GET /api/statistics/api-performance?avgResponseTime=ascend

# 按调用次数降序
GET /api/statistics/api-performance?count=desc

# 按错误率升序
GET /api/statistics/api-performance?errorRate=asc

# 不排序（默认）
GET /api/statistics/api-performance
```

**响应示例：**
```json
{
  "code": 0,
  "message": "获取API性能统计成功",
  "data": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "sortParam": "avgResponseTime=ascend",
    "list": [
      {
        "_id": "GET_/api/users",
        "path": "/api/users",
        "method": "GET",
        "count": 150,
        "avgResponseTime": 180.5,
        "maxResponseTime": 500,
        "minResponseTime": 50,
        "errorCount": 3,
        "errorRate": 2.0,
        "totalRequestSize": 15000,
        "totalResponseSize": 75000,
        "lastCall": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**排序功能说明：**
- `avgResponseTime`: 按平均响应时间排序
- `count`: 按调用次数排序
- `errorCount`: 按错误次数排序
- `errorRate`: 按错误率排序
- 排序方向：`asc`/`ascend` 为升序，`desc`/`descend` 为降序
- **默认行为**：不指定排序参数时，数据按数据库自然顺序返回，不进行排序

### 实时统计
```http
GET /api/statistics/realtime
```
获取实时统计信息，需要管理员权限。

### 统计概览
```http
GET /api/statistics/overview
```
获取综合统计概览，需要管理员权限。

**响应数据包含：**
- `summary`: 系统总体统计摘要
- `recentActivity`: 最近活动统计
- `topPages`: 热门页面列表
- `topUsers`: 活跃用户列表（包含最后访问时间）
- `usersLastActivity`: 所有用户的最后访问时间列表

**响应示例：**
```json
{
  "code": 0,
  "message": "获取统计概览成功",
  "data": {
    "summary": {
      "totalUsers": 100,
      "activeUsers": 85,
      "totalActions": 1500,
      "totalErrors": 15,
      "errorRate": 1.0,
      "avgResponseTime": 250
    },
    "recentActivity": {
      "today": { "pageViews": 120, "apiCalls": 80, "logins": 5, "errors": 2 },
      "week": { "pageViews": 850, "apiCalls": 600, "logins": 25, "errors": 12 },
      "month": { "pageViews": 3200, "apiCalls": 2400, "logins": 100, "errors": 45 }
    },
    "topPages": [
      {
        "path": "/dashboard",
        "title": "仪表板",
        "count": 150,
        "uniqueUsers": 45,
        "avgResponseTime": 180,
        "errorCount": 2,
        "errorRate": 1.33,
        "lastAccess": "2024-01-15T10:30:00.000Z"
      }
    ],
    "topUsers": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "username": "admin",
        "totalActions": 85,
        "lastActivity": "2024-01-15T10:30:00.000Z"
      }
    ],
    "usersLastActivity": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "username": "admin",
        "lastActivity": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "username": "user1",
        "lastActivity": "2024-01-15T09:15:00.000Z"
      }
    ]
  }
}
```

### 清理旧数据
```http
POST /api/statistics/cleanup
Content-Type: application/json

{
  "daysToKeep": 90
}
```
清理指定天数之前的旧数据，需要管理员权限。

## 数据模型

### Statistics 模型字段

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | ObjectId | 用户ID |
| username | String | 用户名 |
| type | String | 统计类型 |
| action | String | 具体操作 |
| path | String | 资源路径 |
| method | String | HTTP方法 |
| statusCode | Number | 响应状态码 |
| responseTime | Number | 响应时间(毫秒) |
| requestSize | Number | 请求大小(字节) |
| responseSize | Number | 响应大小(字节) |
| ipAddress | String | IP地址 |
| userAgent | String | 用户代理 |
| referer | String | 来源页面 |
| metadata | Object | 额外数据 |
| error | Object | 错误信息 |
| sessionId | String | 会话ID |

## 中间件功能

### 自动统计中间件
系统自动为所有请求添加统计中间件，包括：
- 页面访问统计
- API调用统计
- 性能监控
- 错误统计

### 性能监控
- 自动检测慢请求（>1秒）
- 记录响应时间
- 监控请求大小

## 定时任务

### 数据清理
- 每天凌晨2点自动清理90天前的旧数据
- 可通过API手动触发清理
- 支持自定义保留天数

## 使用示例

### 1. 获取系统统计
```javascript
const response = await fetch('/api/statistics/system', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
```

### 2. 获取用户统计
```javascript
const userId = '507f1f77bcf86cd799439011' // 替换为实际的用户ID
const response = await fetch(`/api/statistics/user/${userId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
```

### 3. 获取实时统计
```javascript
const response = await fetch('/api/statistics/realtime', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
```

## 测试

运行测试脚本：
```bash
npm run test:statistics
```

或者直接运行：
```bash
node scripts/test-statistics.js
```

## 配置

### 环境变量
- `STATISTICS_ENABLED`: 是否启用统计功能（默认: true）
- `STATISTICS_CLEANUP_DAYS`: 数据保留天数（默认: 90）

### 中间件配置
统计中间件在 `src/app.js` 中自动配置，无需额外设置。

## 注意事项

1. **性能影响**: 统计功能会轻微影响系统性能，建议在生产环境中监控
2. **存储空间**: 统计数据会占用数据库空间，定期清理很重要
3. **隐私保护**: 统计数据包含用户行为信息，注意隐私保护
4. **权限控制**: 大部分统计API需要管理员权限

## 故障排除

### 常见问题

1. **统计数据不准确**
   - 检查中间件是否正确配置
   - 确认数据库连接正常

2. **性能问题**
   - 检查数据库索引
   - 考虑增加清理频率

3. **权限错误**
   - 确认用户具有管理员权限
   - 检查JWT token是否有效

## 扩展功能

### 自定义统计
可以通过 `StatisticsService.recordActivity()` 方法记录自定义统计：

```javascript
import StatisticsService from '../services/statistics.js'

await StatisticsService.recordActivity({
  userId: user._id,
  username: user.username,
  type: 'custom_action',
  action: 'export_data',
  path: '/api/export',
  method: 'POST',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  metadata: { fileName: 'report.xlsx' }
})
``` 