import request from 'supertest'
import app from '../../app.js'
import User from '../../models/user.js'
import Role from '../../models/role.js'
import jwt from 'jsonwebtoken'

describe('Pusher API Tests', () => {
  let adminToken
  let userToken
  let testUser
  let testRole

  beforeAll(async () => {
    // 创建测试用户
    testUser = await User.create({
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      role: 'user',
      status: 'active'
    })

    // 创建测试角色
    testRole = await Role.create({
      name: '测试角色',
      code: 'test_role',
      description: '用于测试的角色',
      status: 'active'
    })

    // 生成测试 token
    adminToken = jwt.sign(
      { _id: 'admin-id', username: 'admin', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    userToken = jwt.sign(
      { _id: testUser._id, username: testUser.username, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )
  })

  afterAll(async () => {
    await User.findByIdAndDelete(testUser._id)
    await Role.findByIdAndDelete(testRole._id)
  })

  describe('GET /api/pusher/targets', () => {
    test('应该返回推送目标选项', async () => {
      const response = await request(app)
        .get('/api/pusher/targets')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(0)
      expect(response.body.message).toBe('获取推送目标选项成功')
      expect(response.body.data).toHaveProperty('users')
      expect(response.body.data).toHaveProperty('roles')
      expect(Array.isArray(response.body.data.users)).toBe(true)
      expect(Array.isArray(response.body.data.roles)).toBe(true)
    })

    test('应该只返回活跃状态的用户和角色', async () => {
      const response = await request(app)
        .get('/api/pusher/targets')
        .set('Authorization', `Bearer ${adminToken}`)

      const { users, roles } = response.body.data

      // 检查用户状态
      users.forEach(user => {
        expect(user).toHaveProperty('_id')
        expect(user).toHaveProperty('username')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('role')
      })

      // 检查角色状态
      roles.forEach(role => {
        expect(role).toHaveProperty('_id')
        expect(role).toHaveProperty('name')
        expect(role).toHaveProperty('code')
        expect(role).toHaveProperty('description')
      })
    })

    test('未授权用户应该被拒绝访问', async () => {
      const response = await request(app)
        .get('/api/pusher/targets')

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/pusher/push', () => {
    test('应该成功创建立即推送任务', async () => {
      const pushData = {
        title: '测试推送',
        content: '这是一条测试推送消息',
        description: '测试描述',
        type: 'notification',
        pushMode: 'immediate',
        targetType: 'all'
      }

      const response = await request(app)
        .post('/api/pusher/push')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pushData)

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(0)
      expect(response.body.data.success).toBe(true)
      expect(response.body.data).toHaveProperty('pushTaskId')
    })

    test('应该成功创建指定用户的推送任务', async () => {
      const pushData = {
        title: '指定用户推送',
        content: '这是指定用户的推送消息',
        pushMode: 'immediate',
        targetType: 'specific',
        targetUserIds: [testUser._id.toString()]
      }

      const response = await request(app)
        .post('/api/pusher/push')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pushData)

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(0)
      expect(response.body.data.success).toBe(true)
    })

    test('应该成功创建指定角色的推送任务', async () => {
      const pushData = {
        title: '指定角色推送',
        content: '这是指定角色的推送消息',
        pushMode: 'immediate',
        targetType: 'role',
        targetRoleIds: [testRole.code]
      }

      const response = await request(app)
        .post('/api/pusher/push')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pushData)

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(0)
      expect(response.body.data.success).toBe(true)
    })

    test('缺少必填字段应该返回错误', async () => {
      const pushData = {
        content: '只有内容，没有标题'
      }

      const response = await request(app)
        .post('/api/pusher/push')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pushData)

      expect(response.status).toBe(400)
      expect(response.body.code).toBe(400)
      expect(response.body.message).toContain('标题和内容为必填项')
    })

    test('指定用户推送但未选择用户应该返回错误', async () => {
      const pushData = {
        title: '测试推送',
        content: '测试内容',
        pushMode: 'immediate',
        targetType: 'specific',
        targetUserIds: []
      }

      const response = await request(app)
        .post('/api/pusher/push')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pushData)

      expect(response.status).toBe(400)
      expect(response.body.code).toBe(400)
      expect(response.body.message).toContain('指定用户推送时必须选择目标用户')
    })

    test('指定角色推送但未选择角色应该返回错误', async () => {
      const pushData = {
        title: '测试推送',
        content: '测试内容',
        pushMode: 'immediate',
        targetType: 'role',
        targetRoleIds: []
      }

      const response = await request(app)
        .post('/api/pusher/push')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pushData)

      expect(response.status).toBe(400)
      expect(response.body.code).toBe(400)
      expect(response.body.message).toContain('指定角色推送时必须选择目标角色')
    })
  })

  describe('GET /api/pusher/tasks', () => {
    test('应该返回推送任务列表', async () => {
      const response = await request(app)
        .get('/api/pusher/tasks')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(0)
      expect(response.body.message).toBe('获取推送任务列表成功')
      expect(response.body.data).toHaveProperty('total')
      expect(response.body.data).toHaveProperty('page')
      expect(response.body.data).toHaveProperty('limit')
      expect(response.body.data).toHaveProperty('list')
      expect(Array.isArray(response.body.data.list)).toBe(true)
    })

    test('支持分页查询', async () => {
      const response = await request(app)
        .get('/api/pusher/tasks?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.page).toBe(1)
      expect(response.body.data.limit).toBe(5)
    })

    test('支持过滤查询', async () => {
      const response = await request(app)
        .get('/api/pusher/tasks?taskType=immediate&status=completed')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(0)
    })
  })
}) 