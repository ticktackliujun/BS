# 一台电脑完成前后端搭建与测试闭环

> 本文只提供操作步骤，不会替你创建项目或修改业务代码。
>
> 目标是在同一台电脑上完成：
>
> ```text
> 浏览器 → Nginx:8080 → core 后端:5000
>                   └─ font 前端静态文件
> ```
>
> 单机阶段只使用 `127.0.0.1`，不开放局域网端口，也不配置防火墙。

## 1. 单机完成后的目录

```text
D:\Project\C#\BS\
├─ core\
│  ├─ core.sln
│  ├─ WorkshopTest.Core.csproj
│  ├─ Program.cs
│  ├─ appsettings.json
│  └─ Properties\
│     └─ launchSettings.json
├─ font\
│  ├─ index.html
│  ├─ css\
│  │  └─ site.css
│  └─ js\
│     └─ app.js
└─ deploy\
   └─ nginx\
      └─ workshop-test.one-pc.conf
```

| 目录 | 项目 | 启动方式 |
| --- | --- | --- |
| `core` | ASP.NET Core 后端 | Visual Studio、`dotnet run` 或发布后的 DLL |
| `font` | 独立静态前端 | 不单独启动，由 Nginx 提供文件 |

`core.sln` 只位于后端目录，只管理后端。`font` 不加入该解决方案。

## 2. 单机架构

```text
┌──────────────────────────────────────────┐
│ 同一台电脑                                │
│                                          │
│ 浏览器                                    │
│   │                                      │
│   │ http://127.0.0.1:8080                │
│   ▼                                      │
│ Nginx 监听 127.0.0.1:8080                │
│   ├─ /          → font/index.html        │
│   ├─ /css/...   → font/css/...           │
│   ├─ /js/...    → font/js/...            │
│   └─ /api/...   → 127.0.0.1:5000         │
│                         │                │
│                         ▼                │
│              ASP.NET Core core           │
└──────────────────────────────────────────┘
```

职责划分：

1. 浏览器显示页面并执行 JavaScript。
2. Nginx 返回 `font` 中的 HTML、CSS、JavaScript。
3. Nginx 把 `/api/...` 转发给后端。
4. `core` 只处理接口和业务逻辑。
5. 后端不返回前端页面，也不创建 `wwwroot`。

## 3. 端口安排

| 端口 | 程序 | 监听地址 | 用途 |
| --- | --- | --- | --- |
| `5000` | ASP.NET Core/Kestrel | `127.0.0.1` | 后端接口 |
| `8080` | Nginx | `127.0.0.1` | 单机统一入口 |

浏览器最终访问：

```text
http://127.0.0.1:8080/
```

单机阶段不要使用 `0.0.0.0:8080`。这个地址会监听所有网卡，等你以后需要局域网访问时再修改。

## 4. 安装开发工具

### 4.1 Visual Studio

在 Visual Studio Installer 中：

1. 找到 Visual Studio 2022。
2. 点击 **修改**。
3. 勾选 **ASP.NET 和 Web 开发**。
4. 完成安装并重启 Visual Studio。

如果找不到 **ASP.NET Core Web API**，通常就是缺少这个工作负载。

### 4.2 检查 .NET SDK

```powershell
dotnet --info
```

确认存在：

```text
.NET SDKs installed:
  8.0.x
```

本文使用 `net8.0`。如果机器只有其他 SDK，可以替换成实际安装且 Visual Studio 支持的版本，但全文要统一。

### 4.3 安装 Nginx

下载 Windows 稳定版并解压到：

```text
C:\nginx
```

确认存在：

```text
C:\nginx\nginx.exe
C:\nginx\conf\nginx.conf
```

单机阶段不需要修改 Windows 防火墙，因为 Nginx 只监听 `127.0.0.1`。

### 4.4 Node.js

当前前端是纯 HTML、CSS、JavaScript，不需要 Node.js。

以后换成 Vue、React 或 Vite 时再安装 Node.js。

## 5. 创建后端项目

### 5.1 推荐方式：命令行精确创建

```powershell
cd "D:\Project\C#\BS"

dotnet new webapi `
  -n WorkshopTest.Core `
  -o ".\core" `
  -f net8.0 `
  --no-openapi `
  --no-https
```

项目文件会直接写入：

```text
D:\Project\C#\BS\core
```

接着在 `core` 中创建解决方案：

```powershell
cd ".\core"
dotnet new sln -n core
dotnet sln ".\core.sln" add ".\WorkshopTest.Core.csproj"
cd ..
```

最终必须是：

```text
D:\Project\C#\BS\core\core.sln
D:\Project\C#\BS\core\WorkshopTest.Core.csproj
```

正确后缀是 `.sln`，不要使用 `.sin`。

### 5.2 完全使用 Visual Studio 创建

1. 打开 Visual Studio 2022。
2. 点击 **创建新项目**。
3. 搜索并选择 **ASP.NET Core Web API**。
4. 点击 **下一步**。
5. 设置：
   - 项目名称：`core`
   - 位置：`D:\Project\C#\BS`
   - 解决方案名称：`core`
6. **将解决方案和项目放在同一目录中**：不要勾选。
7. 点击 **下一步**。
8. 设置：
   - 框架：`.NET 8.0`
   - 身份验证类型：`无`
   - 配置 HTTPS：不勾选
   - 启用 OpenAPI：可以不勾选
   - 使用控制器：不勾选
9. 点击 **创建**。

目标是：

```text
D:\Project\C#\BS\core\core.sln
D:\Project\C#\BS\core\core.csproj
```

如果 Visual Studio 因为 `core` 文件夹已存在而拒绝创建，请使用 5.1 的命令行方式，然后双击 `core\core.sln` 打开。

### 5.3 打开和编译

双击：

```text
D:\Project\C#\BS\core\core.sln
```

Visual Studio 中按：

```text
Ctrl+Shift+B
```

或者命令行：

```powershell
dotnet build ".\core\core.sln" -c Debug
```

最终应有：

```text
0 Error(s)
```

## 6. 固定后端到 5000

在 Visual Studio 中：

1. 展开后端项目下的 `Properties`。
2. 双击 `launchSettings.json`。
3. 找到 `http` 配置。
4. 设置：

   ```json
   "applicationUrl": "http://127.0.0.1:5000",
   "launchBrowser": false
   ```

5. 保存文件。
6. 顶部启动配置选择 `http`。

完整参考：

```json
{
  "$schema": "http://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://127.0.0.1:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

命令行启动：

```powershell
cd "D:\Project\C#\BS"

dotnet run `
  --project ".\core\WorkshopTest.Core.csproj" `
  --urls "http://127.0.0.1:5000"
```

不要使用 `http://0.0.0.0:5000`。

## 7. 编写后端

### 7.1 修改 `core/Program.cs`

```csharp
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto;
});

var app = builder.Build();

app.UseForwardedHeaders();

app.MapGet("/api/ping", () =>
    Results.Ok(new
    {
        status = "ok",
        service = "WorkshopTest.Core",
        serverTime = DateTimeOffset.Now
    }));

app.MapPost("/api/echo", (EchoRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Message))
    {
        return Results.BadRequest(new
        {
            message = "Message 不能为空。"
        });
    }

    return Results.Ok(new
    {
        reply = $"服务器收到：{request.Message.Trim()}",
        serverTime = DateTimeOffset.Now
    });
});

app.Run();

public record EchoRequest(string? Message);
```

### 7.2 代码作用

| 代码 | 作用 |
| --- | --- |
| `CreateBuilder` | 创建 ASP.NET Core 应用 |
| `ForwardedHeadersOptions` | 处理 Nginx 传来的真实协议和来源信息 |
| `UseForwardedHeaders` | 加入转发头中间件 |
| `MapGet` | 注册 GET 接口 |
| `MapPost` | 注册 POST 接口 |
| `app.Run` | 启动 Kestrel |

### 7.3 core 中不要放前端

不要创建：

```text
core\wwwroot
```

`Program.cs` 中也不需要：

```csharp
app.UseStaticFiles();
app.UseDefaultFiles();
```

所有前端文件都放在 `font`。

### 7.4 后端单独测试

启动后端后：

```powershell
Invoke-RestMethod "http://127.0.0.1:5000/api/ping" |
  ConvertTo-Json -Depth 5
```

预期：

```json
{
  "status": "ok",
  "service": "WorkshopTest.Core",
  "serverTime": "2026-10-23T..."
}
```

如果这里失败，先不要配置 Nginx。

## 8. 创建前端项目

### 8.1 在 Visual Studio 中打开 font 文件夹

前端是独立静态项目，不需要 `.csproj`。

1. 创建目录：

   ```text
   D:\Project\C#\BS\font
   ```

2. 在 Visual Studio 中选择：

   ```text
   文件 → 打开 → 文件夹
   ```

3. 选择 `D:\Project\C#\BS\font`。
4. 在文件夹视图中创建：

   ```text
   font\
   ├─ index.html
   ├─ css\
   │  └─ site.css
   └─ js\
      └─ app.js
   ```

建议同时打开两个 Visual Studio 窗口：

- 窗口一打开 `core\core.sln`，编辑后端。
- 窗口二打开 `font` 文件夹，编辑前端。

### 8.2 创建 `font/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>单机前后端闭环测试</title>
    <link rel="stylesheet" href="/css/site.css">
    <script src="/js/app.js" defer></script>
</head>
<body>
    <main class="page">
        <h1>单机前后端闭环测试</h1>
        <p class="hint">
            页面来自 font 目录，接口来自 core 项目。
        </p>

        <section class="card">
            <h2>GET 接口</h2>
            <button id="pingButton" type="button">检查后端</button>
            <pre id="pingResult">尚未测试</pre>
        </section>

        <section class="card">
            <h2>POST 接口</h2>
            <form id="echoForm">
                <label for="message">发送给后端的文字</label>
                <input id="message" name="message" maxlength="100" required>
                <button type="submit">发送</button>
            </form>
            <pre id="echoResult">尚未发送</pre>
        </section>
    </main>
</body>
</html>
```

### 8.3 创建 `font/js/app.js`

```javascript
const pingButton = document.querySelector("#pingButton");
const pingResult = document.querySelector("#pingResult");
const echoForm = document.querySelector("#echoForm");
const messageInput = document.querySelector("#message");
const echoResult = document.querySelector("#echoResult");

pingButton.addEventListener("click", async () => {
    pingResult.textContent = "请求中...";

    try {
        const response = await fetch("/api/ping");
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        pingResult.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        pingResult.textContent = `失败：${error.message}`;
    }
});

echoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    echoResult.textContent = "发送中...";

    try {
        const response = await fetch("/api/echo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: messageInput.value
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        echoResult.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        echoResult.textContent = `失败：${error.message}`;
    }
});
```

前端必须使用相对路径：

```javascript
fetch("/api/ping")
```

不要写：

```javascript
fetch("http://127.0.0.1:5000/api/ping")
```

单机时这样做也可以通过，但以后迁移到两台电脑会失效。统一通过 8080 入口访问，也不需要配置 CORS。

### 8.4 创建 `font/css/site.css`

```css
:root {
    font-family: "Microsoft YaHei", system-ui, sans-serif;
    color: #182230;
    background: #edf2f7;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
}

.page {
    width: min(760px, calc(100% - 32px));
    margin: 40px auto;
}

.hint {
    color: #52606d;
}

.card {
    margin-top: 20px;
    padding: 20px;
    border: 1px solid #d9e2ec;
    border-radius: 10px;
    background: white;
}

button {
    padding: 9px 16px;
    border: 0;
    border-radius: 6px;
    color: white;
    background: #1261a0;
    cursor: pointer;
}

button:hover {
    background: #0d4d82;
}

form {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

input {
    flex: 1 1 280px;
    padding: 9px 12px;
    border: 1px solid #bcccdc;
    border-radius: 6px;
    font: inherit;
}

pre {
    overflow: auto;
    padding: 12px;
    border-radius: 6px;
    background: #f0f4f8;
    white-space: pre-wrap;
}
```

### 8.5 静态前端为什么没有单独启动命令

`font` 是静态文件，没有编译步骤，也没有独立进程。

单机测试时：

```text
启动前端 = 启动 Nginx
```

不要通过双击 `index.html` 测试接口：

```text
file:///D:/Project/C#/BS/font/index.html
```

这个地址不经过 Nginx，`/api/ping` 无法转发到后端。

正确地址是：

```text
http://127.0.0.1:8080/
```

## 9. 配置单机 Nginx

### 9.1 创建配置文件

创建：

```text
D:\Project\C#\BS\deploy\nginx\workshop-test.one-pc.conf
```

内容：

```nginx
server {
    listen 127.0.0.1:8080;
    server_name localhost;

    root "D:/Project/C#/BS/font";
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```

配置说明：

| 配置 | 作用 |
| --- | --- |
| `listen 127.0.0.1:8080` | 只允许本机访问 8080 |
| `root` | 前端目录 |
| `index index.html` | 根路径返回首页 |
| `location /api/` | API 转发到后端 |
| `proxy_pass` 末尾无 `/` | 保留 `/api/ping` 原路径 |
| `location /` | 返回其他静态文件 |

项目路径中包含 `#`，所以 `root` 必须使用双引号：

```nginx
root "D:/Project/C#/BS/font";
```

### 9.2 复制到 Nginx

把：

```text
D:\Project\C#\BS\deploy\nginx\workshop-test.one-pc.conf
```

复制到：

```text
C:\nginx\conf\workshop-test.one-pc.conf
```

### 9.3 在主配置中引用

打开：

```text
C:\nginx\conf\nginx.conf
```

找到：

```nginx
http {
```

在 `http { ... }` 内部添加：

```nginx
include C:/nginx/conf/workshop-test.one-pc.conf;
```

不要把这个 include 放进另一个 `server { }`。

### 9.4 检查语法

```powershell
cd "C:\nginx"
.\nginx.exe -t
```

预期：

```text
syntax is ok
test is successful
```

### 9.5 启动和重载

启动：

```powershell
cd "C:\nginx"
.\nginx.exe
```

修改配置后先检查，再重载：

```powershell
cd "C:\nginx"
.\nginx.exe -t
.\nginx.exe -s reload
```

停止：

```powershell
cd "C:\nginx"
.\nginx.exe -s quit
```

检查监听：

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen
```

预期：

```text
LocalAddress   LocalPort
127.0.0.1      8080
```

如果 Nginx 已经启动，不要重复执行多个 `nginx.exe`，只需要重载配置。

## 10. 单机闭环测试顺序

严格按顺序执行，哪一步失败就停在哪一步。

### 第 1 步：编译后端

```powershell
cd "D:\Project\C#\BS"
dotnet build ".\core\core.sln" -c Debug
```

预期：

```text
0 Error(s)
```

### 第 2 步：启动后端

Visual Studio 方式：

1. 打开 `core\core.sln`。
2. 顶部启动配置选择 `http`。
3. 按 `F5`。
4. 保持调试运行。

PowerShell 方式：

```powershell
cd "D:\Project\C#\BS"

dotnet run `
  --project ".\core\WorkshopTest.Core.csproj" `
  --urls "http://127.0.0.1:5000"
```

保持 PowerShell 窗口打开。

### 第 3 步：测试后端自身

打开第二个 PowerShell：

```powershell
Invoke-RestMethod "http://127.0.0.1:5000/api/ping" |
  ConvertTo-Json -Depth 5
```

成功标准：

- 返回 JSON。
- `status` 是 `ok`。
- `service` 是 `WorkshopTest.Core`。

失败时不要继续配置 Nginx。

### 第 4 步：启动 Nginx

```powershell
cd "C:\nginx"
.\nginx.exe
```

如果已经启动：

```powershell
cd "C:\nginx"
.\nginx.exe -s reload
```

### 第 5 步：测试前端首页

浏览器打开：

```text
http://127.0.0.1:8080/
```

成功标准：

- 显示“单机前后端闭环测试”。
- 样式正常。
- 不是 Nginx 默认欢迎页。
- 不是目录浏览页。

### 第 6 步：测试 Nginx GET 转发

浏览器打开：

```text
http://127.0.0.1:8080/api/ping
```

应该返回后端 JSON。

PowerShell 测试：

```powershell
Invoke-RestMethod "http://127.0.0.1:8080/api/ping" |
  ConvertTo-Json -Depth 5
```

### 第 7 步：测试页面按钮

在 `http://127.0.0.1:8080/`：

1. 点击“检查后端”。
2. 页面应显示 JSON。
3. 输入“领料单测试”。
4. 点击“发送”。
5. 页面应显示“服务器收到：领料单测试”。

### 第 8 步：测试 POST 接口

```powershell
$body = @{ message = "领料单测试" } | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8080/api/echo" `
  -Method Post `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
```

预期：

```json
{
  "reply": "服务器收到：领料单测试",
  "serverTime": "..."
}
```

### 第 9 步：浏览器开发者工具检查

1. 按 `F12`。
2. 打开 **Network**。
3. 勾选 **Disable cache**。
4. 点击页面按钮。
5. 查看 `/api/ping` 和 `/api/echo`。
6. 两个请求都应是 `200`。
7. 查看 Console，不应出现跨域错误。

### 第 10 步：确认端口监听

```powershell
Get-NetTCPConnection -LocalPort 5000,8080 -State Listen
```

预期：

```text
127.0.0.1      5000
127.0.0.1      8080
```

到这里，单机闭环完成：

```text
font 页面
   ↓
Nginx 静态文件服务
   ↓
Nginx /api 反向代理
   ↓
core 接口
   ↓
JSON 返回页面
```

## 11. 单机日常开发流程

### 11.1 每次启动

1. 启动后端：

   ```powershell
   cd "D:\Project\C#\BS"

   dotnet run `
     --project ".\core\WorkshopTest.Core.csproj" `
     --urls "http://127.0.0.1:5000"
   ```

2. 启动 Nginx：

   ```powershell
   cd "C:\nginx"
   .\nginx.exe
   ```

3. 浏览器打开：

   ```text
   http://127.0.0.1:8080/
   ```

### 11.2 修改前端

1. 用 Visual Studio 打开 `font` 文件夹。
2. 修改 HTML、CSS 或 JavaScript。
3. 保存。
4. 浏览器按 `Ctrl+F5`。

前端不需要：

- `dotnet build`
- 重新发布后端
- 重启 Nginx

### 11.3 修改后端

1. 修改 `core` 中的 `.cs` 文件。
2. 停止旧后端进程。
3. 按 `F5` 或重新执行 `dotnet run`。
4. 刷新页面重新测试。

### 11.4 修改 Nginx 配置

```powershell
cd "C:\nginx"
.\nginx.exe -t
.\nginx.exe -s reload
```

必须先检查语法再重载。

## 12. 常见问题

### 12.1 找不到 dotnet

```powershell
dotnet --info
```

处理：

1. 关闭并重新打开 PowerShell。
2. 检查 .NET SDK 是否安装完成。
3. 重新打开 Visual Studio。

### 12.2 `core.sln` 打不开

正确文件：

```text
D:\Project\C#\BS\core\core.sln
```

不要使用：

```text
core.sin
```

`.sin` 不是 Visual Studio 解决方案后缀。

### 12.3 5000 端口被占用

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen
```

根据 `OwningProcess` 查看进程：

```powershell
Get-Process -Id 进程编号
```

确认进程身份后再停止。不要随意结束不认识的系统进程。

### 12.4 8080 端口被占用

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen
Get-Process nginx
```

常见原因：

- Nginx 已经启动过。
- 两个 Nginx 配置同时监听 8080。
- 其他 Web 服务占用了 8080。

已启动时只需要执行 `nginx -s reload`。

### 12.5 `nginx -t` 失败

检查：

1. PowerShell 当前目录是否是 `C:\nginx`。
2. 配置文件是否在 `C:\nginx\conf`。
3. include 是否使用正确的绝对路径。
4. 花括号是否配对。
5. 修改是否已经保存。

### 12.6 8080 显示 Nginx 默认页

```powershell
Get-Content "C:\nginx\conf\nginx.conf"
Get-Content "C:\nginx\conf\workshop-test.one-pc.conf"
```

确认：

- include 在 `http { }` 内。
- `listen 127.0.0.1:8080;` 正确。
- `root "D:/Project/C#/BS/font";` 正确。
- 已执行 `nginx -s reload`。

### 12.7 首页 404

检查：

```text
D:\Project\C#\BS\font\index.html
D:\Project\C#\BS\font\css\site.css
D:\Project\C#\BS\font\js\app.js
```

Nginx 应配置：

```nginx
root "D:/Project/C#/BS/font";
index index.html;
```

不要写成：

```nginx
root "D:/Project/C#/BS/font/index.html";
```

### 12.8 `/api/ping` 返回 502

```powershell
Invoke-RestMethod "http://127.0.0.1:5000/api/ping"
Get-NetTCPConnection -LocalPort 5000 -State Listen
```

后端没有启动、启动失败或没有监听 5000 时，Nginx 会返回 502。

### 12.9 `/api/ping` 返回 404

检查：

1. `Program.cs` 是否有 `MapGet("/api/ping", ...)`。
2. 修改后是否重新启动后端。
3. Nginx `proxy_pass` 是否错误改写了路径。
4. 前端请求地址是否拼写错误。

### 12.10 页面显示 `Failed to fetch`

```powershell
Invoke-RestMethod "http://127.0.0.1:5000/api/ping"
Invoke-RestMethod "http://127.0.0.1:8080/api/ping"
```

如果第一项成功、第二项失败，问题在 Nginx 转发。两者都成功时，查看浏览器 Network 和 Console。

### 12.11 CSS 或 JavaScript 不加载

直接打开：

```text
http://127.0.0.1:8080/css/site.css
http://127.0.0.1:8080/js/app.js
```

它们应返回实际文件内容，而不是 404 或 HTML。

### 12.12 修改前端后没有更新

1. 浏览器按 `Ctrl+F5`。
2. 在开发者工具中禁用缓存。
3. 确认 Nginx `root` 指向当前目录。
4. 确认没有修改另一份旧的发布目录。

## 13. 单机阶段不要做的事

### 13.1 不要把前端放进 core/wwwroot

错误：

```text
core\wwwroot\index.html
```

正确：

```text
font\index.html
```

### 13.2 不要创建根目录 `BS.sln`

正确：

```text
core\core.sln
```

`core.sln` 只管理后端，`font` 保持独立。

### 13.3 不要让前端直接访问 5000

错误：

```javascript
fetch("http://127.0.0.1:5000/api/ping")
```

正确：

```javascript
fetch("/api/ping")
```

页面和接口统一走 8080，由 Nginx 分流。

### 13.4 不需要 CORS

页面和接口使用同一入口：

```text
页面：http://127.0.0.1:8080/
接口：http://127.0.0.1:8080/api/ping
```

同源访问，不需要配置 CORS。

## 14. 单机验收清单

### 目录

- [ ] `core\core.sln` 存在。
- [ ] `core` 是后端项目目录。
- [ ] `font` 是独立前端目录。
- [ ] `core` 中没有 `wwwroot`。
- [ ] 没有根目录 `BS.sln`。

### 后端

- [ ] `dotnet build ".\core\core.sln"` 成功。
- [ ] 后端监听 `http://127.0.0.1:5000`。
- [ ] `/api/ping` 返回 JSON。
- [ ] `/api/echo` POST 成功。

### 前端

- [ ] `font\index.html` 存在。
- [ ] `font\css\site.css` 存在。
- [ ] `font\js\app.js` 存在。
- [ ] JavaScript 使用 `/api/...` 相对路径。

### Nginx

- [ ] `nginx -t` 通过。
- [ ] Nginx 监听 `127.0.0.1:8080`。
- [ ] 根路径返回 `font\index.html`。
- [ ] CSS 和 JavaScript 返回 200。
- [ ] `/api/ping` 返回后端 JSON。
- [ ] `/api/echo` 返回 POST 结果。

### 浏览器

- [ ] `http://127.0.0.1:8080/` 页面正常。
- [ ] 页面 GET 请求成功。
- [ ] 页面 POST 请求成功。
- [ ] Network 中接口状态码为 200。
- [ ] Console 中没有红色错误。

全部通过后，单机搭建和测试闭环完成。

## 15. 以后迁移到两台电脑

当前单机代码不用重写。迁移时主要改变部署位置和 Nginx 监听方式。

如果继续让电脑 A 同时运行 Nginx 和 core：

1. 把后端发布包放到电脑 A。
2. 把 `font` 目录复制到电脑 A。
3. 修改 Nginx `root` 为电脑 A 上的 `font` 路径。
4. 把 Nginx 监听改为：

   ```nginx
   listen 8080;
   ```

5. 在电脑 A 防火墙放行 8080。
6. 电脑 B 访问：

   ```text
   http://电脑A的IP:8080/
   ```

不要开放 5000。

单机阶段先把 127.0.0.1 的完整链路跑通。网络、防火墙和跨机路由放到单独阶段处理，这样问题更容易定位。
