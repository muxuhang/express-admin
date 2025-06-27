# 测试文档

## 概述

本项目使用 Jest 作为测试框架，提供完整的单元测试、集成测试和 API 测试覆盖。

## 测试结构

```
src/tests/
├── setup.js                 # 测试环境设置
├── helpers/
│   └── testUtils.js         # 测试工具函数
├── __tests__/               # 测试文件目录
│   ├── models/              # 模型测试
│   ├── middleware/          # 中间件测试
│   ├── routes/              # 路由测试
│   └── utils/               # 工具函数测试
└── README.md               # 本文档
```

## 运行测试

### 基本命令

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# CI 环境运行测试
npm run test:ci
```

### 运行特定测试

```bash
# 运行特定测试文件
npm test -- user.test.js

# 运行特定测试套件
npm test -- --testNamePattern="User Model"

# 运行特定目录的测试
npm test -- src/models/__tests__/
```

## 测试覆盖率

项目设置了以下覆盖率阈值：

- **语句覆盖率**: 70%
- **分支覆盖率**: 70%
- **函数覆盖率**: 70%
- **行覆盖率**: 70%

### 查看覆盖率报告

运行 `npm run test:coverage` 后，可以在以下位置查看报告：

- **HTML 报告**: `coverage/lcov-report/index.html`
- **控制台报告**: 终端输出
- **LCOV 报告**: `coverage/lcov.info`

## 测试类型

### 1. 单元测试

测试独立的函数、方法和类。

**示例**: `src/utils/__tests__/valid.test.js`

```javascript
describe('Validation Utils', () => {
  test('应该正确验证用户名', () => {
    expect(isValidUsername('admin')).toBe(true)
    expect(isValidUsername('')).toBe(false)
  })
})
```

### 2. 模型测试

测试 Mongoose 模型的数据验证、方法和静态函数。

**示例**: `src/models/__tests__/user.test.js`

```javascript
describe('User Model', () => {
  test('应该创建有效的用户', async () => {
    const user = new User(userData)
    const savedUser = await user.save()
    expect(savedUser._id).toBeDefined()
  })
})
```

### 3. 中间件测试

测试 Express 中间件的功能。

**示例**: `src/middleware/__tests__/authLogin.test.js`

```javascript
describe('authLogin Middleware', () => {
  test('应该在没有 token 时返回 401 错误', async () => {
    await authLogin(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
  })
})
```

### 4. 集成测试

测试 API 路由的完整功能。

**示例**: `src/routes/__tests__/users.test.js`

```javascript
describe('Users API', () => {
  test('应该返回用户列表', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    
    expect(response.body.code).toBe(0)
  })
})
```

## 测试工具

### TestUtils 类

提供常用的测试辅助方法：

```javascript
import { TestUtils } from '../helpers/testUtils.js'

// 创建测试用户
const user = await TestUtils.createTestUser({
  username: 'testuser',
  email: 'test@example.com'
})

// 生成测试 token
const token = TestUtils.generateTestToken(user)

// 创建认证请求头
const headers = TestUtils.createAuthHeaders(user)

// 模拟请求和响应对象
const req = TestUtils.mockRequest()
const res = TestUtils.mockResponse()
const next = TestUtils.mockNext()
```

### AssertUtils 类

提供常用的断言方法：

```javascript
import { AssertUtils } from '../helpers/testUtils.js'

// 验证用户对象结构
AssertUtils.expectUserStructure(user)

// 验证角色对象结构
AssertUtils.expectRoleStructure(role)

// 验证分页响应结构
AssertUtils.expectPaginationStructure(response)
```

### DatabaseUtils 类

提供数据库测试工具：

```javascript
import { DatabaseUtils } from '../helpers/testUtils.js'

// 清理指定集合
await DatabaseUtils.clearCollection('users')

// 清理所有集合
await DatabaseUtils.clearAllCollections()

// 获取集合文档数量
const count = await DatabaseUtils.getCollectionCount('users')
```

## 测试环境配置

### 环境变量

测试环境使用独立的配置：

```bash
# .env.test
NODE_ENV=test
MONGODB_URI_TEST=mongodb://localhost:27017/express-admin-test
JWT_SECRET=test-jwt-secret-key
```

### 数据库

- 使用独立的测试数据库
- 每个测试前自动清理数据
- 测试后删除整个数据库

### Mock 和 Stub

使用 Jest 的 mock 功能：

```javascript
// Mock 模块
jest.mock('jsonwebtoken')

// Mock 函数
jest.spyOn(User, 'findById').mockResolvedValue(mockUser)

// Mock 实现
jwt.verify.mockReturnValue({ userId: 'user-id' })
```

## 最佳实践

### 1. 测试命名

使用描述性的测试名称：

```javascript
// ✅ 好的命名
test('应该在用户名重复时返回错误')

// ❌ 不好的命名
test('test duplicate username')
```

### 2. 测试结构

使用 AAA 模式（Arrange, Act, Assert）：

```javascript
test('应该创建新用户', async () => {
  // Arrange - 准备数据
  const userData = { username: 'testuser', password: '123456' }
  
  // Act - 执行操作
  const response = await request(app)
    .post('/api/users')
    .send(userData)
  
  // Assert - 验证结果
  expect(response.status).toBe(200)
  expect(response.body.data.username).toBe(userData.username)
})
```

### 3. 测试隔离

确保测试之间相互独立：

```javascript
beforeEach(async () => {
  // 每个测试前清理数据
  await DatabaseUtils.clearAllCollections()
})
```

### 4. 错误测试

测试错误情况和边界条件：

```javascript
test('应该在数据无效时返回错误', async () => {
  const invalidData = { username: '', password: '123' }
  
  const response = await request(app)
    .post('/api/users')
    .send(invalidData)
    .expect(400)
  
  expect(response.body.message).toContain('错误')
})
```

## 持续集成

### GitHub Actions

项目配置了 GitHub Actions 进行自动化测试：

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:ci
```

### 覆盖率徽章

在 README.md 中显示测试覆盖率：

```markdown
![Tests](https://github.com/username/repo/workflows/Tests/badge.svg)
![Coverage](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)
```

## 故障排除

### 常见问题

1. **测试数据库连接失败**
   - 确保 MongoDB 服务正在运行
   - 检查测试数据库配置

2. **Jest 配置问题**
   - 确保 babel-jest 正确配置
   - 检查 ES6 模块支持

3. **测试超时**
   - 增加测试超时时间
   - 检查异步操作是否正确处理

### 调试测试

```bash
# 运行单个测试文件并显示详细输出
npm test -- user.test.js --verbose

# 使用 Node.js 调试器
node --inspect-brk node_modules/.bin/jest --runInBand user.test.js
```

## 贡献指南

### 添加新测试

1. 在相应的 `__tests__` 目录中创建测试文件
2. 使用描述性的测试名称
3. 确保测试覆盖所有主要功能
4. 添加错误情况的测试

### 测试代码审查

提交代码前确保：

- [ ] 所有测试通过
- [ ] 测试覆盖率不低于阈值
- [ ] 新功能有相应的测试
- [ ] 测试代码符合项目规范 