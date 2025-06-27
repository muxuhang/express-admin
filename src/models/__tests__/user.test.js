import User from '../user.js'
import { TestUtils, AssertUtils } from '../../tests/helpers/testUtils.js'

describe('User Model', () => {
  describe('Schema Validation', () => {
    test('应该创建有效的用户', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        phone: '13800138000',
        role: 'user',
        status: 'active'
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser._id).toBeDefined()
      expect(savedUser.username).toBe(userData.username)
      expect(savedUser.email).toBe(userData.email)
      expect(savedUser.phone).toBe(userData.phone)
      expect(savedUser.role).toBe(userData.role)
      expect(savedUser.status).toBe(userData.status)
    })

    test('用户名是必填字段', async () => {
      const userData = {
        password: 'password123',
        email: 'test@example.com',
        phone: '13800138000'
      }

      const user = new User(userData)
      let error

      try {
        await user.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
      expect(error.errors.username).toBeDefined()
    })

    test('用户名必须是唯一的', async () => {
      const userData = {
        username: 'duplicateuser',
        password: 'password123',
        email: 'test1@example.com',
        phone: '13800138001'
      }

      await User.create(userData)

      const duplicateUser = new User({
        username: 'duplicateuser',
        password: 'password123',
        email: 'test2@example.com',
        phone: '13800138002'
      })

      let error
      try {
        await duplicateUser.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
      expect(error.code).toBe(11000) // MongoDB 重复键错误码
    })

    test('邮箱必须是唯一的', async () => {
      const userData = {
        username: 'user1',
        password: 'password123',
        email: 'duplicate@example.com',
        phone: '13800138001'
      }

      await User.create(userData)

      const duplicateUser = new User({
        username: 'user2',
        password: 'password123',
        email: 'duplicate@example.com',
        phone: '13800138002'
      })

      let error
      try {
        await duplicateUser.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
      expect(error.code).toBe(11000)
    })

    test('手机号必须是唯一的', async () => {
      const userData = {
        username: 'user1',
        password: 'password123',
        email: 'test1@example.com',
        phone: '13800138000'
      }

      await User.create(userData)

      const duplicateUser = new User({
        username: 'user2',
        password: 'password123',
        email: 'test2@example.com',
        phone: '13800138000'
      })

      let error
      try {
        await duplicateUser.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
      expect(error.code).toBe(11000)
    })

    test('手机号格式验证', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        phone: 'invalid-phone'
      }

      const user = new User(userData)
      let error

      try {
        await user.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
      expect(error.errors.phone).toBeDefined()
    })

    test('邮箱格式验证', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'invalid-email',
        phone: '13800138000'
      }

      const user = new User(userData)
      let error

      try {
        await user.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
      expect(error.errors.email).toBeDefined()
    })
  })

  describe('默认值', () => {
    test('应该设置默认状态为 active', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        phone: '13800138000'
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.status).toBe('active')
    })

    test('应该设置默认角色为 user', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        phone: '13800138000'
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.role).toBe('user')
    })
  })

  describe('时间戳', () => {
    test('应该自动设置 createdAt 和 updatedAt', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        phone: '13800138000'
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.createdAt).toBeDefined()
      expect(savedUser.updatedAt).toBeDefined()
      expect(savedUser.createdAt).toBeInstanceOf(Date)
      expect(savedUser.updatedAt).toBeInstanceOf(Date)
    })

    test('更新时应该更新 updatedAt', async () => {
      const user = await TestUtils.createTestUser()
      const originalUpdatedAt = user.updatedAt

      await TestUtils.wait(1000) // 等待1秒确保时间差异

      user.username = 'updateduser'
      await user.save()

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe('密码处理', () => {
    test('密码应该被加密存储', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        phone: '13800138000'
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.password).not.toBe(userData.password)
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/) // bcrypt 格式
    })
  })

  describe('实例方法', () => {
    test('comparePassword 应该正确比较密码', async () => {
      const user = await TestUtils.createTestUser({
        password: 'testpassword'
      })

      const isMatch = await user.comparePassword('testpassword')
      const isNotMatch = await user.comparePassword('wrongpassword')

      expect(isMatch).toBe(true)
      expect(isNotMatch).toBe(false)
    })
  })

  describe('静态方法', () => {
    test('findByUsername 应该找到用户', async () => {
      const user = await TestUtils.createTestUser({
        username: 'findme'
      })

      const foundUser = await User.findByUsername('findme')
      expect(foundUser).toBeDefined()
      expect(foundUser._id.toString()).toBe(user._id.toString())
    })

    test('findByUsername 应该返回 null 当用户不存在', async () => {
      const foundUser = await User.findByUsername('nonexistent')
      expect(foundUser).toBeNull()
    })
  })
}) 