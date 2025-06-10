import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.js';
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
      role: 'admin'
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