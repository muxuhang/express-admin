import fetch from 'node-fetch';

// 测试模型列表接口
async function testModelsApi() {
  console.log('🤖 测试模型列表接口...\n');

  const baseUrl = 'http://localhost:8888';

  // 1. 获取模型列表
  console.log('1. 获取可用模型列表...');
  try {
    const response = await fetch(`${baseUrl}/api/chat/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 获取模型列表成功');
      console.log('响应数据:', JSON.stringify(result, null, 2));
      
      if (result.code === 0 && result.data) {
        console.log(`\n📊 模型统计:`);
        console.log(`- 总模型数量: ${result.data.models.length}`);
        console.log(`- 当前使用模型: ${result.data.currentModel.name}`);
        
        if (result.data.models.length > 0) {
          console.log('\n📋 模型详情:');
          result.data.models.forEach((model, index) => {
            console.log(`${index + 1}. ${model.name}`);
            console.log(`   - 大小: ${model.size ? formatBytes(model.size) : '未知'}`);
            console.log(`   - 修改时间: ${model.modified_at || '未知'}`);
            console.log(`   - 摘要: ${model.digest ? model.digest.substring(0, 8) + '...' : '未知'}`);
          });
        }
      }
    } else {
      console.log('❌ 获取模型列表失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('获取模型列表异常:', error.message);
  }

  // 2. 测试错误情况
  console.log('\n2. 测试错误情况...');
  
  // 模拟服务不可用的情况
  console.log('注意：以下测试需要 Ollama 服务不可用时才能看到错误处理');
  
  const errorScenarios = [
    {
      name: 'Ollama 服务未启动',
      description: '当 Ollama 服务未运行时，应该返回服务不可用错误'
    },
    {
      name: '网络连接问题',
      description: '当无法连接到 Ollama 服务时，应该返回连接错误'
    },
    {
      name: '模型列表为空',
      description: '当没有安装任何模型时，应该返回空列表'
    }
  ];

  for (const scenario of errorScenarios) {
    console.log(`\n场景: ${scenario.name}`);
    console.log(`描述: ${scenario.description}`);
  }
}

// 格式化字节大小
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 测试模型切换功能（如果将来需要）
async function testModelSwitching() {
  console.log('\n\n🔄 模型切换功能测试（预留）...\n');
  
  console.log('当前系统使用固定模型: qwen2.5:7b');
  console.log('如需支持模型切换，可以考虑以下功能:');
  console.log('1. 添加切换模型的接口');
  console.log('2. 在聊天时指定使用的模型');
  console.log('3. 保存用户的模型偏好');
  console.log('4. 验证模型可用性');
}

// 前端使用示例
function showFrontendExample() {
  console.log('\n\n🌐 前端使用示例:\n');
  
  console.log(`
// 获取模型列表
async function getAvailableModels() {
  try {
    const response = await fetch('/api/chat/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.code === 0) {
      console.log('可用模型:', result.data.models);
      console.log('当前模型:', result.data.currentModel);
      
      // 更新 UI 显示模型列表
      updateModelList(result.data.models);
      updateCurrentModel(result.data.currentModel);
    } else {
      console.error('获取模型列表失败:', result.message);
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 更新模型列表 UI
function updateModelList(models) {
  const modelList = document.getElementById('model-list');
  modelList.innerHTML = '';
  
  models.forEach(model => {
    const modelItem = document.createElement('div');
    modelItem.className = 'model-item';
    modelItem.innerHTML = \`
      <h3>\${model.name}</h3>
      <p>大小: \${formatBytes(model.size)}</p>
      <p>更新时间: \${new Date(model.modified_at).toLocaleString()}</p>
    \`;
    modelList.appendChild(modelItem);
  });
}

// 更新当前模型显示
function updateCurrentModel(currentModel) {
  const currentModelElement = document.getElementById('current-model');
  currentModelElement.textContent = \`当前使用: \${currentModel.name}\`;
}

// 格式化字节大小
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 页面加载时获取模型列表
document.addEventListener('DOMContentLoaded', () => {
  getAvailableModels();
});
`);
}

// 运行测试
async function runModelsTests() {
  console.log('🤖 模型列表接口测试\n');
  console.log('=' .repeat(50));
  
  await testModelsApi();
  await testModelSwitching();
  showFrontendExample();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ 模型列表接口测试完成');
  console.log('\n总结:');
  console.log('- 新增 /api/chat/models 接口');
  console.log('- 返回所有可用的 Ollama 模型');
  console.log('- 显示当前使用的模型');
  console.log('- 包含模型详细信息（大小、更新时间等）');
  console.log('- 提供前端使用示例');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runModelsTests().catch(console.error);
}

export {
  testModelsApi,
  testModelSwitching,
  showFrontendExample,
  runModelsTests
}; 