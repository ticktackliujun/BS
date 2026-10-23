# 零部件管理系统 — 前端架构与业务说明

> 本文只描述前端界面、交互流程、模块结构和技术实现。
>
> 后端接口和数据库设计见 [BACKEND-ARCHITECTURE.md](BACKEND-ARCHITECTURE.md)。

## 1. 当前范围

当前前端已经实现：

- 登录页面。
- 项目管理员角色识别。
- 登录状态保存与退出。
- 登录后的白色侧边栏。
- 侧边栏唯一业务入口“零部件管理”。
- 零部件数量读取和保存页面。
- 按业务模块动态加载 HTML、CSS、JavaScript。
- 桌面端和窄屏基础响应式布局。

当前前端没有实现：

- 用户和角色管理页面。
- 零部件新增、编辑和删除。
- 库存流水。
- 领料申请。
- 多模块复杂业务流程。
- 前端权限菜单控制。

## 2. 技术结构

| 项目 | 当前实现 |
| --- | --- |
| HTML | 原生 HTML |
| CSS | 原生 CSS + CSS 变量 |
| JavaScript | 原生 ES Modules |
| 前端框架 | 无 |
| 构建工具 | 无，Nginx 直接提供静态文件 |
| 页面切换 | 自定义 Hash Router |
| 登录状态 | `localStorage` |
| HTTP | 原生 `fetch` |

这种结构适合当前小型系统。模块数量明显增加、表格和表单复杂后，可以迁移到 Vue 3 + Vite，同时保留现有模块边界。

## 3. 页面整体布局

登录前：

```text
┌─────────────────────────────────────────────┐
│ 左侧深色品牌区       │ 右侧登录区域          │
│                     │                       │
│ 零部件数字化管理系统 │ 账号                  │
│ 系统说明             │ 密码                  │
│                     │ 项目管理员            │
│                     │ [进入系统]            │
└─────────────────────────────────────────────┘
```

登录后：

```text
┌──────────────┬──────────────────────────────────────┐
│              │ 顶部栏：零部件管理 角色 用户 [退出]  │
│ 零部件管理系统├──────────────────────────────────────┤
│              │                                      │
│ ◇ 零部件管理 │ #app-content                         │
│              │                                      │
│              │ 当前显示：零部件数量页面              │
└──────────────┴──────────────────────────────────────┘
```

布局特点：

- 左侧固定宽度约 `228px`。
- 顶部栏高度约 `64px`。
- 主体背景为浅灰蓝 `#f4f7fb`。
- 侧边栏、顶部栏和内容卡片使用白色背景。
- 边框颜色 `#e5eaf3`。
- 主色 `#2563eb`，辅助色 `#10b981`。
- 卡片圆角较小，信息密度偏工业管理端。
- 窄屏时侧边栏变为顶部区域，不保留桌面双栏。

## 4. 登录页面

### 4.1 页面位置

登录页面的静态片段：

```text
font/modules/auth/index.html
```

样式：

```text
font/css/modules/auth/index.css
```

交互：

```text
font/modules/auth/auth.js
```

### 4.2 输入内容

登录页面包含：

- 账号输入框。
- 密码输入框。
- 登录后角色预览：项目管理员。
- 登录按钮。
- 成功或失败状态提示。

### 4.3 登录流程

```text
打开前端
  ↓
app.js 检查 localStorage
  ↓
没有登录状态
  ↓
加载 auth 模块 HTML、CSS、JS
  ↓
用户输入账号和密码
  ↓
POST /api/Auth/login
  ↓
成功：保存 user，加载主壳
失败：显示后端错误，保留登录页
```

登录接口请求：

```http
POST /api/Auth/login
Content-Type: application/json
```

请求体：

```json
{
  "username": "admin",
  "password": "123456"
}
```

成功响应：

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

- `400`：账号或密码为空。
- `401`：账号或密码错误。
- `500`：后端或数据库异常。

### 4.4 登录状态

当前用户保存到：

```text
localStorage["bs_current_user_v2"]
```

保存字段：

```text
username
displayName
role
roleLabel
```

刷新页面时会读取该值，并直接恢复主界面。点击“退出登录”会删除该值并回到登录页。

注意：当前没有服务端 Token、Session 或 JWT。`localStorage` 只用于控制前端显示，不能作为正式安全凭证。

## 5. 应用启动流程

入口文件：

```text
font/index.html
```

入口只提供：

```html
<div id="app"></div>
```

启动逻辑位于：

```text
font/js/app.js
```

流程：

```text
读取 session
  ├─ 已登录 → 加载 shell.html → 启动模块 Router
  └─ 未登录 → 加载 auth 模块
```

页面视图切换时会调用上一个视图的清理函数，避免重复监听事件。

## 6. 登录后的应用壳

结构文件：

```text
font/shell.html
```

启动逻辑：

```text
font/js/shell.js
```

应用壳包含：

```text
品牌区
左侧导航
顶部栏
当前用户
当前角色
退出按钮
#app-content 模块容器
```

侧边栏当前只有一个入口：

```text
#warehouse → 零部件管理
```

顶部角色来自后端登录结果，不在前端写死业务判断。

## 7. 模块路由

### 7.1 模块清单

文件：

```text
font/js/modules.js
```

当前配置：

```javascript
{
  warehouse: {
    title: "零部件管理",
    html: "/modules/warehouse/index.html",
    script: "/modules/warehouse/warehouse.js",
    style: "/css/modules/warehouse/index.css"
  }
}
```

默认模块：

```text
warehouse
```

### 7.2 路由执行

文件：

```text
font/js/router.js
```

流程：

```text
地址变为 #warehouse
  ↓
查找 modules.warehouse
  ↓
加载模块 HTML
  ↓
加载模块 CSS，已加载则复用
  ↓
插入 #app-content
  ↓
动态 import warehouse.js
  ↓
调用 mount(container)
```

每个模块入口导出一个 `mount()`：

```javascript
export async function mount(container) {
  // 绑定页面

  return () => {
    // 清理事件和请求
  };
}
```

离开模块时会调用返回的清理函数。

### 7.3 登录页与业务路由的关系

登录页不在 `modules.js` 中。它是应用身份门禁，只有登录成功后才启动业务 Router。

```text
未登录：#warehouse 也不会进入业务
已登录：Router 才加载 #warehouse
```

## 8. 公共脚本

### 8.1 `api.js`

公共 HTTP 封装：

- 设置 `Accept: application/json`。
- 解析 JSON。
- 将非成功响应转换为 `ApiError`。
- 优先读取 ProblemDetails 的验证错误。

### 8.2 `utils/loader.js`

负责：

- 加载 HTML 片段。
- 动态加载 CSS。
- 缓存已经加载的 CSS。

### 8.3 `utils/helper.js`

负责：

- `showStatus(element, message, type)`：更新页面提示。
- `setBusy(button, boolean)`：保存期间禁用按钮。

### 8.4 `session.js`

负责：

- 读取当前用户。
- 保存当前用户。
- 清理当前用户。

旧版本会话键已升级，因此旧的 `123 / 123` 测试登录状态会自动失效。

## 9. 零部件管理模块

### 9.1 目录

```text
font/modules/warehouse/
├─ index.html
├─ warehouseApi.js
├─ warehouseService.js
└─ warehouse.js
```

样式：

```text
font/css/modules/warehouse/index.css
```

### 9.2 页面内容

- 标题：零件数量。
- 数量输入框。
- 保存按钮。
- 上次保存数量。
- 读取、保存、成功和失败提示。

### 9.3 文件职责

| 文件 | 职责 |
| --- | --- |
| `index.html` | 零部件页面的 HTML 片段 |
| `warehouseApi.js` | `/api/PartQuantity` 接口地址 |
| `warehouseService.js` | GET 和 PUT 请求 |
| `warehouse.js` | 表单交互、状态提示、模块生命周期 |
| `index.css` | 零部件模块专属样式 |

### 9.4 读取数量

```text
打开模块
  ↓
GET /api/PartQuantity
  ↓
输入框显示后端数量
  ↓
显示“上次保存数量”
```

### 9.5 保存数量

```text
输入整数
  ↓
前端检查 0～1000000
  ↓
PUT /api/PartQuantity
  ↓
使用后端返回数量更新页面
```

前端不允许负数或非整数，但正式校验仍以后端为准。

## 10. 当前文件树

```text
font/
├─ index.html
├─ shell.html
├─ css/
│  ├─ base.css
│  ├─ layout.css
│  └─ modules/
│     ├─ auth/
│     │  └─ index.css
│     └─ warehouse/
│        └─ index.css
├─ js/
│  ├─ api.js
│  ├─ app.js
│  ├─ modules.js
│  ├─ router.js
│  ├─ session.js
│  ├─ shell.js
│  └─ utils/
│     ├─ helper.js
│     └─ loader.js
└─ modules/
   ├─ auth/
   │  ├─ index.html
   │  ├─ auth.js
   │  ├─ authApi.js
   │  └─ authService.js
   └─ warehouse/
      ├─ index.html
      ├─ warehouse.js
      ├─ warehouseApi.js
      └─ warehouseService.js
```

## 11. 样式分层

```text
base.css
  全局字体、颜色变量、按钮、状态提示

layout.css
  侧边栏、顶部栏、内容区、响应式骨架

css/modules/auth/index.css
  登录页专属样式

css/modules/warehouse/index.css
  零部件页面专属样式
```

规则：

- 公共变量只放 `base.css`。
- 主框架布局只放 `layout.css`。
- 模块 CSS 使用模块前缀，例如 `.warehouse-card`。
- 模块 CSS 不覆盖其他模块的内部类名。

## 12. 部署方式

前端目录：

```text
D:\Project\C#\BS\font
```

Nginx 配置：

```text
D:\Project\C#\BS\deploy\nginx\inventory.conf
```

访问入口：

```text
http://127.0.0.1:8080/
```

Nginx 负责：

- 返回 `font` 中的静态文件。
- 将 `/api/` 转发到 ASP.NET Core 的 `127.0.0.1:5000`。

## 13. 增加新模块

以“领料管理”为例：

1. 创建模块目录：

   ```text
   font/modules/material/
   ```

2. 创建 HTML、入口 JS、API 和 Service。
3. 创建模块样式：

   ```text
   font/css/modules/material/index.css
   ```

4. 在 `font/js/modules.js` 登记。
5. 在 `shell.html` 侧边栏增加导航。
6. 模块入口实现 `mount()` 并返回清理函数。

模块之间不直接引用内部文件，共用代码才移到 `js/utils` 或未来的公共组件目录。

## 14. 后续规划

建议按以下顺序扩展：

1. 零部件列表和新增、编辑。
2. 库存流水。
3. 领料申请。
4. 用户和角色管理。
5. 前端权限路由和菜单控制。
6. 请求鉴权 Token。
7. 复杂表格出现后再评估 Vue 3 + Vite。
