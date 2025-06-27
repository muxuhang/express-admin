// 必须在 import 之前 mock
jest.mock('../../models/user.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}))
jest.mock('../../models/role.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn()
  }
}))

// 工具函数：mock User.findById().select()
function mockUserFindById(user) {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue(user)
  })
}

import authLogin from '../authLogin.js'
import { TestUtils } from '../../tests/helpers/testUtils.js'
import jwt from 'jsonwebtoken'
import User from '../../models/user.js'
import Role from '../../models/role.js'
import 'regenerator-runtime/runtime'

// Mock JWT
jest.mock('jsonwebtoken')

describe('authLogin Middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = TestUtils.mockRequest()
    res = TestUtils.mockResponse()
    next = TestUtils.mockNext()
    jest.clearAllMocks()
  })

  describe('Token 验证', () => {
    test('应该在没有 token 时返回 401 错误', async () => {
      await authLogin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        code: 401,
        message: '未提供认证令牌'
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('应该在 token 格式错误时返回 401 错误', async () => {
      req.headers.authorization = 'InvalidToken'
      
      // Mock JWT verify to throw JsonWebTokenError
      jwt.verify.mockImplementation(() => {
        const error = new Error('Invalid token format')
        error.name = 'JsonWebTokenError'
        throw error
      })

      await authLogin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        code: 401,
        message: '无效的认证令牌'
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('应该在 JWT 验证失败时返回 401 错误', async () => {
      req.headers.authorization = 'Bearer invalid-token'
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await authLogin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        code: 500,
        message: '认证失败',
        error: 'Invalid token'
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('应该在 JWT 过期时返回 401 错误', async () => {
      req.headers.authorization = 'Bearer expired-token'
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired')
        error.name = 'TokenExpiredError'
        throw error
      })

      await authLogin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        code: 401,
        message: '认证令牌已过期'
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('应该在 JWT 格式错误时返回 401 错误', async () => {
      req.headers.authorization = 'Bearer malformed-token'
      jwt.verify.mockImplementation(() => {
        const error = new Error('Invalid token format')
        error.name = 'JsonWebTokenError'
        throw error
      })

      await authLogin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        code: 401,
        message: '无效的认证令牌'
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('用户验证', () => {
    test('应该在用户不存在时返回 401 错误', async () => {
      req.headers.authorization = 'Bearer valid-token'
      jwt.verify.mockReturnValue({ userId: 'nonexistent-id' })

      // Mock User.findById().select() to return null
      mockUserFindById(null)

      await authLogin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        code: 401,
        message: '用户不存在'
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('应该在用户被停用时返回 403 错误', async () => {
      req.headers.authorization = 'Bearer valid-token'
      jwt.verify.mockReturnValue({ userId: 'user-id' })

      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        status: 'inactive'
      }

      mockUserFindById(mockUser)

      await authLogin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        code: 403,
        message: '用户已被停用'
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('角色验证', () => {
    test('应该在角色被停用时返回 403 错误', async () => {
      req.headers.authorization = 'Bearer valid-token'
      jwt.verify.mockReturnValue({ userId: 'user-id' })

      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        status: 'active',
        role: 'inactive-role'
      }

      const mockRole = {
        code: 'inactive-role',
        status: 'inactive'
      }

      mockUserFindById(mockUser)
      Role.findOne.mockResolvedValue(mockRole)

      await authLogin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        code: 403,
        message: '用户角色已被停用'
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('应该在角色不存在时继续执行', async () => {
      req.headers.authorization = 'Bearer valid-token'
      jwt.verify.mockReturnValue({ userId: 'user-id' })

      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        status: 'active',
        role: 'nonexistent-role'
      }

      mockUserFindById(mockUser)
      Role.findOne.mockResolvedValue(null)

      await authLogin(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.user).toEqual(mockUser)
    })
  })

  describe('成功认证', () => {
    test('应该在所有验证通过时调用 next()', async () => {
      req.headers.authorization = 'Bearer valid-token'
      jwt.verify.mockReturnValue({ userId: 'user-id' })

      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        status: 'active',
        role: 'active-role'
      }

      const mockRole = {
        code: 'active-role',
        status: 'active'
      }

      mockUserFindById(mockUser)
      Role.findOne.mockResolvedValue(mockRole)

      await authLogin(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.user).toEqual(mockUser)
      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    })

    test('应该在用户没有角色时继续执行', async () => {
      req.headers.authorization = 'Bearer valid-token'
      jwt.verify.mockReturnValue({ userId: 'user-id' })

      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        status: 'active',
        role: null
      }

      mockUserFindById(mockUser)

      await authLogin(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.user).toEqual(mockUser)
    })
  })

  describe('错误处理', () => {
    test('应该在数据库查询错误时返回 500 错误', async () => {
      req.headers.authorization = 'Bearer valid-token'
      jwt.verify.mockReturnValue({ userId: 'user-id' })

      // 用 mockImplementation 抛出异常
      User.findById.mockReturnValue({
        select: jest.fn().mockImplementation(() => { throw new Error('Database error') })
      })

      await authLogin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        code: 500,
        message: '认证失败',
        error: 'Database error'
      })
      expect(next).not.toHaveBeenCalled()
    })
  })
}) 