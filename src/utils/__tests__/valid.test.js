import {
  isValidUsername,
  isValidPassword,
  isValidEmail,
  isValidPhone,
  isEmpty
} from '../valid.js'

describe('Validation Utils', () => {
  describe('isEmpty', () => {
    test('应该正确识别空字符串', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('   ')).toBe(true)
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
    })

    test('应该正确识别非空字符串', () => {
      expect(isEmpty('hello')).toBe(false)
      expect(isEmpty('  hello  ')).toBe(false)
      expect(isEmpty('123')).toBe(false)
    })
  })

  describe('isValidUsername', () => {
    test('应该接受有效的用户名', () => {
      expect(isValidUsername('admin')).toBe(true)
      expect(isValidUsername('user123')).toBe(true)
      expect(isValidUsername('test_user')).toBe(true)
      expect(isValidUsername('a'.repeat(32))).toBe(true) // 最大长度
    })

    test('应该拒绝无效的用户名', () => {
      expect(isValidUsername('')).toBe(false)
      expect(isValidUsername('ab')).toBe(false) // 太短
      expect(isValidUsername('a'.repeat(33))).toBe(false) // 太长
      expect(isValidUsername(null)).toBe(false)
      expect(isValidUsername(undefined)).toBe(false)
      expect(isValidUsername(123)).toBe(false)
    })
  })

  describe('isValidPassword', () => {
    test('应该接受有效的密码', () => {
      expect(isValidPassword('password123')).toBe(true)
      expect(isValidPassword('123456')).toBe(true) // 最小长度
      expect(isValidPassword('a'.repeat(100))).toBe(true) // 长密码
    })

    test('应该拒绝无效的密码', () => {
      expect(isValidPassword('')).toBe(false)
      expect(isValidPassword('12345')).toBe(false) // 太短
      expect(isValidPassword(null)).toBe(false)
      expect(isValidPassword(undefined)).toBe(false)
      expect(isValidPassword(123)).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    test('应该接受有效的邮箱', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.org')).toBe(true)
      expect(isValidEmail('123@456.com')).toBe(true)
      expect(isValidEmail('user-name@domain.com')).toBe(true)
      expect(isValidEmail('user_name@domain.com')).toBe(true)
    })

    test('应该拒绝无效的邮箱', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false) // 缺少用户名
      expect(isValidEmail('user@')).toBe(false) // 缺少域名
      expect(isValidEmail('user@.com')).toBe(false) // 缺少域名
    })

    test('应该处理边界情况', () => {
      expect(isValidEmail(null)).toBe(false)
      expect(isValidEmail(undefined)).toBe(false)
      expect(isValidEmail(123)).toBe(false)
      expect(isValidEmail({})).toBe(false)
    })

    test('应该接受空值（可选字段）', () => {
      expect(isValidEmail('')).toBe(true) // 当前实现允许空值
      expect(isValidEmail(null)).toBe(false)
      expect(isValidEmail(undefined)).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    test('应该接受有效的手机号', () => {
      expect(isValidPhone('13800138000')).toBe(true)
      expect(isValidPhone('18612345678')).toBe(true)
      expect(isValidPhone('19987654321')).toBe(true)
    })

    test('应该拒绝无效的手机号', () => {
      expect(isValidPhone('')).toBe(false)
      expect(isValidPhone('1234567890')).toBe(false) // 不是11位
      expect(isValidPhone('123456789012')).toBe(false) // 超过11位
      expect(isValidPhone('02345678901')).toBe(false) // 不以1开头
      expect(isValidPhone('22345678901')).toBe(false) // 不以1开头
    })

    test('应该处理边界情况', () => {
      expect(isValidPhone(null)).toBe(false)
      expect(isValidPhone(undefined)).toBe(false)
      expect(isValidPhone(123)).toBe(false)
      expect(isValidPhone({})).toBe(false)
    })
  })

  describe('综合测试', () => {
    test('应该正确处理有效数据', () => {
      const validUserData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        phone: '13800138000'
      }

      expect(isValidUsername(validUserData.username)).toBe(true)
      expect(isValidPassword(validUserData.password)).toBe(true)
      expect(isValidEmail(validUserData.email)).toBe(true)
      expect(isValidPhone(validUserData.phone)).toBe(true)
    })

    test('应该正确处理无效数据', () => {
      const invalidUserData = {
        username: 'ab', // 太短
        password: '123', // 太短
        email: 'invalid-email', // 无效邮箱
        phone: '1234567890' // 不是11位
      }

      expect(isValidUsername(invalidUserData.username)).toBe(false)
      expect(isValidPassword(invalidUserData.password)).toBe(false)
      expect(isValidEmail(invalidUserData.email)).toBe(false)
      expect(isValidPhone(invalidUserData.phone)).toBe(false)
    })
  })
}) 