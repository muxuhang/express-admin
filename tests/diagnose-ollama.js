import fetch from 'node-fetch';
import { Ollama } from 'ollama';

// 诊断Ollama服务状态
async function diagnoseOllama() {
  console.log('🔍 Ollama 服务诊断\n');
  console.log('=' .repeat(50));

  const ollamaHost = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST || 'http://localhost:11434';
  console.log(`检查地址: ${ollamaHost}`);

  // 1. 检查服务是否运行
  console.log('\n1. 检查 Ollama 服务状态...');
  try {
    const response = await fetch(`${ollamaHost}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      // 设置较短的超时时间
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ollama 服务正在运行');
      console.log('已安装的模型:', data.models?.map(m => m.name) || []);
    } else {
      console.log('❌ Ollama 服务响应异常:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Ollama 服务连接失败:', error.message);
    console.log('\n可能的解决方案:');
    console.log('1. 确保 Ollama 已安装');
    console.log('2. 启动 Ollama 服务: ollama serve');
    console.log('3. 检查端口 11434 是否被占用');
    console.log('4. 检查防火墙设置');
  }

  // 2. 测试 Ollama 客户端连接
  console.log('\n2. 测试 Ollama 客户端连接...');
  try {
    const ollama = new Ollama({
      host: ollamaHost,
      request: {
        timeout: 10000, // 10秒超时
        keepAlive: true,
        keepAliveMsecs: 1000,
      }
    });

    const models = await ollama.list();
    console.log('✅ Ollama 客户端连接成功');
    console.log('可用模型:', models.models.map(m => m.name));
  } catch (error) {
    console.log('❌ Ollama 客户端连接失败:', error.message);
  }

  // 3. 检查网络连接
  console.log('\n3. 检查网络连接...');
  try {
    const response = await fetch(`${ollamaHost}/api/version`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const version = await response.json();
      console.log('✅ 网络连接正常');
      console.log('Ollama 版本:', version.version || '未知');
    }
  } catch (error) {
    console.log('❌ 网络连接失败:', error.message);
  }

  // 4. 检查模型状态
  console.log('\n4. 检查模型状态...');
  const targetModel = 'qwen2.5:7b';
  try {
    const ollama = new Ollama({ host: ollamaHost });
    const models = await ollama.list();
    const modelExists = models.models.some(m => m.name === targetModel);
    
    if (modelExists) {
      console.log(`✅ 模型 ${targetModel} 已安装`);
      
      // 尝试获取模型信息
      try {
        const modelInfo = await ollama.show({ name: targetModel });
        console.log('模型大小:', modelInfo.modelfile ? '已配置' : '未知');
      } catch (infoError) {
        console.log('⚠️ 无法获取模型详细信息');
      }
    } else {
      console.log(`❌ 模型 ${targetModel} 未安装`);
      console.log('建议运行: ollama pull qwen2.5:7b');
    }
  } catch (error) {
    console.log('❌ 检查模型状态失败:', error.message);
  }

  // 5. 测试简单对话
  console.log('\n5. 测试简单对话...');
  try {
    const ollama = new Ollama({ 
      host: ollamaHost,
      request: { timeout: 15000 }
    });
    
    const response = await ollama.chat({
      model: targetModel,
      messages: [{ role: 'user', content: '你好' }],
      stream: false,
      options: {
        num_predict: 10, // 限制输出长度
        temperature: 0.1
      }
    });
    
    if (response.message && response.message.content) {
      console.log('✅ 模型对话测试成功');
      console.log('测试回复:', response.message.content.substring(0, 50) + '...');
    } else {
      console.log('⚠️ 模型对话测试异常，无有效回复');
    }
  } catch (error) {
    console.log('❌ 模型对话测试失败:', error.message);
  }

  // 6. 系统资源检查
  console.log('\n6. 系统资源检查...');
  try {
    const { execSync } = await import('child_process');
    
    // 检查内存使用
    const memInfo = execSync('free -h', { encoding: 'utf8' });
    console.log('内存使用情况:');
    console.log(memInfo.split('\n')[1]); // 显示内存行
    
    // 检查磁盘空间
    const diskInfo = execSync('df -h /', { encoding: 'utf8' });
    console.log('磁盘使用情况:');
    console.log(diskInfo.split('\n')[1]); // 显示根目录行
    
  } catch (error) {
    console.log('⚠️ 无法获取系统资源信息:', error.message);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🔧 常见问题解决方案:');
  console.log('1. 服务未启动: ollama serve');
  console.log('2. 模型未下载: ollama pull qwen2.5:7b');
  console.log('3. 端口被占用: 检查 11434 端口');
  console.log('4. 内存不足: 关闭其他程序释放内存');
  console.log('5. 网络问题: 检查防火墙和代理设置');
}

// 运行诊断
if (import.meta.url === `file://${process.argv[1]}`) {
  diagnoseOllama().catch(console.error);
}

export { diagnoseOllama }; 