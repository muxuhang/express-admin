import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../../models/user.js'
import Role from '../../models/role.js'

/**
 * 测试工具类
 */
export class TestUtils {
  /**
   * 创建测试用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 用户对象
   */
  static async createTestUser(userData = {}) {
    const defaultUser = {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      phone: '13800138000',
      role: 'user',
      status: 'active'
    }

    const user = { ...defaultUser, ...userData }
    
    // 加密密码
    const saltRounds = 10
    user.password = await bcrypt.hash(user.password, saltRounds)
    
    return await User.create(user)
  }

  /**
   * 创建测试角色
   * @param {Object} roleData - 角色数据
   * @returns {Promise<Object>} 角色对象
   */
  static async createTestRole(roleData = {}) {
    const defaultRole = {
      name: '测试角色',
      code: 'test_role',
      description: '测试用角色',
      permissions: ['view_profile'],
      status: 'active',
      isSystem: false
    }

    const role = { ...defaultRole, ...roleData }
    return await Role.create(role)
  }

  /**
   * 生成测试 JWT token
   * @param {Object} user - 用户对象
   * @returns {string} JWT token
   */
  static generateTestToken(user) {
    return jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    )
  }

  /**
   * 创建带认证的请求头
   * @param {Object} user - 用户对象
   * @returns {Object} 请求头对象
   */
  static createAuthHeaders(user) {
    const token = this.generateTestToken(user)
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * 模拟请求对象
   * @param {Object} options - 请求选项
   * @returns {Object} 模拟的请求对象
   */
  static mockRequest(options = {}) {
    const {
      method = 'GET',
      url = '/',
      body = {},
      query = {},
      params = {},
      headers = {},
      user = null
    } = options

    return {
      method,
      url,
      body,
      query,
      params,
      headers,
      user,
      ip: '127.0.0.1',
      get: (name) => headers[name],
      header: (name) => headers[name]
    }
  }

  /**
   * 模拟响应对象
   * @returns {Object} 模拟的响应对象
   */
  static mockResponse() {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.send = jest.fn().mockReturnValue(res)
    res.end = jest.fn().mockReturnValue(res)
    res.set = jest.fn().mockReturnValue(res)
    res.writeHead = jest.fn().mockReturnValue(res)
    res.write = jest.fn().mockReturnValue(res)
    res.writableEnded = false
    return res
  }

  /**
   * 模拟下一个中间件函数
   * @returns {Function} 模拟的 next 函数
   */
  static mockNext() {
    return jest.fn()
  }

  /**
   * 等待指定时间
   * @param {number} ms - 毫秒数
   * @returns {Promise} Promise 对象
   */
  static async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 验证响应状态码
   * @param {Object} res - 响应对象
   * @param {number} expectedStatus - 期望的状态码
   */
  static expectStatus(res, expectedStatus) {
    expect(res.status).toHaveBeenCalledWith(expectedStatus)
  }

  /**
   * 验证响应 JSON 数据
   * @param {Object} res - 响应对象
   * @param {Object} expectedData - 期望的数据
   */
  static expectJson(res, expectedData) {
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining(expectedData))
  }

  /**
   * 验证响应包含错误信息
   * @param {Object} res - 响应对象
   * @param {string} expectedMessage - 期望的错误信息
   */
  static expectError(res, expectedMessage) {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(expectedMessage)
      })
    )
  }
}

/**
 * 数据库测试工具
 */
export class DatabaseUtils {
  /**
   * 清理指定集合
   * @param {string} collectionName - 集合名称
   */
  static async clearCollection(collectionName) {
    const collection = mongoose.connection.collections[collectionName]
    if (collection) {
      await collection.deleteMany({})
    }
  }

  /**
   * 清理所有集合
   */
  static async clearAllCollections() {
    const collections = mongoose.connection.collections
    for (const key in collections) {
      const collection = collections[key]
      await collection.deleteMany({})
    }
  }

  /**
   * 获取集合中的文档数量
   * @param {string} collectionName - 集合名称
   * @returns {number} 文档数量
   */
  static async getCollectionCount(collectionName) {
    const collection = mongoose.connection.collections[collectionName]
    return collection ? await collection.countDocuments() : 0
  }
}

/**
 * 断言工具
 */
export class AssertUtils {
  /**
   * 验证用户对象结构
   * @param {Object} user - 用户对象
   */
  static expectUserStructure(user) {
    expect(user).toHaveProperty('_id')
    expect(user).toHaveProperty('username')
    expect(user).toHaveProperty('email')
    expect(user).toHaveProperty('phone')
    expect(user).toHaveProperty('role')
    expect(user).toHaveProperty('status')
    expect(user).toHaveProperty('createdAt')
    expect(user).toHaveProperty('updatedAt')
    expect(user).not.toHaveProperty('password')
  }

  /**
   * 验证角色对象结构
   * @param {Object} role - 角色对象
   */
  static expectRoleStructure(role) {
    expect(role).toHaveProperty('_id')
    expect(role).toHaveProperty('name')
    expect(role).toHaveProperty('code')
    expect(role).toHaveProperty('description')
    expect(role).toHaveProperty('permissions')
    expect(role).toHaveProperty('status')
    expect(role).toHaveProperty('isSystem')
    expect(role).toHaveProperty('createdAt')
    expect(role).toHaveProperty('updatedAt')
  }

  /**
   * 验证分页响应结构
   * @param {Object} response - 响应对象
   */
  static expectPaginationStructure(response) {
    expect(response).toHaveProperty('code')
    expect(response).toHaveProperty('message')
    expect(response).toHaveProperty('data')
    expect(response.data).toHaveProperty('total')
    expect(response.data).toHaveProperty('page')
    expect(response.data).toHaveProperty('limit')
    expect(response.data).toHaveProperty('list')
    expect(Array.isArray(response.data.list)).toBe(true)
  }
} 