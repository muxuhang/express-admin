/**
 * 管理员账号创建脚本
 * 
 * 作用：
 * - 在数据库中创建默认的管理员账号
 * - 用于系统初始化时创建第一个管理员用户
 * - 自动检查是否已存在管理员账号，避免重复创建
 * 
 * 使用方法：
 * npm run create-admin
 * 
 * 默认账号信息：
 * - 用户名: admin
 * - 密码: yonghu123
 * - 邮箱: admin@example.com
 * - 角色: admin
 * 
 * 注意事项：
 * - 需要先配置好 .env 文件中的数据库连接信息
 * - 创建后请立即登录并修改默认密码
 * - 如果管理员账号已存在，脚本会自动退出
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/user.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const createAdmin = async () => {
  try {
    // 连接数据库
    const { MONGODB_URI, MONGODB_USER, MONGODB_PASSWORD } = process.env;
    
    if (!MONGODB_URI || !MONGODB_USER || !MONGODB_PASSWORD) {
      console.error('请确保在 .env 文件中设置了 MONGODB_URI, MONGODB_USER 和 MONGODB_PASSWORD');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      user: MONGODB_USER,
      pass: MONGODB_PASSWORD,
    });

    // 检查是否已存在管理员账号
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('管理员账号已存在');
      process.exit(0);
    }

    // 创建管理员账号
    const adminPassword = 'yonghu123'; // 默认密码
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = new User({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      phone: '13800138000', // 默认手机号
      role: 'admin',
      status: 'active'
    });

    await admin.save();
    console.log('管理员账号创建成功');
    console.log('用户名: admin');
    console.log('密码: yonghu123');
    console.log('请登录后立即修改密码！');

  } catch (error) {
    console.error('创建管理员账号失败:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin(); 