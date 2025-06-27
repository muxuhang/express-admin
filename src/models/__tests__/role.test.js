import Role from '../role.js'
import { TestUtils, AssertUtils } from '../../tests/helpers/testUtils.js'
import 'regenerator-runtime/runtime'

describe('Role Model', () => {
  describe('Schema Validation', () => {
    test('应该创建有效的角色', async () => {
      const roleData = {
        name: '测试角色',
        code: 'test_role',
        description: '这是一个测试角色',
        permissions: ['view_profile', 'edit_profile'],
        status: 'active',
        isSystem: false
      }

      const role = new Role(roleData)
      const savedRole = await role.save()

      expect(savedRole._id).toBeDefined()
      expect(savedRole.name).toBe(roleData.name)
      expect(savedRole.code).toBe(roleData.code)
      expect(savedRole.description).toBe(roleData.description)
      expect(savedRole.permissions).toEqual(roleData.permissions)
      expect(savedRole.status).toBe(roleData.status)
      expect(savedRole.isSystem).toBe(roleData.isSystem)
    })

    test('角色名称是必填字段', async () => {
      const roleData = {
        code: 'test_role',
        description: '这是一个测试角色',
        permissions: ['view_profile']
      }

      const role = new Role(roleData)
      let error

      try {
        await role.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
      expect(error.errors.name).toBeDefined()
    })

    test('角色编码是必填字段', async () => {
      const roleData = {
        name: '测试角色',
        description: '这是一个测试角色',
        permissions: ['view_profile']
      }

      const role = new Role(roleData)
      let error

      try {
        await role.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
      expect(error.errors.code).toBeDefined()
    })

    test('角色编码必须是唯一的', async () => {
      const roleData = {
        name: '测试角色1',
        code: 'duplicate_code',
        description: '第一个角色',
        permissions: ['view_profile']
      }

      await Role.create(roleData)

      const duplicateRole = new Role({
        name: '测试角色2',
        code: 'duplicate_code',
        description: '第二个角色',
        permissions: ['edit_profile']
      })

      let error
      try {
        await duplicateRole.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
      expect(error.code).toBe(11000) // MongoDB 重复键错误码
    })

    test('角色编码只能包含字母、数字和下划线', async () => {
      const roleData = {
        name: '测试角色',
        code: 'invalid-code-with-dashes',
        description: '这是一个测试角色',
        permissions: ['view_profile']
      }

      const role = new Role(roleData)
      let error

      try {
        await role.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
      expect(error.errors.code).toBeDefined()
    })
  })

  describe('默认值', () => {
    test('应该设置默认状态为 active', async () => {
      const roleData = {
        name: '测试角色',
        code: 'test_role',
        description: '这是一个测试角色',
        permissions: ['view_profile']
      }

      const role = new Role(roleData)
      const savedRole = await role.save()

      expect(savedRole.status).toBe('active')
    })

    test('应该设置默认 isSystem 为 false', async () => {
      const roleData = {
        name: '测试角色',
        code: 'test_role',
        description: '这是一个测试角色',
        permissions: ['view_profile']
      }

      const role = new Role(roleData)
      const savedRole = await role.save()

      expect(savedRole.isSystem).toBe(false)
    })

    test('应该设置默认权限为空数组', async () => {
      const roleData = {
        name: '测试角色',
        code: 'test_role',
        description: '这是一个测试角色'
      }

      const role = new Role(roleData)
      const savedRole = await role.save()

      expect(savedRole.permissions).toEqual([])
    })
  })

  describe('时间戳', () => {
    test('应该自动设置 createdAt 和 updatedAt', async () => {
      const roleData = {
        name: '测试角色',
        code: 'test_role',
        description: '这是一个测试角色'
      }

      const role = new Role(roleData)
      const savedRole = await role.save()

      expect(savedRole.createdAt).toBeDefined()
      expect(savedRole.updatedAt).toBeDefined()
      expect(savedRole.createdAt).toBeInstanceOf(Date)
      expect(savedRole.updatedAt).toBeInstanceOf(Date)
    })

    test('更新时应该更新 updatedAt', async () => {
      const role = await TestUtils.createTestRole()
      const originalUpdatedAt = role.updatedAt

      await TestUtils.wait(1000) // 等待1秒确保时间差异

      role.name = '更新后的角色名'
      await role.save()

      expect(role.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe('权限管理', () => {
    test('应该正确处理权限数组', async () => {
      const permissions = ['view_profile', 'edit_profile', 'delete_profile']
      const roleData = {
        name: '测试角色',
        code: 'test_role',
        description: '这是一个测试角色',
        permissions
      }

      const role = new Role(roleData)
      const savedRole = await role.save()

      expect(savedRole.permissions).toEqual(permissions)
      expect(savedRole.permissions).toHaveLength(3)
    })

    test('应该支持通配符权限', async () => {
      const roleData = {
        name: '管理员',
        code: 'admin',
        description: '系统管理员',
        permissions: ['*']
      }

      const role = new Role(roleData)
      const savedRole = await role.save()

      expect(savedRole.permissions).toEqual(['*'])
    })
  })

  describe('静态方法', () => {
    test('findByCode 应该找到角色', async () => {
      const role = await TestUtils.createTestRole({
        code: 'findme'
      })

      const foundRole = await Role.findByCode('findme')
      expect(foundRole).toBeDefined()
      expect(foundRole._id.toString()).toBe(role._id.toString())
    })

    test('findByCode 应该返回 null 当角色不存在', async () => {
      const foundRole = await Role.findByCode('nonexistent')
      expect(foundRole).toBeNull()
    })

    test('getActiveRoles 应该只返回激活状态的角色', async () => {
      await TestUtils.createTestRole({ code: 'active_role', status: 'active' })
      await TestUtils.createTestRole({ code: 'inactive_role', status: 'inactive' })

      const activeRoles = await Role.getActiveRoles()
      
      expect(activeRoles).toHaveLength(1)
      expect(activeRoles[0].code).toBe('active_role')
    })
  })

  describe('实例方法', () => {
    test('hasPermission 应该正确检查权限', async () => {
      const role = await TestUtils.createTestRole({
        permissions: ['view_profile', 'edit_profile']
      })

      expect(await role.hasPermission('view_profile')).toBe(true)
      expect(await role.hasPermission('edit_profile')).toBe(true)
      expect(await role.hasPermission('delete_profile')).toBe(false)
    })

    test('hasPermission 应该支持通配符权限', async () => {
      const role = await TestUtils.createTestRole({
        permissions: ['*']
      })

      expect(await role.hasPermission('any_permission')).toBe(true)
      expect(await role.hasPermission('another_permission')).toBe(true)
    })

    test('addPermission 应该添加权限', async () => {
      const role = await TestUtils.createTestRole({
        permissions: ['view_profile']
      })

      await role.addPermission('edit_profile')
      await role.save()

      expect(role.permissions).toContain('view_profile')
      expect(role.permissions).toContain('edit_profile')
      expect(role.permissions).toHaveLength(2)
    })

    test('removePermission 应该移除权限', async () => {
      const role = await TestUtils.createTestRole({
        permissions: ['view_profile', 'edit_profile']
      })

      await role.removePermission('edit_profile')
      await role.save()

      expect(role.permissions).toContain('view_profile')
      expect(role.permissions).not.toContain('edit_profile')
      expect(role.permissions).toHaveLength(1)
    })
  })

  describe('系统角色保护', () => {
    test('系统角色不能被删除', async () => {
      const role = await TestUtils.createTestRole({
        code: 'system_role',
        isSystem: true
      })

      let error
      try {
        await role.remove()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
    })

    test('系统角色不能被停用', async () => {
      const role = await TestUtils.createTestRole({
        code: 'system_role',
        isSystem: true
      })

      role.status = 'inactive'
      let error

      try {
        await role.save()
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
    })
  })
}) 