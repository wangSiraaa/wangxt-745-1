# 生猪产地检疫申报系统

生猪产地检疫申报全栈 Web 应用，覆盖猪群批次管理、免疫记录、检疫申报、运输车辆管理、到场签收、异常复核全流程。

## 功能特性

### 核心业务流程
1. **检疫申报** - 申报员提交检疫申报单
2. **免疫校验** - 校验猪群免疫记录是否达标（21天间隔硬校验）
3. **车辆绑定** - 绑定备案运输车辆（备案有效期硬校验）
4. **检疫出证** - 检疫员审核并出具检疫证明
5. **运输签收** - 运输到达后到场签收
6. **异常复核** - 异常情况处理和复核

### 系统角色
- **申报员 (declarant)** - 提交申报、管理批次、录入免疫记录
- **检疫员 (inspector)** - 免疫校验、车辆绑定、检疫出证
- **司机 (driver)** - 运输任务、到场签收
- **复核员 (reviewer)** - 异常情况复核处理

### 硬校验规则
- ✅ **免疫间隔校验**：免疫未达21天间隔不能出证
- ✅ **车辆备案校验**：车辆备案过期不能运输

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS + React Router v7 + Zustand
- **后端**：Express.js + TypeScript
- **数据库**：SQLite (better-sqlite3)
- **部署**：Docker + docker-compose

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发环境（前端+后端同时运行）
npm run dev
```

- 前端地址：http://localhost:5173
- 后端地址：http://localhost:3001

### Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

访问地址：http://localhost:3000

## 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| declarant1 | 123456 | 申报员 | 负责提交检疫申报 |
| inspector1 | 123456 | 检疫员 | 负责检疫校验和出证 |
| driver1 | 123456 | 司机 | 负责运输和签收 |
| reviewer1 | 123456 | 复核员 | 负责异常复核 |

## Smoke 测试

验证核心业务流程：申报免疫间隔不足批次并验证无法出证

```bash
# 确保后端服务已启动（端口 3001）
npm run smoke
```

测试流程：
1. 登录申报员账号
2. 创建猪群批次（免疫间隔不足）
3. 提交检疫申报
4. 尝试免疫校验和出证
5. 验证系统拒绝出证（免疫间隔不足）
6. 验证车辆备案有效期校验

## 数据模型

### 核心数据表
- `users` - 用户表（角色权限）
- `pig_batches` - 猪群批次表
- `immune_records` - 免疫记录表
- `transport_vehicles` - 运输车辆表
- `quarantine_declarations` - 检疫申报表（主表）
- `arrival_receipts` - 到场签收表
- `exception_reviews` - 异常复核表

### 状态流转
```
草稿 → 已申报 → 免疫校验通过 → 车辆已绑定 → 已出证 → 运输中 → 已签收
                ↓                ↓
            免疫不通过        车辆异常 → 异常复核
```

## 项目结构

```
├── api/                    # 后端代码
│   ├── db/                # 数据库层
│   ├── services/          # 业务服务层
│   ├── routes/            # API 路由
│   └── app.ts             # 应用入口
├── src/                    # 前端代码
│   ├── pages/             # 页面组件
│   ├── components/        # 公共组件
│   ├── store/             # 状态管理
│   └── lib/               # 工具库
├── scripts/                # 脚本
│   └── smoke.js           # Smoke 测试脚本
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/users` - 用户列表

### 猪群批次
- `GET /api/batches` - 批次列表
- `POST /api/batches` - 创建批次
- `GET /api/batches/:id/check-immune` - 检查免疫间隔
- `POST /api/batches/:id/immune-records` - 添加免疫记录

### 运输车辆
- `GET /api/vehicles` - 车辆列表
- `POST /api/vehicles` - 创建车辆
- `GET /api/vehicles/:id/check-validity` - 检查车辆有效期

### 检疫申报
- `GET /api/declarations` - 申报列表
- `POST /api/declarations` - 创建申报
- `POST /api/declarations/:id/check-immune` - 免疫校验
- `POST /api/declarations/:id/bind-vehicle` - 绑定车辆
- `POST /api/declarations/:id/issue-certificate` - 检疫出证
- `POST /api/declarations/:id/start-transport` - 开始运输
- `POST /api/declarations/:id/receive` - 到场签收
- `POST /api/declarations/:id/report-exception` - 上报异常

### 异常复核
- `GET /api/reviews` - 复核列表
- `POST /api/reviews/:id/review` - 提交复核意见
