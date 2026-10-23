import { mountShell } from "./shell.js";
import {
    clearCurrentUser,
    getCurrentUser,
    saveCurrentUser
} from "./session.js";
import { loadHtml, loadStyle } from "./utils/loader.js";

const root = document.querySelector("#app");
let disposeCurrentView = null;

function showFatalError(message) {
    root.replaceChildren();

    const error = document.createElement("p");
    error.className = "module-error";
    error.textContent = message;
    root.append(error);
}

async function showLogin(message = "") {
    disposeCurrentView?.();
    disposeCurrentView = null;
    root.replaceChildren();
    document.title = "登录 - 零部件管理系统";

    const [html] = await Promise.all([
        loadHtml("/modules/auth/index.html"),
        loadStyle("/css/modules/auth/index.css")
    ]);

    root.innerHTML = html;

    const authModule = await import("/modules/auth/auth.js");
    disposeCurrentView = await authModule.mount(root, {
        initialMessage: message,
        onLogin: async (user) => {
            saveCurrentUser(user);
            await showShell();
        }
    });
}

async function showShell() {
    const user = getCurrentUser();

    if (!user) {
        await showLogin();
        return;
    }

    disposeCurrentView?.();
    disposeCurrentView = null;
    root.replaceChildren();

    disposeCurrentView = await mountShell(root, user, async () => {
        clearCurrentUser();
        history.replaceState(null, "", location.pathname);
        await showLogin("已退出登录。");
    });
}

async function start() {
    if (!(root instanceof HTMLElement)) {
        throw new Error("找不到应用根节点 #app。");
    }

    if (getCurrentUser()) {
        await showShell();
    } else {
        await showLogin();
    }
}

start().catch((error) => {
    showFatalError(`应用启动失败：${error.message}`);
});
