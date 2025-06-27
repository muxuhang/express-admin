import request from 'supertest'
import app from '../../app.js'
import { TestUtils, AssertUtils } from '../../tests/helpers/testUtils.js'
import 'regenerator-runtime/runtime'

describe('Users API', () => {
  let adminUser, normalUser, adminToken, userToken

  beforeAll(async () => {
    // 创建测试用户
    adminUser = await TestUtils.createTestUser({
      username: 'admin',
      email: 'admin@test.com',
      phone: '13800138001',
      role: 'admin'
    })

    normalUser = await TestUtils.createTestUser({
      username: 'normaluser',
      email: 'normal@test.com',
      phone: '13800138002',
      role: 'user'
    })

    adminToken = TestUtils.generateTestToken(adminUser)
    userToken = TestUtils.generateTestToken(normalUser)
  })

  describe('GET /api/users', () => {
    test('应该返回用户列表', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.code).toBe(0)
      expect(response.body.message).toBe('获取用户列表成功')
      AssertUtils.expectPaginationStructure(response.body)
      expect(response.body.data.list.length).toBeGreaterThan(0)
    })

    test('应该支持分页查询', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.page).toBe(1)
      expect(response.body.data.limit).toBe(5)
      expect(response.body.data.list.length).toBeLessThanOrEqual(5)
    })

    test('应该支持关键词搜索', async () => {
      const response = await request(app)
        .get('/api/users?keyword=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.list.some(user => 
        user.username.includes('admin') || 
        user.email.includes('admin')
      )).toBe(true)
    })

    test('应该支持状态筛选', async () => {
      const response = await request(app)
        .get('/api/users?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.list.every(user => 
        user.status === 'active'
      )).toBe(true)
    })

    test('应该在没有认证时返回 401 错误', async () => {
      await request(app)
        .get('/api/users')
        .expect(401)
    })
  })

  describe('GET /api/users/:id', () => {
    test('应该返回指定用户信息', async () => {
      const response = await request(app)
        .get(`/api/users/${normalUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.code).toBe(0)
      expect(response.body.message).toBe('获取用户信息成功')
      AssertUtils.expectUserStructure(response.body.data)
      expect(response.body.data._id).toBe(normalUser._id.toString())
    })

    test('应该在用户不存在时返回 404 错误', async () => {
      const fakeId = '507f1f77bcf86cd799439011'
      await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })

    test('应该在没有认证时返回 401 错误', async () => {
      await request(app)
        .get(`/api/users/${normalUser._id}`)
        .expect(401)
    })
  })

  describe('POST /api/users', () => {
    test('应该创建新用户', async () => {
      const newUserData = {
        username: 'newuser',
        password: 'password123',
        email: 'newuser@test.com',
        phone: '13800138003',
        role: 'user',
        status: 'active'
      }

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(200)

      expect(response.body.code).toBe(0)
      expect(response.body.message).toBe('创建用户成功')
      AssertUtils.expectUserStructure(response.body.data)
      expect(response.body.data.username).toBe(newUserData.username)
      expect(response.body.data.email).toBe(newUserData.email)
      expect(response.body.data.phone).toBe(newUserData.phone)
      expect(response.body.data.role).toBe(newUserData.role)
      expect(response.body.data.status).toBe(newUserData.status)
    })

    test('应该在用户名重复时返回错误', async () => {
      const duplicateUserData = {
        username: 'admin', // 已存在的用户名
        password: 'password123',
        email: 'duplicate@test.com',
        phone: '13800138004',
        role: 'user'
      }

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUserData)
        .expect(400)

      expect(response.body.code).toBe(400)
      expect(response.body.message).toContain('已存在')
    })

    test('应该在邮箱重复时返回错误', async () => {
      const duplicateUserData = {
        username: 'duplicateuser',
        password: 'password123',
        email: 'admin@test.com', // 已存在的邮箱
        phone: '13800138005',
        role: 'user'
      }

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUserData)
        .expect(400)

      expect(response.body.code).toBe(400)
      expect(response.body.message).toContain('已存在')
    })

    test('应该在手机号重复时返回错误', async () => {
      const duplicateUserData = {
        username: 'duplicateuser',
        password: 'password123',
        email: 'duplicate@test.com',
        phone: '13800138001', // 已存在的手机号
        role: 'user'
      }

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUserData)
        .expect(400)

      expect(response.body.code).toBe(400)
      expect(response.body.message).toContain('已存在')
    })

    test('应该在数据验证失败时返回错误', async () => {
      const invalidUserData = {
        username: '', // 空用户名
        password: '123', // 密码太短
        email: 'invalid-email', // 无效邮箱
        phone: '123', // 无效手机号
        role: 'invalid-role' // 无效角色
      }

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUserData)
        .expect(400)

      expect(response.body.code).toBe(400)
      expect(response.body.message).toContain('错误')
    })
  })

  describe('PUT /api/users/:id', () => {
    test('应该更新用户信息', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@test.com',
        phone: '13800138006',
        role: 'user',
        status: 'active'
      }

      const response = await request(app)
        .put(`/api/users/${normalUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.code).toBe(0)
      expect(response.body.message).toBe('更新用户成功')
      expect(response.body.data.username).toBe(updateData.username)
      expect(response.body.data.email).toBe(updateData.email)
      expect(response.body.data.phone).toBe(updateData.phone)
    })

    test('应该在用户不存在时返回 404 错误', async () => {
      const fakeId = '507f1f77bcf86cd799439011'
      const updateData = {
        username: 'updateduser',
        email: 'updated@test.com'
      }

      await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404)
    })

    test('应该在用户名重复时返回错误', async () => {
      const updateData = {
        username: 'admin' // 已存在的用户名
      }

      const response = await request(app)
        .put(`/api/users/${normalUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400)

      expect(response.body.code).toBe(400)
      expect(response.body.message).toContain('已存在')
    })
  })

  describe('DELETE /api/users/:id', () => {
    test('应该删除用户', async () => {
      const userToDelete = await TestUtils.createTestUser({
        username: 'todelete',
        email: 'todelete@test.com',
        phone: '13800138007'
      })

      const response = await request(app)
        .delete(`/api/users/${userToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.code).toBe(0)
      expect(response.body.message).toBe('删除用户成功')
    })

    test('应该在用户不存在时返回 404 错误', async () => {
      const fakeId = '507f1f77bcf86cd799439011'

      await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })
  })

  describe('PATCH /api/users/:id/status', () => {
    test('应该停用用户', async () => {
      const userToDeactivate = await TestUtils.createTestUser({
        username: 'todeactivate',
        email: 'todeactivate@test.com',
        phone: '13800138008'
      })

      const response = await request(app)
        .patch(`/api/users/${userToDeactivate._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' })
        .expect(200)

      expect(response.body.code).toBe(0)
      expect(response.body.message).toBe('用户停用成功')
      expect(response.body.data.status).toBe('inactive')
    })

    test('应该重新启用用户', async () => {
      const userToActivate = await TestUtils.createTestUser({
        username: 'toactivate',
        email: 'toactivate@test.com',
        phone: '13800138009',
        status: 'inactive'
      })

      const response = await request(app)
        .patch(`/api/users/${userToActivate._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' })
        .expect(200)

      expect(response.body.code).toBe(0)
      expect(response.body.message).toBe('用户启用成功')
      expect(response.body.data.status).toBe('active')
    })

    test('应该在用户不存在时返回 404 错误', async () => {
      const fakeId = '507f1f77bcf86cd799439011'

      await request(app)
        .patch(`/api/users/${fakeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' })
        .expect(404)
    })
  })

  describe('GET /api/users-roles', () => {
    test('应该返回可用角色列表', async () => {
      const response = await request(app)
        .get('/api/users-roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.code).toBe(0)
      expect(response.body.message).toBe('获取角色列表成功')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      
      // 验证角色结构
      response.body.data.forEach(role => {
        expect(role).toHaveProperty('_id')
        expect(role).toHaveProperty('name')
        expect(role).toHaveProperty('code')
        expect(role).toHaveProperty('description')
        expect(role.status).toBe('active')
      })
    })
  })
}) 