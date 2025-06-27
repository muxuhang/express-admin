import 'regenerator-runtime/runtime'

// 设置测试环境
process.env.NODE_ENV = 'test'

// 全局测试超时
jest.setTimeout(10000)

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
}) 