# Express Admin

## 项目说明
这是一个基于 Express 的后台管理系统，提供用户认证、权限管理等功能。

## 目录结构
```
/bin                # 启动脚本
/config             # 配置文件
/controllers        # 控制器
/middlewares        # 中间件
/models             # 数据库模型
/routes             # 路由定义
/services           # 业务服务层
/utils              # 工具函数
/public             # 静态资源
/views              # 模板文件
/template           # 代码生成模板
```

## 依赖安装
```bash
npm install
```

## 环境配置
1. 复制 `.env.example` 为 `.env`，并填写相关配置：
   ```
   JWT_SECRET=your_jwt_secret_here
   MONGODB_URI=mongodb://localhost:27017/your_database_name
   PORT=3000
   NODE_ENV=development
   ```

## 启动指南
- 开发环境：`npm start`
- 代码检查：`npm run lint`
- 单元测试：`npm test`

## 开发建议
- 使用 ESLint 和 Prettier 保持代码风格统一。
- 编写单元测试确保代码质量。
- 定期更新依赖，确保安全稳定。
