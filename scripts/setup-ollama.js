/**
 * Ollama 本地 AI 模型设置脚本
 * 
 * 作用：
 * - 提供 Ollama 本地 AI 模型的完整安装和配置指南
 * - 根据操作系统自动显示相应的安装步骤
 * - 自动更新 .env 文件添加 Ollama 相关配置
 * - 推荐适合的 AI 模型并提供使用说明
 * 
 * 使用方法：
 * npm run setup-ollama
 * 
 * 支持的平台：
 * - macOS (darwin)
 * - Linux
 * - Windows (win32)
 * 
 * 主要功能：
 * - 检测操作系统并显示对应安装指南
 * - 推荐不同规格的 AI 模型
 * - 自动配置环境变量
 * - 提供故障排除建议
 * 
 * 推荐的模型：
 * - qwen2.5:7b: 通义千问2.5 7B模型，中文效果好
 * - llama3.2:3b: Meta Llama 3.2 3B模型，资源占用小
 * - qwen2.5:14b: 通义千问2.5 14B模型，效果更好
 * - llama3.2:8b: Meta Llama 3.2 8B模型，平衡性能
 * 
 * 注意事项：
 * - 需要先安装 Ollama 软件
 * - 需要下载相应的 AI 模型
 * - 建议根据硬件配置选择合适的模型
 * - 首次使用可能需要较长时间下载模型
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 开始设置 Ollama 本地 AI 模型...\n');

// 检查操作系统
const platform = process.platform;
console.log(`检测到操作系统: ${platform}`);

// 安装指南
const installGuides = {
  darwin: {
    title: 'macOS 安装指南',
    steps: [
      '1. 访问 https://ollama.ai/download 下载 macOS 版本',
      '2. 下载完成后双击安装包进行安装',
      '3. 安装完成后，Ollama 会自动启动',
      '4. 打开终端，运行以下命令验证安装:',
      '   ollama --version'
    ]
  },
  linux: {
    title: 'Linux 安装指南',
    steps: [
      '1. 运行以下命令安装 Ollama:',
      '   curl -fsSL https://ollama.ai/install.sh | sh',
      '2. 启动 Ollama 服务:',
      '   sudo systemctl start ollama',
      '3. 设置开机自启:',
      '   sudo systemctl enable ollama',
      '4. 验证安装:',
      '   ollama --version'
    ]
  },
  win32: {
    title: 'Windows 安装指南',
    steps: [
      '1. 访问 https://ollama.ai/download 下载 Windows 版本',
      '2. 下载完成后运行安装程序',
      '3. 安装完成后，Ollama 会自动启动',
      '4. 打开命令提示符，运行以下命令验证安装:',
      '   ollama --version'
    ]
  }
};

// 显示安装指南
const guide = installGuides[platform] || installGuides.linux;
console.log(`📋 ${guide.title}:`);
guide.steps.forEach(step => console.log(`   ${step}`));

console.log('\n📥 推荐的模型:');
const recommendedModels = [
  'qwen2.5:7b - 通义千问2.5 7B模型，中文效果好，资源占用适中',
  'llama3.2:3b - Meta Llama 3.2 3B模型，英文效果好，资源占用小',
  'qwen2.5:14b - 通义千问2.5 14B模型，效果更好但需要更多资源',
  'llama3.2:8b - Meta Llama 3.2 8B模型，平衡性能和资源占用'
];

recommendedModels.forEach(model => console.log(`   • ${model}`));

console.log('\n🔧 配置步骤:');
console.log('1. 安装 Ollama 后，运行以下命令下载模型:');
console.log('   ollama pull qwen2.5:7b');
console.log('\n2. 验证模型是否可用:');
console.log('   ollama list');
console.log('\n3. 测试模型:');
console.log('   ollama run qwen2.5:7b "你好"');

console.log('\n⚙️  环境变量配置:');
console.log('在 .env 文件中添加以下配置:');
console.log('OLLAMA_HOST=http://localhost:11434');
console.log('OLLAMA_MODEL=qwen2.5:7b');

// 检查 .env 文件是否存在
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('\n📝 更新 .env 文件...');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 检查是否已有 Ollama 配置
  if (!envContent.includes('OLLAMA_HOST')) {
    envContent += '\n# Ollama 本地 AI 模型配置\nOLLAMA_HOST=http://localhost:11434\nOLLAMA_MODEL=qwen2.5:7b\n';
    fs.writeFileSync(envPath, envContent);
    console.log('✅ 已添加 Ollama 配置到 .env 文件');
  } else {
    console.log('ℹ️  .env 文件中已有 Ollama 配置');
  }
} else {
  console.log('\n⚠️  未找到 .env 文件，请先运行 npm run setup-env');
}

console.log('\n🎯 使用说明:');
console.log('1. 启动应用后，在聊天界面可以选择使用本地 AI 或在线 AI');
console.log('2. 发送消息时添加 useLocalAI: true 参数使用本地模型');
console.log('3. 可以通过 /api/chat/models 接口查看可用模型');
console.log('4. 可以通过 /api/chat/switch-model 接口切换模型');

console.log('\n🔍 故障排除:');
console.log('• 如果连接失败，请确保 Ollama 服务正在运行');
console.log('• 如果模型不可用，请运行 ollama pull <模型名> 下载模型');
console.log('• 如果响应慢，可以尝试更小的模型或增加系统内存');

console.log('\n✨ 设置完成！现在您可以开始使用本地 AI 模型了。'); 