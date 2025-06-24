/**
 * 环境配置文件初始化脚本
 * 
 * 作用：
 * - 自动创建 .env 环境配置文件
 * - 提供默认的配置模板，包含必要的环境变量
 * - 避免手动创建配置文件时的遗漏和错误
 * 
 * 使用方法：
 * npm run setup-env
 * 
 * 创建的配置项：
 * - MONGODB_URI: MongoDB 数据库连接字符串
 * - MONGODB_USER: MongoDB 用户名（可选）
 * - MONGODB_PASSWORD: MongoDB 密码（可选）
 * - JWT_SECRET: JWT 令牌签名密钥
 * - PORT: 服务器端口号
 * - NODE_ENV: 运行环境
 * 
 * 注意事项：
 * - 如果 .env 文件已存在，脚本会自动退出
 * - 创建后需要手动编辑配置文件，填入正确的值
 * - JWT_SECRET 在生产环境中必须使用强随机字符串
 * - 数据库连接信息需要根据实际部署环境调整
 */

import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');

// 检查 .env 文件是否存在
if (fs.existsSync(envPath)) {
  console.log('.env 文件已存在');
  process.exit(0);
}

// 创建默认的 .env 文件内容
const envContent = `# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/express_admin
MONGODB_USER=
MONGODB_PASSWORD=

# JWT 密钥
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production

# 服务器配置
PORT=3000
NODE_ENV=development
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('.env 文件创建成功！');
  console.log('请编辑 .env 文件，设置正确的配置值：');
  console.log('1. MONGODB_URI: MongoDB 连接字符串');
  console.log('2. MONGODB_USER: MongoDB 用户名（如果有）');
  console.log('3. MONGODB_PASSWORD: MongoDB 密码（如果有）');
  console.log('4. JWT_SECRET: JWT 密钥（建议使用随机字符串）');
} catch (error) {
  console.error('创建 .env 文件失败:', error.message);
  process.exit(1);
} 