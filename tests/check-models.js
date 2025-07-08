import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

async function checkModels() {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Express Admin Chat'
      }
    })

    console.log('🔍 检查 OpenRouter 可用模型...')
    const models = await client.models.list()
    
    console.log(`\n📊 总共找到 ${models.data.length} 个模型`)
    
    // 查找免费模型
    const freeModels = models.data.filter(model => 
      model.id.includes('mistral') || 
      model.id.includes('claude') || 
      model.id.includes('phi') ||
      model.id.includes('gemma') ||
      model.id.includes('llama')
    )
    
    console.log('\n🎯 推荐的免费模型:')
    freeModels.slice(0, 15).forEach((model, index) => {
      console.log(`${index + 1}. ${model.id}`)
    })
    
    // 查找我们当前使用的模型
    const currentModel = 'mistralai/mistral-7b-instruct'
    const found = models.data.find(m => m.id === currentModel)
    
    console.log(`\n🔍 检查当前模型 "${currentModel}":`)
    if (found) {
      console.log('✅ 模型存在')
    } else {
      console.log('❌ 模型不存在')
      
      // 查找类似的模型
      const similar = models.data.filter(m => 
        m.id.includes('mistral') && m.id.includes('7b')
      )
      console.log('\n🔍 类似的模型:')
      similar.forEach(m => console.log(`- ${m.id}`))
    }
    
  } catch (error) {
    console.error('❌ 检查模型失败:', error.message)
  }
}

checkModels() 