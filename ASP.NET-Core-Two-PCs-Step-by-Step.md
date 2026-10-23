# 双项目版：core 后端 + font 前端 + 两台电脑部署操作手册

> 本文只提供操作步骤，不会替你创建项目或修改业务代码。
>
> 你要建立的目录关系是：
>
> ```text
> D:\Project\C#\BS\
> ├─ core\    ← 后端目录
> │  └─ core.sln
> └─ font\    ← 独立的前端项目
> ```
>
> `core.sln` 只放在后端目录，只管理后端；前端目录使用你指定的名称 `font`。

## 1. 最终架构

### 1.1 两个项目必须分开

| 目录 | 项目类型 | 负责什么 | 不负责什么 |
| --- | --- | --- | --- |
| `core` | ASP.NET Core Web API | 接口、业务逻辑、以后连接数据库 | 不存放 HTML/CSS/JavaScript |
| `font` | 独立静态前端项目 | 页面、样式、JavaScript、调用后端 API | 不编译 C#，不直接启动 Kestrel |

`core` 中不要创建 `wwwroot` 来放前端文件。`font` 也不应该嵌套在 `core` 里面。

### 1.2 两台电脑的分工

第一阶段建议：

| 名称 | 角色 | 安装什么 |
| --- | --- | --- |
| 电脑 A | 服务器 + Nginx 反向代理 | .NET 运行时、Nginx、部署后的 `core` 和 `font` |
| 电脑 B | 开发机 + 客户端 | Visual Studio、.NET SDK、Nginx、浏览器 |
| 车间电脑 C、D…… | 客户端 | 只需要浏览器 |

请求流程：

```text
电脑 B 或车间浏览器
        │
        │ http://电脑A的IP:8080
        ▼
┌──────────────────────────────────┐
│ 电脑 A                            │
│                                  │
│ Nginx 监听 8080                   │
│   ├─ 普通页面请求                  │
│   │    └─ 读取 C:\WorkshopApp\font│
│   │                               │
│   └─ /api/ 请求                   │
│        └─ 转发到 127.0.0.1:5000   │
│                                  │
│ ASP.NET Core 监听                 │
│ 127.0.0.1:5000                   │
└──────────────────────────────────┘
```

一次访问的过程：

1. 浏览器打开 `http://电脑A的IP:8080/`。
2. Nginx 返回 `font/index.html`。
3. 浏览器再请求 `/css/site.css` 和 `/js/app.js`。
4. Nginx 从 `font` 目录返回这些静态文件。
5. 页面请求 `/api/ping`。
6. Nginx 把 `/api/ping` 转发给 `127.0.0.1:5000`。
7. `core` 处理请求并返回 JSON。
8. Nginx 把 JSON 返回给浏览器。

### 1.3 为什么不在前端直接写后端地址

前端代码使用相对地址：

```javascript
fetch("/api/ping")
```

不要写：

```javascript
fetch("http://127.0.0.1:5000/api/ping")
```

因为 `127.0.0.1` 在客户端浏览器上表示“客户端自己”，不是电脑 A。使用相对地址，浏览器会自动请求当前入口的同一个主机和端口，再由 Nginx 转发。

### 1.4 端口约定

| 端口 | 监听程序 | 访问范围 | 用途 |
| --- | --- | --- | --- |
| `5000` | ASP.NET Core/Kestrel | 只允许电脑 A 本机 | 后端内部接口 |
| `8080` | Nginx | 电脑 A、电脑 B、车间电脑 | 前端页面和 API 统一入口 |

车间人员只需要访问：

```text
http://电脑A的IP:8080
```

不需要知道 5000。

### 1.5 两台电脑的网络

第一阶段最简单的方式是让电脑 A 和电脑 B 在同一个局域网：

```text
电脑 A：192.168.3.10
电脑 B：192.168.3.20
```

具体要求：

- 电脑 B 能访问电脑 A 的 8080 端口。
- 电脑 A 使用固定 IP，或在路由器中设置 DHCP 地址保留。
- 不建议服务器电脑使用会不断变化的自动分配 IP。
- 如果不在同一网段，需要路由器或三层交换机提供互通路由。

在电脑 A 查看 IP：

```powershell
ipconfig
```

找到当前正在使用网卡的 IPv4 地址，不要使用：

- `127.0.0.1`
- `169.254.x.x`
- 已断开连接的网卡
- 虚拟机虚拟网卡

在电脑 B 测试：

```powershell
ping 电脑A的IP
Test-NetConnection 电脑A的IP -Port 8080
```

最终看 `TcpTestSucceeded : True`。Ping 不通不一定代表网页一定不能访问，因为有些防火墙禁止 ICMP，但 8080 端口测试必须成功。

---

## 2. 安装开发工具

### 2.1 安装 Visual Studio 工作负载

1. 打开 **Visual Studio Installer**。
2. 找到 Visual Studio 2022。
3. 点击 **修改（Modify）**。
4. 勾选 **ASP.NET 和 Web 开发**
   - 英文：**ASP.NET and web development**
5. 点击 **安装** 或 **修改**。
6. 完成后重启 Visual Studio。

如果新建项目时找不到 **ASP.NET Core Web API**，通常是没有安装这个工作负载。

### 2.2 检查 .NET SDK

打开 PowerShell：

```powershell
dotnet --info
```

确认存在：

```text
.NET SDKs installed:
  8.0.x
```

本文命令使用 `net8.0`，因为它和当前 Visual Studio 2022 环境匹配。长期生产项目应关注 .NET 版本的官方支持期限，并在工具链支持时升级到当前长期支持版本。

如果提示 `dotnet` 不是命令：

1. 关闭当前 PowerShell。
2. 重新打开 PowerShell。
3. 仍失败时检查 .NET SDK 是否安装完成。

### 2.3 检查 Node.js

本文的前端是最简单的静态 HTML/CSS/JavaScript，不依赖 Node.js，也不需要 React、Vue 或 npm 构建。

如果以后改为 Vite、Vue、React 或其他前端工程，再安装 Node.js。当前最小测试不需要安装。

### 2.4 检查 Nginx

第一阶段需要在电脑 B 上安装一份 Nginx，用来模拟电脑 A 的最终访问方式。

下载 Windows 稳定版后解压，例如：

```text
C:\nginx
```

确认存在：

```text
C:\nginx\nginx.exe
C:\nginx\conf\nginx.conf
```

正式生产环境通常优先使用 Linux 版 Nginx；当前先完成 Windows 局域网测试。

---

## 3. 创建目录和解决方案

### 3.1 推荐使用命令行初始化双项目目录

当前目录是：

```text
D:\Project\C#\BS
```

打开 PowerShell：

```powershell
cd "D:\Project\C#\BS"
```

创建后端项目时，把输出目录明确指定为 `core`：

```powershell
dotnet new webapi `
  -n WorkshopTest.Core `
  -o ".\core" `
  -f net8.0 `
  --no-openapi `
  --no-https
```

参数含义：

| 参数 | 含义 |
| --- | --- |
| `-n WorkshopTest.Core` | 后端项目名称 |
| `-o .\core` | 把项目文件直接输出到 `core` |
| `-f net8.0` | 使用 .NET 8 |
| `--no-openapi` | 暂时不增加 Swagger/OpenAPI 依赖 |
| `--no-https` | 局域网最小测试先使用 HTTP |

执行后，`core` 中应有：

```text
core\
├─ Program.cs
├─ Properties\
│  └─ launchSettings.json
├─ appsettings.json
└─ WorkshopTest.Core.csproj
```

创建解决方案并把后端项目加入：

```powershell
cd ".\core"
dotnet new sln -n core
dotnet sln ".\core.sln" add ".\WorkshopTest.Core.csproj"
cd ..
```

现在根目录结构是：

```text
D:\Project\C#\BS\
├─ core\
│  ├─ core.sln
│  ├─ WorkshopTest.Core.csproj
│  ├─ Program.cs
│  └─ ...
└─ font\
```

不要在这个位置再创建根目录 `BS.sln`。后端解决方案文件就是：

```text
D:\Project\C#\BS\core\core.sln
```

此时 `font` 可以为空，下一步再创建前端文件。

### 3.2 在 Visual Studio 中创建后端项目和解决方案

如果不想使用命令行，也可以完全在 Visual Studio 中创建，但图形界面不容易把“项目名称”和“输出文件夹”分别设置。

1. 打开 Visual Studio 2022。
2. 点击 **创建新项目**。
3. 搜索并选择 **ASP.NET Core Web API**。
4. 点击 **下一步**。
5. 设置：
   - 项目名称：`core`
   - 位置：`D:\Project\C#\BS`
   - 解决方案名称：`core`
6. 如果出现 **将解决方案和项目放在同一目录中**，不要勾选。
7. 点击 **下一步**。
8. 设置：
   - 框架：`.NET 8.0`
   - 身份验证类型：`无`
   - 配置 HTTPS：不勾选
   - 启用 OpenAPI：可以不勾选
   - 使用控制器：不勾选
9. 点击 **创建**。

目标是得到：

```text
D:\Project\C#\BS\core\core.sln
D:\Project\C#\BS\core\core.csproj
```

如果 Visual Studio 因为 `core` 文件夹已经存在而拒绝创建，删掉空文件夹重试，或者直接使用方法 3.1 的命令行方式。不要在 `core` 里面再嵌套一层 `src\WorkshopTest.Web`，也不要把 `core.sln` 放到项目根目录 `D:\Project\C#\BS`。

### 3.3 在 Visual Studio 中打开后端

双击：

```text
D:\Project\C#\BS\core\core.sln
```

或者：

```text
文件 → 打开 → 项目/解决方案 → core.sln
```

解决方案资源管理器中应该能看到后端项目。此解决方案只包含后端；前端 `font` 不在这里。

### 3.4 编译后端

Visual Studio：

```text
生成 → 生成解决方案
```

快捷键：

```text
Ctrl+Shift+B
```

命令行：

```powershell
dotnet build ".\core\core.sln" -c Debug
```

要求最后显示：

```text
0 Error(s)
```

---

## 4. 配置后端端口为 5000

### 4.1 在 Visual Studio 中修改

1. 在解决方案资源管理器中展开 `Properties`。
2. 双击 `launchSettings.json`。
3. 找到 `http` 配置。
4. 把 `applicationUrl` 改为：

   ```json
   "applicationUrl": "http://127.0.0.1:5000"
   ```

5. 保存。
6. 回到 Visual Studio 顶部工具栏，把启动配置下拉框选择为 `http`。

不要选择会自动打开 HTTPS 的配置，否则你测试的地址可能不是 `http://127.0.0.1:5000`。

参考内容：

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

`launchBrowser` 设为 `false` 是因为后端的 `/` 不是页面，前端页面由 Nginx 从 `font` 目录返回。后端只需要提供 `/api/...`。

### 4.2 命令行启动后端

```powershell
dotnet run `
  --project ".\core\WorkshopTest.Core.csproj" `
  --urls "http://127.0.0.1:5000"
```

不要使用 `http://0.0.0.0:5000` 作为当前阶段的开发地址。同机 Nginx 只需要访问本机回环地址。

---

## 5. 编写后端 `core`

### 5.1 修改 `core/Program.cs`

在 Visual Studio 中双击：

```text
core\Program.cs
```

最小测试代码：

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

这段代码的作用：

1. `CreateBuilder` 创建 ASP.NET Core 应用。
2. `ForwardedHeadersOptions` 让后端能识别 Nginx 传来的真实协议和来源信息。
3. `UseForwardedHeaders()` 把转发头处理加入请求管道。
4. `MapGet("/api/ping")` 提供健康检查接口。
5. `MapPost("/api/echo")` 提供一个最小的 POST 测试接口。
6. `app.Run()` 启动 Kestrel。

### 5.2 不要添加这些后端静态文件代码

因为是独立双项目，`core` 中不要添加：

```csharp
app.UseDefaultFiles();
app.UseStaticFiles();
```

也不要创建：

```text
core\wwwroot
```

前端文件必须放在：

```text
font\
```

### 5.3 编译和测试后端

Visual Studio 按 `F5`，或者命令行运行：

```powershell
dotnet run `
  --project ".\core\WorkshopTest.Core.csproj" `
  --urls "http://127.0.0.1:5000"
```

测试：

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

如果后端 `/api/ping` 还没有成功，不要继续配置前端和 Nginx。

---

## 6. 创建独立前端项目 `font`

这一阶段的 `font` 是一个独立的静态前端项目。它不需要 `.csproj`，也不需要编译，发布时直接复制整个目录给 Nginx。

### 6.1 在 Visual Studio 中打开前端文件夹

Visual Studio 可以同时用“解决方案视图”编辑后端，用“文件夹视图”编辑前端。

1. 打开 Visual Studio 的另一个窗口。
2. 选择：

   ```text
   文件 → 打开 → 文件夹
   ```

3. 选择：

   ```text
   D:\Project\C#\BS\font
   ```

4. 如果文件夹是空的，先在文件资源管理器中创建 `D:\Project\C#\BS\font`，再从 Visual Studio 打开。
5. 在文件夹视图中创建下面三个文件：

   ```text
   font\
   ├─ index.html
   ├─ css\
   │  └─ site.css
   └─ js\
      └─ app.js
   ```

### 6.2 为什么不在后端解决方案里“生成”前端

前端是独立的静态项目：

- 后端用 `dotnet build/publish`。
- 前端没有编译步骤，直接复制文件。
- 两边可以分别修改、分别发布。
- Nginx 可以直接读取 `font` 目录，不经过 ASP.NET Core。

如果以后前端改为 Vue、React 或 Vite，也仍然保持 `font` 目录独立，只需要在发布前生成它的 `dist` 目录。

### 6.3 创建 `font/index.html`

在 Visual Studio 文件夹视图中右键 `font`：

```text
添加 → 新建文件
```

创建 `index.html`，内容：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>车间测试系统</title>
    <link rel="stylesheet" href="/css/site.css">
    <script src="/js/app.js" defer></script>
</head>
<body>
    <main class="page">
        <h1>前后端分离测试</h1>
        <p class="hint">
            页面由 Nginx 从 font 目录返回，接口由 core 项目处理。
        </p>

        <section class="card">
            <h2>GET 接口测试</h2>
            <button id="pingButton" type="button">检查后端</button>
            <pre id="pingResult">尚未测试</pre>
        </section>

        <section class="card">
            <h2>POST 接口测试</h2>
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

### 6.4 创建 `font/js/app.js`

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

这里使用的都是相对路径：

```text
/api/ping
/api/echo
```

因此浏览器访问 `http://电脑A的IP:8080` 时，请求会自动发到同一个入口，再由 Nginx 转发给后端。

### 6.5 创建 `font/css/site.css`

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

### 6.6 前端不能直接双击 `index.html` 测试 API

直接双击 HTML 后，浏览器地址是：

```text
file:///D:/Project/C#/BS/font/index.html
```

此时 `/api/ping` 没有真正的 Web 服务器处理，请求会失败。

正确方式是通过 Nginx 或其他 HTTP 服务器访问：

```text
http://127.0.0.1:8080/
```

---

## 7. 在开发机 B 上配置 Nginx

这一阶段的目的，是在电脑 B 上完整模拟电脑 A 的部署结构。

### 7.1 创建开发环境 Nginx 配置

在项目中创建：

```text
D:\Project\C#\BS\deploy\nginx\workshop-test.dev.conf
```

内容：

```nginx
server {
    listen 8080;
    server_name _;

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

关键点：

- `root` 指向独立的 `font` 目录。
- `location /api/` 转发后端。
- `proxy_pass` 末尾没有 `/`，这样 `/api/ping` 会原样转发为 `/api/ping`。
- `location /` 只负责静态页面。
- 前端和后端通过同一个 8080 入口，不需要配置 CORS。

路径中包含 `#`，所以 Nginx 的 `root` 路径使用了双引号 `"..."`，避免 `#` 被当成注释。

### 7.2 复制到本机 Nginx

把：

```text
D:\Project\C#\BS\deploy\nginx\workshop-test.dev.conf
```

复制到：

```text
C:\nginx\conf\workshop-test.dev.conf
```

### 7.3 修改 Nginx 主配置

打开：

```text
C:\nginx\conf\nginx.conf
```

找到：

```nginx
http {
```

在 `http { ... }` 块内部添加绝对路径：

```nginx
include C:/nginx/conf/workshop-test.dev.conf;
```

不要把它写到另一个 `server { }` 里面。

### 7.4 检查 Nginx 配置

```powershell
cd "C:\nginx"
.\nginx.exe -t
```

通过时应看到：

```text
syntax is ok
test is successful
```

### 7.5 启动 Nginx

```powershell
cd "C:\nginx"
.\nginx.exe
```

如果 Nginx 已经在运行，修改配置后执行：

```powershell
cd "C:\nginx"
.\nginx.exe -s reload
```

停止：

```powershell
cd "C:\nginx"
.\nginx.exe -s quit
```

检查 8080：

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen
```

### 7.6 开发机上的完整测试顺序

先启动后端：

```powershell
dotnet run `
  --project "D:\Project\C#\BS\core\WorkshopTest.Core.csproj" `
  --urls "http://127.0.0.1:5000"
```

再启动 Nginx，然后测试：

| 测试位置 | 地址 | 预期 |
| --- | --- | --- |
| 后端直连 | `http://127.0.0.1:5000/api/ping` | 返回 JSON |
| Nginx 前端 | `http://127.0.0.1:8080/` | 显示 `font/index.html` |
| Nginx 转发接口 | `http://127.0.0.1:8080/api/ping` | 返回 JSON |
| 页面按钮 | `http://127.0.0.1:8080/` | GET 和 POST 都成功 |

PowerShell 测试：

```powershell
Invoke-RestMethod "http://127.0.0.1:8080/api/ping" |
  ConvertTo-Json -Depth 5
```

POST 测试：

```powershell
$body = @{ message = "领料单测试" } | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8080/api/echo" `
  -Method Post `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
```

---

## 8. 分别发布两个项目

两个项目分别发布。不要试图把 `font` 塞进 `core` 的 `wwwroot`。

### 8.1 发布后端

命令行：

```powershell
dotnet publish `
  ".\core\WorkshopTest.Core.csproj" `
  -c Release `
  -o "D:\Deploy\WorkshopTest\core" `
  --no-self-contained
```

Visual Studio：

1. 在解决方案资源管理器中右键后端项目。
2. 选择 **发布**。
3. 目标选择 **文件夹**。
4. 选择 `D:\Deploy\WorkshopTest\core`。
5. 配置选择 `Release`。
6. 点击 **发布**。

发布目录中应看到：

```text
WorkshopTest.Core.dll
WorkshopTest.Core.exe
appsettings.json
其他依赖文件
```

### 8.2 发布前端

静态前端没有 `dotnet publish`。复制整个 `font` 目录：

```powershell
Copy-Item `
  -LiteralPath "D:\Project\C#\BS\font" `
  -Destination "D:\Deploy\WorkshopTest\font" `
  -Recurse
```

目标目录应包含：

```text
D:\Deploy\WorkshopTest\font\
├─ index.html
├─ css\
│  └─ site.css
└─ js\
   └─ app.js
```

如果是从电脑 B 发布到电脑 A，可以把整个 `D:\Deploy\WorkshopTest` 复制到电脑 A，例如：

```text
C:\WorkshopApp\
├─ core\
└─ font\
```

前端文件不会进入后端 DLL，也不会由 ASP.NET Core 返回。

---

## 9. 在电脑 A 上部署

### 9.1 目录规划

电脑 A 使用：

```text
C:\WorkshopApp\
├─ core\
│  ├─ WorkshopTest.Core.dll
│  ├─ WorkshopTest.Core.exe
│  └─ appsettings.json
└─ font\
   ├─ index.html
   ├─ css\
   └─ js\
```

### 9.2 启动后端

```powershell
cd "C:\WorkshopApp\core"
dotnet ".\WorkshopTest.Core.dll" --urls "http://127.0.0.1:5000"
```

如果是自带运行时发布包：

```powershell
cd "C:\WorkshopApp\core"
.\WorkshopTest.Core.exe --urls "http://127.0.0.1:5000"
```

后端只监听：

```text
http://127.0.0.1:5000
```

验证：

```powershell
Invoke-RestMethod "http://127.0.0.1:5000/api/ping" |
  ConvertTo-Json -Depth 5
```

当前测试阶段，启动后端的 PowerShell 窗口不要关闭。

### 9.3 电脑 A 的 Nginx 配置

创建：

```text
C:\nginx\conf\workshop-test.prod.conf
```

内容：

```nginx
server {
    listen 8080;
    server_name _;

    root "C:/WorkshopApp/font";
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

在主配置 `C:\nginx\conf\nginx.conf` 的 `http { ... }` 内添加：

```nginx
include C:/nginx/conf/workshop-test.prod.conf;
```

如果电脑 A 同时保留了开发配置，注意两个 `server` 不能同时监听同一个端口。生产配置和开发配置二选一，或者在开发机上使用开发配置，在服务器上使用生产配置。

检查：

```powershell
cd "C:\nginx"
.\nginx.exe -t
```

启动或重载：

```powershell
cd "C:\nginx"
.\nginx.exe
```

如果已经启动：

```powershell
cd "C:\nginx"
.\nginx.exe -s reload
```

### 9.4 电脑 A 的防火墙

以管理员身份打开 PowerShell，只开放 Nginx 的 8080：

```powershell
New-NetFirewallRule `
  -DisplayName "WorkshopTest HTTP 8080" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 8080 `
  -Action Allow `
  -Profile Private
```

不要开放 5000：

```text
5000 = 后端内部端口
8080 = 对外入口
```

查看端口监听：

```powershell
Get-NetTCPConnection -LocalPort 5000,8080 -State Listen
```

预期：

```text
LocalAddress   LocalPort
127.0.0.1      5000
0.0.0.0        8080
```

如果 5000 显示为 `0.0.0.0`，说明启动地址写成了所有网卡。当前同机部署应使用：

```powershell
dotnet ".\WorkshopTest.Core.dll" --urls "http://127.0.0.1:5000"
```

---

## 10. 从内到外验收

必须按顺序测试。

### 第 1 步：后端自身

在电脑 A：

```powershell
Invoke-RestMethod "http://127.0.0.1:5000/api/ping" |
  ConvertTo-Json -Depth 5
```

成功标志：返回 `status: ok`。

失败时检查：

- 后端进程是否还在。
- 当前目录是否是发布目录。
- `WorkshopTest.Core.dll` 是否存在。
- 5000 是否被其他程序占用。

### 第 2 步：Nginx 本机静态页面

在电脑 A：

```text
http://127.0.0.1:8080/
```

应看到 `font/index.html` 页面，而不是 Nginx 默认欢迎页。

如果看到 Nginx 欢迎页：

- `root` 没指向 `font`。
- 自定义配置没有被 include。
- 修改配置后没有执行 `nginx -s reload`。
- 另一个 `server` 占用了 8080。

### 第 3 步：Nginx 本机转发接口

```powershell
Invoke-RestMethod "http://127.0.0.1:8080/api/ping" |
  ConvertTo-Json -Depth 5
```

如果返回后端 JSON，说明：

```text
Nginx → 127.0.0.1:5000 → core
```

正常。

如果返回 502：

- 后端没启动。
- 后端没监听 5000。
- `proxy_pass` 地址错误。

### 第 4 步：电脑 A 内网 IP

查看电脑 A IP：

```powershell
ipconfig
```

假设是 `192.168.3.10`：

```text
http://192.168.3.10:8080/
http://192.168.3.10:8080/api/ping
```

如果本机 `127.0.0.1:8080` 正常，但内网 IP 不正常：

- Windows 防火墙没有放行 8080。
- Nginx 配置成了 `listen 127.0.0.1:8080`。
- 网络位置或网卡配置有问题。

### 第 5 步：电脑 B 网络可达

在电脑 B：

```powershell
Test-NetConnection 电脑A的IP -Port 8080
```

必须看到：

```text
TcpTestSucceeded : True
```

### 第 6 步：电脑 B 浏览器验收

在电脑 B 打开：

```text
http://电脑A的IP:8080/
```

检查：

- 页面正常显示。
- 点击“检查后端”后显示 JSON。
- 输入文字后点击“发送”能收到后端回复。
- 按 `F12` 打开开发者工具，Network 中 `/api/ping` 和 `/api/echo` 状态码均为 `200`。

这一步通过，才说明两台电脑、Nginx、前端和 core 后端全部贯通。

---

## 11. Visual Studio 日常开发操作

### 11.1 启动后端

1. 打开 `D:\Project\C#\BS\core\core.sln`。
2. 在解决方案资源管理器中选择后端项目。
3. 顶部启动配置选择 `http`。
4. 按 `F5`。
5. 后端监听 `http://127.0.0.1:5000`。

### 11.2 修改前端

1. 在另一个 Visual Studio 窗口选择“打开文件夹”。
2. 选择 `D:\Project\C#\BS\font`。
3. 修改 HTML、CSS 或 JavaScript。
4. 保存文件。
5. 在浏览器按 `Ctrl+F5` 强制刷新。

静态文件不需要 `dotnet build`，也不需要重新发布后端。

### 11.3 修改后端

1. 修改 `core` 里的 `.cs` 文件。
2. 按 `Ctrl+Shift+B` 编译。
3. 停止旧后端进程。
4. 按 `F5` 重新启动。
5. 再通过 `http://127.0.0.1:8080/api/...` 测试。

### 11.4 修改 Nginx 配置

修改配置后：

```powershell
cd "C:\nginx"
.\nginx.exe -t
.\nginx.exe -s reload
```

必须先测试语法，再重载。不要直接修改线上配置而不做检查。

### 11.5 常用快捷键

| 操作 | 快捷键 |
| --- | --- |
| 生成解决方案 | `Ctrl+Shift+B` |
| 开始调试 | `F5` |
| 不调试启动 | `Ctrl+F5` |
| 停止调试 | `Shift+F5` |
| 打开终端 | `Ctrl+`` |
| 快速查找文件 | `Ctrl+,` |
| 浏览器强制刷新 | `Ctrl+F5` |

---

## 12. 以后把后端拆到第二台服务器

当前最简单架构是：

```text
电脑 A：Nginx + core
电脑 B：开发机/客户端
```

以后也可以把 `core` 搬到电脑 B，让电脑 A 只做 Nginx：

```text
客户端
  │ 8080
  ▼
电脑 A：Nginx + font
  │ 5000
  ▼
电脑 B：core
```

需要修改：

1. 电脑 B 启动后端：

   ```powershell
   dotnet ".\WorkshopTest.Core.dll" --urls "http://0.0.0.0:5000"
   ```

2. 电脑 B 防火墙只允许电脑 A 的 IP 访问 5000：

   ```powershell
   New-NetFirewallRule `
     -DisplayName "WorkshopTest Backend 5000" `
     -Direction Inbound `
     -Protocol TCP `
     -LocalPort 5000 `
     -RemoteAddress 电脑A的IP `
     -Action Allow `
     -Profile Private
   ```

3. 电脑 A 的 Nginx `proxy_pass` 改为：

   ```nginx
   proxy_pass http://电脑B的IP:5000;
   ```

4. `font` 仍放在电脑 A，由 Nginx 直接返回。这样前端静态文件和入口仍在同一台机器。

5. 电脑 A 不再需要启动 `core`，但仍然不能关闭 Nginx。

---

## 13. 常见问题

### 13.1 `core` 里面出现 `wwwroot`

说明把前端和 ASP.NET Core 混在一起了。

处理：

1. 确认前端文件位于 `D:\Project\C#\BS\font`。
2. 后端 `Program.cs` 不要调用 `UseDefaultFiles`。
3. 后端 `Program.cs` 不要调用 `UseStaticFiles`。
4. 不需要为了前端修改 `.csproj`。

### 13.2 浏览器访问 8080 显示 Nginx 默认页

检查：

```powershell
Get-Content "C:\nginx\conf\nginx.conf"
Get-Content "C:\nginx\conf\workshop-test.prod.conf"
```

确认：

- `include` 写在 `http` 内部。
- `root "C:/WorkshopApp/font"` 指向正确目录。
- 已执行 `nginx -t` 和 `nginx -s reload`。

### 13.3 页面能打开，但 `/api/ping` 返回 502

检查：

```powershell
Invoke-RestMethod "http://127.0.0.1:5000/api/ping"
Get-NetTCPConnection -LocalPort 5000 -State Listen
```

后端本身没启动时，Nginx 无法完成转发。

### 13.4 页面能打开，但接口 404

检查：

1. `Program.cs` 中的路由是否是 `/api/ping`。
2. JavaScript 是否使用 `/api/ping`，不要写成 `/api/ping/` 之外的其他路径。
3. 后端是否已经重新编译并启动。
4. Nginx 是否转发的是 `/api/`，而不是错误地改写成别的路径。

### 13.5 接口跨域/CORS 问题

当前设计通过同一个 8080 入口访问：

```text
前端：http://电脑A的IP:8080/
接口：http://电脑A的IP:8080/api/ping
```

同源访问，不需要 CORS。

不要直接把前端改成：

```javascript
fetch("http://电脑A的IP:5000/api/ping")
```

如果以后使用独立开发服务器，例如 `npm run dev` 监听 5173，再考虑：

- 使用开发服务器代理 `/api` 到 5000。
- 或明确配置 ASP.NET Core CORS。

当前最小方案不需要配置 CORS。

### 13.6 5000 或 8080 被占用

```powershell
Get-NetTCPConnection -LocalPort 5000,8080 -State Listen
```

根据 `OwningProcess` 查看进程：

```powershell
Get-Process -Id 进程编号
```

确认进程身份后再停止，不要随意结束系统中不认识的进程。

### 13.7 本机正常，电脑 B 访问不了

在电脑 A：

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen
Get-NetFirewallRule -DisplayName "WorkshopTest HTTP 8080"
```

在电脑 B：

```powershell
Test-NetConnection 电脑A的IP -Port 8080
```

依次排除：

1. 电脑 B 是否和电脑 A 网络可达。
2. 电脑 A 的 IP 是否填写正确。
3. 8080 防火墙是否放行。
4. Nginx 是否监听 `0.0.0.0:8080`，而不是只监听 `127.0.0.1:8080`。
5. 车间网络是否隔离或需要路由。

### 13.8 修改前端后浏览器还是旧页面

1. 在浏览器按 `Ctrl+F5`。
2. 打开 `F12` → Network，勾选 Disable cache。
3. 确认 Nginx `root` 指向的是最新 `font` 目录。
4. 如果改的是另一份发布目录，修改不会自动同步到服务器。

---

## 14. 最终检查清单

### 目录

- [ ] `D:\Project\C#\BS\core\core.sln` 存在。
- [ ] 解决方案只管理后端，不管理 `font`。
- [ ] `core` 是独立 ASP.NET Core 后端的根目录。
- [ ] `font` 是独立前端目录。
- [ ] `core` 中没有 `wwwroot`。
- [ ] `font/index.html` 存在。

### 后端

- [ ] `core` 能编译。
- [ ] 后端监听 `127.0.0.1:5000`。
- [ ] `http://127.0.0.1:5000/api/ping` 返回 JSON。
- [ ] `/api/echo` POST 请求成功。

### 前端

- [ ] `font/index.html` 能通过 HTTP 访问。
- [ ] CSS 和 JS 路径返回 200。
- [ ] 前端使用相对路径 `/api/...`。
- [ ] 通过 8080 访问时，不需要 CORS。

### Nginx

- [ ] `nginx -t` 通过。
- [ ] 8080 正常监听。
- [ ] `/` 返回 `font/index.html`。
- [ ] `/api/ping` 转发到 `127.0.0.1:5000`。

### 两台电脑

- [ ] 电脑 B 能访问电脑 A 的 8080。
- [ ] 电脑 B 能打开前端页面。
- [ ] 电脑 B 能通过页面调用后端接口。
- [ ] 电脑 A 只对局域网开放 8080，不直接开放 5000。

全部通过后，再开始添加数据库、登录、业务接口和正式后台服务。
