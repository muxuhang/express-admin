module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 支持 ES6 模块
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  
  // 模块文件扩展名
  moduleFileExtensions: ['js', 'json'],
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.js',
    '<rootDir>/src/**/?(*.)+(spec|test).js'
  ],
  
  // 覆盖率收集
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/tests/**',
    '!src/views/**',
    '!src/config/**',
    '!bin/**',
    '!scripts/**'
  ],
  
  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // 覆盖率目录
  coverageDirectory: 'coverage',
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5
    }
  },
  
  // 测试超时时间
  testTimeout: 10000,
  
  // 设置文件 - 根据测试类型选择不同的设置
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.js'
  ],
  
  // 转换器
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // 模块名称映射
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // 忽略的文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/public/',
    '/coverage/'
  ],
  
  // 转换忽略模式
  transformIgnorePatterns: [
    'node_modules/(?!(regenerator-runtime)/)'
  ],
  
  // 清除模拟
  clearMocks: true,
  
  // 恢复模拟
  restoreMocks: true,
  
  // 详细输出
  verbose: true
} 