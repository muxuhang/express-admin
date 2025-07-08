import localAIChatService from './localAIChat.js'
import openRouterService from './openRouterService.js'

class AIServiceManager {
  constructor() {
    this.services = {
      local: localAIChatService,
      openrouter: openRouterService
    }
    
    // 默认使用本地AI服务
    this.currentService = 'local'
    this.conversationHistory = new Map()
    this.cancelTokens = new Map()
  }

  // 设置当前使用的AI服务
  setService(serviceName) {
    if (this.services[serviceName]) {
      this.currentService = serviceName
      console.log(`AI服务已切换到: ${serviceName}`)
      return true
    } else {
      console.error(`不支持的AI服务: ${serviceName}`)
      return false
    }
  }

  // 获取当前AI服务
  getCurrentService() {
    return this.currentService
  }

  // 获取可用的AI服务列表
  getAvailableServices() {
    return Object.keys(this.services).map(name => ({
      name,
      displayName: this.getServiceDisplayName(name),
      description: this.getServiceDescription(name)
    }))
  }

  // 获取服务显示名称
  getServiceDisplayName(serviceName) {
    const names = {
      local: '本地AI (Ollama)',
      openrouter: 'OpenRouter (免费模型)'
    }
    return names[serviceName] || serviceName
  }

  // 获取服务描述
  getServiceDescription(serviceName) {
    const descriptions = {
      local: '使用本地Ollama服务，需要安装和配置Ollama',
      openrouter: '使用OpenRouter提供的免费AI模型，需要API密钥'
    }
    return descriptions[serviceName] || ''
  }

  // 测试服务连接
  async testService(serviceName = null) {
    const service = serviceName || this.currentService
    const serviceInstance = this.services[service]
    
    try {
      if (service === 'local') {
        await serviceInstance.initialize()
        await serviceInstance.testConnection()
      } else if (service === 'openrouter') {
        await serviceInstance.initialize()
        await serviceInstance.testConnection()
      }
      
      return {
        success: true,
        service: service,
        message: `${this.getServiceDisplayName(service)} 连接正常`
      }
    } catch (error) {
      return {
        success: false,
        service: service,
        message: error.message
      }
    }
  }

  // 智能判断模型所属的服务
  async determineServiceByModel(modelName) {
    if (!modelName) {
      return this.currentService
    }

    // 检查是否是OpenRouter模型（包含/的格式）
    if (modelName.includes('/')) {
      return 'openrouter'
    }

    // 检查是否是本地模型（包含:的格式，如llama2:latest）
    if (modelName.includes(':')) {
      return 'local'
    }

    // 如果只是模型名称，尝试在所有服务中查找
    try {
      // 先检查OpenRouter模型
      const openRouterModels = await this.services.openrouter.getAvailableModels()
      const isOpenRouterModel = openRouterModels.some(m => 
        m.id === modelName || m.name === modelName || m.id.endsWith(modelName)
      )
      if (isOpenRouterModel) {
        return 'openrouter'
      }

      // 再检查本地模型
      const localModels = await this.services.local.getAvailableModels()
      const isLocalModel = localModels.some(m => 
        m.name === modelName || m.name.includes(modelName)
      )
      if (isLocalModel) {
        return 'local'
      }
    } catch (error) {
      console.warn('检查模型所属服务时出错:', error.message)
    }

    // 如果无法确定，使用默认服务
    return this.currentService
  }

  // 发送消息（统一接口）
  async *sendMessage(userId, message, context = '', options = {}) {
    let serviceName = options.service
    const modelName = options.model || null

    // 如果没有指定服务，或者指定为'auto'，根据模型智能判断
    if ((!serviceName || serviceName === 'auto') && modelName) {
      serviceName = await this.determineServiceByModel(modelName)
      console.log(`根据模型 "${modelName}" 自动选择服务: ${serviceName}`)
    } else if (!serviceName || serviceName === 'auto') {
      serviceName = this.currentService
      console.log(`使用默认服务: ${serviceName}`)
    }

    const serviceInstance = this.services[serviceName]

    try {
      console.log(`使用 ${this.getServiceDisplayName(serviceName)} 处理消息`)
      
      // 根据服务类型调用不同的方法
      if (serviceName === 'openrouter') {
        yield* serviceInstance.sendMessage(userId, message, context, modelName)
      } else {
        yield* serviceInstance.sendMessage(userId, message, context)
      }
    } catch (error) {
      console.error(`${serviceName} 服务错误:`, error)
      throw error
    }
  }

  // 获取可用模型
  async getAvailableModels(serviceName = null) {
    const service = serviceName || this.currentService
    const serviceInstance = this.services[service]
    
    try {
      if (service === 'openrouter') {
        return await serviceInstance.getAvailableModels()
      } else if (service === 'local') {
        return await serviceInstance.getAvailableModels()
      }
    } catch (error) {
      console.error(`获取 ${service} 模型列表失败:`, error)
      return []
    }
  }

  // 获取当前模型
  getCurrentModel(serviceName = null) {
    const service = serviceName || this.currentService
    const serviceInstance = this.services[service]
    
    try {
      return serviceInstance.getCurrentModel()
    } catch (error) {
      console.error(`获取 ${service} 当前模型失败:`, error)
      return null
    }
  }

  // 设置模型
  setModel(modelName, serviceName = null) {
    const service = serviceName || this.currentService
    const serviceInstance = this.services[service]
    
    try {
      if (service === 'openrouter') {
        serviceInstance.setDefaultModel(modelName)
      } else if (service === 'local') {
        // 本地服务通常使用固定模型
        console.log('本地服务使用固定模型，无法更改')
      }
    } catch (error) {
      console.error(`设置 ${service} 模型失败:`, error)
      throw error
    }
  }

  // 取消消息
  cancelMessage(userId, serviceName = null) {
    const service = serviceName || this.currentService
    const serviceInstance = this.services[service]
    
    try {
      serviceInstance.cancelMessage(userId)
    } catch (error) {
      console.error(`取消 ${service} 消息失败:`, error)
    }
  }

  // 检查活跃请求
  hasActiveRequest(userId, serviceName = null) {
    const service = serviceName || this.currentService
    const serviceInstance = this.services[service]
    
    try {
      return serviceInstance.hasActiveRequest(userId)
    } catch (error) {
      console.error(`检查 ${service} 活跃请求失败:`, error)
      return false
    }
  }

  // 清除历史记录
  clearHistory(userId, serviceName = null) {
    const service = serviceName || this.currentService
    const serviceInstance = this.services[service]
    
    try {
      serviceInstance.clearHistory(userId)
    } catch (error) {
      console.error(`清除 ${service} 历史记录失败:`, error)
    }
  }

  // 获取历史记录
  getHistory(userId, serviceName = null) {
    const service = serviceName || this.currentService
    const serviceInstance = this.services[service]
    
    try {
      return serviceInstance.getHistory(userId)
    } catch (error) {
      console.error(`获取 ${service} 历史记录失败:`, error)
      return []
    }
  }

  // 获取服务状态信息
  async getServiceStatus() {
    const status = {}
    
    for (const [serviceName, serviceInstance] of Object.entries(this.services)) {
      try {
        if (serviceName === 'local') {
          await serviceInstance.initialize()
          const models = await serviceInstance.getAvailableModels()
          status[serviceName] = {
            available: true,
            currentModel: serviceInstance.getCurrentModel(),
            availableModels: models.length,
            displayName: this.getServiceDisplayName(serviceName)
          }
        } else if (serviceName === 'openrouter') {
          await serviceInstance.initialize()
          const models = await serviceInstance.getAvailableModels()
          status[serviceName] = {
            available: true,
            currentModel: serviceInstance.getCurrentModel(),
            availableModels: models.length,
            displayName: this.getServiceDisplayName(serviceName)
          }
        }
      } catch (error) {
        status[serviceName] = {
          available: false,
          error: error.message,
          displayName: this.getServiceDisplayName(serviceName)
        }
      }
    }
    
    return status
  }

  // 获取所有服务的全部模型
  async getAllModels() {
    const allModels = []
    // 本地模型
    try {
      const localModels = await this.services.local.getAvailableModels()
      localModels.forEach(m => {
        allModels.push({
          id: m.name,  // 本地模型使用name作为完整ID
          name: m.name,
          displayName: m.name,  // 添加displayName字段保持一致性
          provider: 'local',
          type: 'local',
          description: '本地Ollama模型',
          ...m
        })
      })
    } catch (e) {
      console.error('获取本地模型失败:', e.message)
    }
    // OpenRouter模型
    try {
      const openModels = await this.services.openrouter.getAvailableModels()
      openModels.forEach(m => {
        allModels.push({
          ...m,
          type: 'openrouter'
        })
      })
    } catch (e) {
      console.error('获取OpenRouter模型失败:', e.message)
    }
    return allModels
  }

  // 获取用户会话列表
  async getUserSessions(userId, options = {}) {
    try {
      // 导入chatHistoryService
      const { default: chatHistoryService } = await import('./chatHistoryService.js')
      return await chatHistoryService.getUserSessions(userId, options)
    } catch (error) {
      console.error('获取用户会话列表失败:', error)
      throw error
    }
  }

  // 获取会话详情
  async getSessionDetails(userId, sessionId) {
    try {
      // 导入chatHistoryService
      const { default: chatHistoryService } = await import('./chatHistoryService.js')
      return await chatHistoryService.getSessionDetails(userId, sessionId)
    } catch (error) {
      console.error('获取会话详情失败:', error)
      throw error
    }
  }

  // 删除指定会话
  async deleteSession(userId, sessionId) {
    try {
      // 导入chatHistoryService
      const { default: chatHistoryService } = await import('./chatHistoryService.js')
      return await chatHistoryService.clearUserHistory(userId, sessionId)
    } catch (error) {
      console.error('删除会话失败:', error)
      throw error
    }
  }

  // 获取用户历史记录
  async getUserHistory(userId, options = {}) {
    try {
      // 导入chatHistoryService
      const { default: chatHistoryService } = await import('./chatHistoryService.js')
      return await chatHistoryService.getUserHistory(userId, options)
    } catch (error) {
      console.error('获取用户历史记录失败:', error)
      throw error
    }
  }
}

// 创建单例实例
const aiServiceManager = new AIServiceManager()

export default aiServiceManager 