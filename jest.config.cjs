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
  
  // 测试文件匹配模式 - 更新为新的目录结构
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.js',
    '<rootDir>/src/**/?(*.)+(spec|test).js',
    '<rootDir>/tests/unit/**/*.js',
    '<rootDir>/tests/integration/**/*.js'
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
    '!scripts/**',
    '!tests/**' // 排除测试目录
  ],
  
  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // 覆盖率目录
  coverageDirectory: 'coverage',
  
  // 覆盖率阈值 - 提高阈值
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    }
  },
  
  // 测试超时时间
  testTimeout: 15000,
  
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
    '/coverage/',
    '/tests/manual/', // 忽略手动测试
    '/tests/scripts/' // 忽略脚本文件
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
  verbose: true,
  
  // 测试套件配置
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.js',
        '<rootDir>/tests/unit/**/*.js'
      ]
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/tests/integration/**/*.js'
      ],
      testTimeout: 30000 // 集成测试需要更长时间
    }
  ]
} 