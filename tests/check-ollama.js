import fetch from 'node-fetch';

// Ollama 状态检查工具
async function checkOllamaStatus() {
  console.log('🔍 检查 Ollama 服务状态...\n');

  const ollamaHost = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST || 'http://localhost:11434';
  console.log(`检查地址: ${ollamaHost}`);

  try {
    // 检查服务是否运行
    console.log('1. 检查 Ollama 服务连接...');
    const response = await fetch(`${ollamaHost}/api/tags`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Ollama 服务正在运行');
    console.log(`📊 已安装模型数量: ${data.models?.length || 0}`);

    if (data.models && data.models.length > 0) {
      console.log('📋 已安装的模型:');
      data.models.forEach((model, index) => {
        console.log(`  ${index + 1}. ${model.name} (${model.size || '未知大小'})`);
      });
    } else {
      console.log('⚠️  没有安装任何模型');
    }

    // 检查目标模型
    const targetModel = 'qwen2.5:7b';
    const hasTargetModel = data.models?.some(m => m.name === targetModel);
    
    if (hasTargetModel) {
      console.log(`✅ 目标模型 ${targetModel} 已安装`);
    } else {
      console.log(`❌ 目标模型 ${targetModel} 未安装`);
      console.log('💡 建议运行以下命令安装模型:');
      console.log(`   ollama pull ${targetModel}`);
    }

  } catch (error) {
    console.error('❌ Ollama 服务检查失败:', error.message);
    console.log('\n🔧 故障排除步骤:');
    console.log('1. 确保 Ollama 已安装');
    console.log('2. 启动 Ollama 服务: ollama serve');
    console.log('3. 检查端口 11434 是否被占用');
    console.log('4. 检查防火墙设置');
    console.log('5. 尝试访问: http://localhost:11434/api/tags');
  }
}

// 检查网络连接
async function checkNetworkConnectivity() {
  console.log('\n🌐 检查网络连接...');
  
  try {
    const response = await fetch('https://api.github.com');
    if (response.ok) {
      console.log('✅ 网络连接正常');
    } else {
      console.log('⚠️  网络连接可能有问题');
    }
  } catch (error) {
    console.error('❌ 网络连接失败:', error.message);
  }
}

// 提供安装指南
function showInstallationGuide() {
  console.log('\n📖 Ollama 安装指南:');
  console.log('\n1. 安装 Ollama:');
  console.log('   macOS: brew install ollama');
  console.log('   Linux: curl -fsSL https://ollama.ai/install.sh | sh');
  console.log('   Windows: 访问 https://ollama.ai/download');
  
  console.log('\n2. 启动服务:');
  console.log('   ollama serve');
  
  console.log('\n3. 下载模型:');
  console.log('   ollama pull qwen2.5:7b');
  
  console.log('\n4. 验证安装:');
  console.log('   ollama list');
  console.log('   ollama run qwen2.5:7b "你好"');
}

// 运行检查
async function runDiagnostics() {
  console.log('🎯 Ollama 诊断工具\n');
  console.log('=' .repeat(50));
  
  await checkOllamaStatus();
  await checkNetworkConnectivity();
  showInstallationGuide();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ 诊断完成');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostics().catch(console.error);
}

export {
  checkOllamaStatus,
  checkNetworkConnectivity,
  showInstallationGuide,
  runDiagnostics
}; 