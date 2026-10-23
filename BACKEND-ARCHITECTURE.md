# 零部件管理系统 — 后端架构与业务说明

> 本文只描述后端结构、接口、数据库和技术约束。
>
> 前端页面与交互见 [FRONTEND-ARCHITECTURE.md](FRONTEND-ARCHITECTURE.md)。

## 1. 当前范围

当前后端已经实现：

- ASP.NET Core Web API。
- Controller 路由模式。
- 登录接口。
- MySQL 用户和角色查询。
- 首次启动创建基础表。
- 初始化唯一管理员账号 `admin / 123456`。
- 零部件数量读取和保存。
- JSON 文件和 MySQL 两种当前数据存储。
- 全局 ProblemDetails 异常处理。

当前后端没有实现：

- JWT 或 Cookie 登录凭证。
- `[Authorize]` 接口权限控制。
- 用户管理接口。
- 角色权限细分。
- 零部件台账。
- 库存流水、领料申请。
- EF Core migrations。
- 正式密码哈希。

## 2. 技术栈

| 项目 | 当前实现 |
| --- | --- |
| 运行时 | .NET 8 |
| Web | ASP.NET Core |
| API 风格 | Controller |
| ORM | EF Core 8 |
| MySQL Provider | Pomelo.EntityFrameworkCore.MySql 8.0.3 |
| 数据库 | MySQL 8 |
| 错误响应 | RFC 7807 ProblemDetails |
| 零部件数量 | `Data/db.json` |

## 3. 整体结构

```text
HTTP 请求
  ↓
Nginx / 直连 Kestrel
  ↓
Program.cs
  ↓
模块注册与 Controller 路由
  ↓
Controller
  ↓
Service
  ↓
Repository / DbContext
  ↓
JSON 文件或 MySQL
```

## 4. 目录结构

```text
core/core/
├─ Program.cs
├─ appsettings.json
├─ core.http
├─ Data/
│  └─ db.json
├─ Infrastructure/
│  ├─ InfrastructureModule.cs
│  └─ Persistence/
│     ├─ AppDbContext.cs
│     ├─ DatabaseInitializer.cs
│     └─ Configurations/
│        ├─ RoleConfiguration.cs
│        └─ UserConfiguration.cs
├─ Modules/
│  ├─ Auth/
│  │  ├─ AuthModule.cs
│  │  ├─ Controllers/
│  │  │  └─ AuthController.cs
│  │  ├─ DTOs/
│  │  │  └─ AuthModels.cs
│  │  ├─ Entities/
│  │  │  ├─ Role.cs
│  │  │  └─ User.cs
│  │  └─ Services/
│  │     ├─ IAuthService.cs
│  │     └─ AuthService.cs
│  └─ Warehouse/
│     ├─ WarehouseModule.cs
│     ├─ Controllers/
│     │  └─ PartQuantityController.cs
│     ├─ DTOs/
│     │  └─ PartQuantityModels.cs
│     ├─ Services/
│     │  ├─ IPartQuantityService.cs
│     │  └─ PartQuantityService.cs
│     └─ Repositories/
│        ├─ IPartQuantityRepository.cs
│        └─ PartQuantityRepository.cs
└─ Shared/
   └─ Web/
      └─ ApiExceptionHandler.cs
```

## 5. 分层规则

### Business / Domain

业务代码放在：

```text
Modules/Auth
Modules/Warehouse
```

这些模块包含：

- 业务实体。
- 请求和响应 DTO。
- Controller。
- Service。
- Repository。

业务模块内部仍然保持技术分层：

```text
Controllers
Services
Repositories
DTOs
Entities
```

### Infrastructure

纯技术代码放在：

```text
Infrastructure
```

当前包括：

- MySQL DbContext。
- EF Core 表映射。
- 数据库初始化。
- 全局连接注册。

### Shared

多个模块共用但不属于具体业务的技术代码放在：

```text
Shared/Web
```

当前只有全局异常处理。

## 6. 启动流程

入口：

```text
core/core/Program.cs
```

执行顺序：

```text
创建 WebApplicationBuilder
  ↓
注册 ProblemDetails
  ↓
注册全局异常处理器
  ↓
启用 Controller
  ↓
注册 AuthModule
  ↓
注册 WarehouseModule
  ↓
注册 Infrastructure / MySQL
  ↓
构建应用
  ↓
注册异常中间件
  ↓
MapControllers
  ↓
检查数据库并创建缺失表
  ↓
检查管理员账号
  ↓
启动 Kestrel
```

数据库不可用时，应用可能在启动阶段失败。这是正常依赖关系。

## 7. 模块注册

### AuthModule

```csharp
services.AddScoped<IAuthService, AuthService>();
```

### WarehouseModule

```csharp
services.AddSingleton<IPartQuantityRepository, PartQuantityRepository>();
services.AddScoped<IPartQuantityService, PartQuantityService>();
```

Repository 使用单例是为了让所有请求共享同一个文件锁，避免并发读写 `db.json`。

## 8. 登录业务

### 8.1 当前账号

初始化数据只创建一个用户：

| Username | Password | RealName | Role |
| --- | --- | --- | --- |
| `admin` | `123456` | 系统管理员 | 项目管理员 |

当前密码为测试阶段明文。正式使用前必须改成哈希保存。

### 8.2 登录接口

```http
POST /api/Auth/login
Content-Type: application/json
```

请求：

```json
{
  "username": "admin",
  "password": "123456"
}
```

成功：`200 OK`

```json
{
  "user": {
    "username": "admin",
    "displayName": "系统管理员",
    "role": "admin",
    "roleLabel": "项目管理员"
  }
}
```

错误：

| 场景 | 状态码 |
| --- | --- |
| 账号或密码为空 | `400` |
| 账号或密码错误 | `401` |
| 数据库异常 | `500` |

### 8.3 查询流程

```text
接收登录请求
  ↓
AuthController 校验空值
  ↓
AuthService 查询 Users JOIN Roles
  ↓
比对 Password
  ↓
返回用户和角色
```

当前登录不签发 Token，也不建立服务端 Session。

## 9. 零部件数量业务

### 9.1 当前业务

系统当前只有一个零部件数量：

- 读取上次保存数量。
- 保存新的整数数量。
- 允许范围 `0～1000000`。
- 数据保存到 `Data/db.json`。

### 9.2 读取接口

```http
GET /api/PartQuantity
```

响应：

```json
{
  "quantity": 123
}
```

### 9.3 保存接口

```http
PUT /api/PartQuantity
Content-Type: application/json
```

请求：

```json
{
  "quantity": 50
}
```

成功：`200 OK`

```json
{
  "quantity": 50
}
```

无效数量：`400 Bad Request`

### 9.4 调用链

```text
PartQuantityController
  ↓
IPartQuantityService
  ↓
IPartQuantityRepository
  ↓
Data/db.json
```

Repository 使用 `SemaphoreSlim` 串行化文件读写。

## 10. MySQL 数据库

### 10.1 连接

连接字符串位于：

```text
appsettings.json → ConnectionStrings:DefaultConnection
```

当前配置连接：

```text
127.0.0.1:3306
Database: mes_db
Charset: utf8mb4
```

用户名和密码不在架构文档中重复。

### 10.2 Roles 表

```text
Roles
├─ Id           INT，自增主键
├─ Name         VARCHAR(50)，必填，唯一
└─ Description  VARCHAR(200)，可空
```

初始角色：

| Id | Name | Description |
| --- | --- | --- |
| 1 | 项目管理员 | 负责项目管理、用户和权限配置。 |
| 2 | 安装工程师 | 负责安装和装配任务执行。 |
| 3 | 仓库管理员 | 负责库存和领料业务。 |

### 10.3 Users 表

```text
Users
├─ Id           INT，自增主键
├─ Username     VARCHAR(50)，必填，唯一
├─ Password     VARCHAR(100)，必填
├─ RealName     VARCHAR(50)，必填
└─ RoleId       INT，外键 Roles.Id
```

外键：

```text
FK_Users_Roles_RoleId
```

删除行为：

```text
Restrict
```

### 10.4 初始化策略

启动时执行：

```text
EnsureCreatedAsync
  ↓
如果表不存在就创建
  ↓
写入 EF Core 配置中的角色种子
  ↓
如果 admin 不存在就创建
```

`EnsureCreatedAsync` 只适合当前初始阶段。后续表结构开始变化时，应替换为 EF Core migrations。

## 11. 异常处理

全局异常处理器：

```text
Shared/Web/ApiExceptionHandler.cs
```

当前映射：

- JSON 数据文件格式错误 → `500 ProblemDetails`。
- 文件读写异常 → `500 ProblemDetails`。
- 其他异常交给 ASP.NET Core 默认异常处理。

接口错误尽量使用 ProblemDetails，而不是随意返回匿名 `{ message }`。

## 12. 配置

`appsettings.json` 当前包含：

```text
Logging
AllowedHosts
Inventory:DataFile
ConnectionStrings:DefaultConnection
```

`Inventory:DataFile` 用于零部件数量 JSON 文件。

## 13. 调试和测试

构建：

```powershell
dotnet build "core\core\core.sln"
```

启动：

```powershell
dotnet run `
  --project "core\core\core.csproj" `
  --urls "http://127.0.0.1:5000"
```

HTTP 测试文件：

```text
core/core/core.http
```

当前接口：

| 方法 | 地址 | 用途 |
| --- | --- | --- |
| POST | `/api/Auth/login` | 登录 |
| GET | `/api/PartQuantity` | 读取数量 |
| PUT | `/api/PartQuantity` | 保存数量 |

## 14. 安全和技术债

当前必须明确：

- 密码明文保存。
- 登录不返回 Token。
- PartQuantity 接口没有 `[Authorize]`。
- 用户角色只用于前端展示。
- 前端 localStorage 可被修改。
- 数据库连接字符串包含本地开发凭据。
- `EnsureCreated` 不能处理后续结构变更。
- 零部件数量仍使用 JSON，与用户/角色不在同一个数据库。

正式上线前至少需要：

1. 密码哈希。
2. JWT 或安全 Cookie。
3. 接口鉴权与角色授权。
4. 配置密钥外置。
5. EF Core migrations。
6. 用户和角色管理 API。
7. 业务数据统一进入 MySQL。

## 15. 后续业务规划

建议按以下顺序扩展仓库模块：

1. 零部件主数据。
2. 零部件数量与 MySQL 表。
3. 出入库流水。
4. 领料申请。
5. 仓库发放和驳回。
6. 用户和角色管理。
7. 权限菜单和接口授权。
