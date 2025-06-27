import 'regenerator-runtime/runtime'
/**
 * 测试配置验证示例
 * 
 * 这个文件用于验证 Jest 配置是否正确工作
 */

describe('Jest 配置验证', () => {
  test('应该能够运行基本测试', () => {
    expect(1 + 1).toBe(2)
  })

  test('应该支持异步测试', async () => {
    const result = await Promise.resolve('test')
    expect(result).toBe('test')
  })

  test('应该支持 ES6 模块导入', () => {
    // 测试 ES6 模块语法是否正常工作
    const testModule = {
      test: 'value'
    }
    expect(testModule.test).toBe('value')
  })

  test('应该支持字符串匹配', () => {
    expect('hello world').toMatch(/hello/)
    expect('hello world').toContain('world')
  })

  test('应该支持数组和对象测试', () => {
    const array = [1, 2, 3]
    const object = { name: 'test', value: 123 }

    expect(array).toHaveLength(3)
    expect(array).toContain(2)
    expect(object).toHaveProperty('name')
    expect(object.name).toBe('test')
  })

  test('应该支持错误测试', () => {
    expect(() => {
      throw new Error('test error')
    }).toThrow('test error')
  })
})

describe('测试环境验证', () => {
  test('应该设置正确的环境变量', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  test('应该支持 console.log', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    
    console.log('test message')
    
    expect(consoleSpy).toHaveBeenCalledWith('test message')
    
    consoleSpy.mockRestore()
  })
}) 