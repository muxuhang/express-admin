# 测试文件结构

本项目采用分层测试架构，将测试文件按类型和用途进行分类管理。

## 📁 目录结构

```
tests/
├── unit/           # 单元测试 (Jest)
├── integration/    # 集成测试 (Jest)
├── manual/         # 手动测试脚本
├── scripts/        # 测试工具脚本
└── README.md       # 本文档
```

## 🧪 测试类型

### 1. 单元测试 (`tests/unit/`)
- **用途**: 测试单个函数、类或模块的功能
- **工具**: Jest
- **特点**: 快速、独立、可重复
- **运行**: `npm run test:unit`

### 2. 集成测试 (`tests/integration/`)
- **用途**: 测试多个组件之间的交互
- **工具**: Jest
- **特点**: 测试API接口、数据库交互等
- **运行**: `npm run test:integration`

### 3. 手动测试 (`tests/manual/`)
- **用途**: 需要人工验证的测试场景
- **工具**: 独立脚本
- **特点**: 复杂场景、调试、验证
- **运行**: `npm run test:manual`

### 4. 测试脚本 (`tests/scripts/`)
- **用途**: 测试相关的工具和辅助脚本
- **工具**: Node.js
- **特点**: 诊断、修复、检查工具

## 🚀 运行测试

### 运行所有测试
```bash
npm test
```

### 运行特定类型测试
```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 手动测试
npm run test:manual
```

### 运行单个手动测试
```bash
npm run test:manual -- --file test-chat-request.js
```

### 带覆盖率测试
```bash
npm run test:coverage
```

## 📊 测试覆盖率

当前覆盖率阈值设置为20%，包括：
- branches: 20%
- functions: 20%
- lines: 20%
- statements: 20%

## 🔧 配置说明

### Jest配置 (`jest.config.cjs`)
- 支持ES6模块
- 配置了测试套件 (projects)
- 设置了不同的超时时间
- 排除了手动测试和脚本文件

### 测试超时时间
- 单元测试: 15秒
- 集成测试: 30秒

## 📝 添加新测试

### 添加单元测试
1. 在 `tests/unit/` 目录下创建测试文件
2. 文件名格式: `*.test.js`
3. 使用Jest语法编写测试

### 添加集成测试
1. 在 `tests/integration/` 目录下创建测试文件
2. 文件名格式: `test-*.js`
3. 测试API接口或复杂交互

### 添加手动测试
1. 在 `tests/manual/` 目录下创建测试文件
2. 文件名格式: `test-*.js`
3. 使用独立的Node.js脚本

## 🎯 最佳实践

1. **测试命名**: 使用描述性的测试名称
2. **测试组织**: 按功能模块组织测试文件
3. **测试数据**: 使用独立的测试数据
4. **清理**: 测试完成后清理测试数据
5. **文档**: 为复杂测试添加注释说明

## 🔍 调试测试

### 查看详细输出
```bash
npm test -- --verbose
```

### 运行特定测试
```bash
npm test -- --testNamePattern="测试名称"
```

### 调试模式
```bash
npm test -- --detectOpenHandles
```

## 📈 测试统计

- **单元测试**: 6个文件
- **集成测试**: 16个文件
- **手动测试**: 13个文件
- **测试脚本**: 5个文件

总计: 40个测试文件 (已优化结构，移除了图标生成相关测试) 