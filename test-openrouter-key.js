import OpenAI from 'openai'
import dotenv from 'dotenv'

// 添加 fetch polyfill
import fetch from 'node-fetch'
globalThis.fetch = fetch

dotenv.config()

async function testOpenRouterKey() {
  console.log('🔍 测试 OpenRouter API 密钥...')
  
  const apiKey = process.env.OPENROUTER_API_KEY
  console.log('API 密钥:', apiKey ? `${apiKey.substring(0, 10)}...` : '未设置')
  
  if (!apiKey) {
    console.error('❌ 未找到 OPENROUTER_API_KEY 环境变量')
    return
  }
  
  try {
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Express Admin Chat'
      }
    })
    
    console.log('📡 测试连接...')
    const models = await client.models.list()
    console.log('✅ 连接成功！')
    console.log(`📊 可用模型数量: ${models.data.length}`)
    
    // 检查是否有我们需要的免费模型
    const freeModels = [
      'mistralai/mistral-7b-instruct',
      'meta-llama/llama-2-7b-chat',
      'google/gemma-7b-it',
      'microsoft/phi-2'
    ]
    
    console.log('\n🔍 检查免费模型:')
    freeModels.forEach(modelId => {
      const found = models.data.find(m => m.id === modelId)
      if (found) {
        console.log(`✅ ${modelId}`)
      } else {
        console.log(`❌ ${modelId} (未找到)`)
      }
    })
    
    // 测试简单的聊天请求
    console.log('\n🧪 测试聊天请求...')
    const response = await client.chat.completions.create({
      model: 'mistralai/mistral-7b-instruct',
      messages: [
        { role: 'user', content: '你好，请简单回复"测试成功"' }
      ],
      max_tokens: 50,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
      n: 1,
      stop: null,
      logprobs: null,
      echo: false,
      logit_bias: null,
      user: 'test-user'
    })
    
    console.log('✅ 聊天测试成功！')
    console.log('回复:', response.choices[0].message.content)
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    
    if (error.message.includes('401')) {
      console.log('\n💡 解决方案:')
      console.log('1. 检查 API 密钥是否正确')
      console.log('2. 访问 https://openrouter.ai/keys 重新生成密钥')
      console.log('3. 确保密钥有足够的配额')
    } else if (error.message.includes('rate limit')) {
      console.log('\n💡 解决方案:')
      console.log('API 调用频率超限，请稍后重试')
    } else if (error.message.includes('quota')) {
      console.log('\n💡 解决方案:')
      console.log('API 配额已用完，请等待重置或升级账户')
    }
  }
}

testOpenRouterKey() 