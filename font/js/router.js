import { defaultModuleName, modules } from "./modules.js";

const loadedStyles = new Map();
let currentCleanup = null;
let navigationId = 0;

function getRouteName() {
    return location.hash.slice(1).trim() || defaultModuleName;
}

function setActiveNavigation(routeName) {
    document.querySelectorAll(".app-nav-link").forEach((link) => {
        const isActive = link.getAttribute("href") === `#${routeName}`;

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function loadStyle(href) {
    if (loadedStyles.has(href)) {
        return loadedStyles.get(href);
    }

    const promise = new Promise((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.moduleStyle = href;
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener(
            "error",
            () => reject(new Error(`模块样式加载失败：${href}`)),
            { once: true }
        );
        document.head.append(link);
    });

    loadedStyles.set(href, promise);
    return promise;
}

async function loadHtml(htmlPath) {
    const response = await fetch(htmlPath, {
        headers: {
            Accept: "text/html"
        }
    });

    if (!response.ok) {
        throw new Error(`模块页面加载失败：HTTP ${response.status}`);
    }

    return response.text();
}

function showLoadError(container, message) {
    container.replaceChildren();

    const error = document.createElement("p");
    error.className = "module-error";
    error.textContent = message;
    container.append(error);
}

export async function startRouter(container) {
    if (!(container instanceof HTMLElement)) {
        throw new Error("找不到 #app-content 容器。");
    }

    const loadCurrentRoute = async () => {
        const requestedNavigation = ++navigationId;
        const routeName = getRouteName();
        const currentModule = modules[routeName];

        if (!currentModule) {
            history.replaceState(null, "", `#${defaultModuleName}`);
            await loadCurrentRoute();
            return;
        }

        setActiveNavigation(routeName);
        document.title = `${currentModule.title} - 车间管理`;
        container.replaceChildren();

        const loading = document.createElement("p");
        loading.className = "module-loading";
        loading.textContent = "正在加载模块...";
        container.append(loading);

        try {
            const [html] = await Promise.all([
                loadHtml(currentModule.html),
                loadStyle(currentModule.style)
            ]);

            if (requestedNavigation !== navigationId) {
                return;
            }

            currentCleanup?.();
            currentCleanup = null;
            container.innerHTML = html;

            const moduleEntry = await import(currentModule.script);

            if (requestedNavigation !== navigationId) {
                return;
            }

            if (typeof moduleEntry.mount !== "function") {
                throw new Error(`模块入口没有导出 mount()：${currentModule.script}`);
            }

            currentCleanup = await moduleEntry.mount(container);
        } catch (error) {
            if (requestedNavigation === navigationId) {
                currentCleanup?.();
                currentCleanup = null;
                showLoadError(container, `模块加载失败：${error.message}`);
            }
        }
    };

    if (!location.hash) {
        history.replaceState(null, "", `#${defaultModuleName}`);
    }

    window.addEventListener("hashchange", loadCurrentRoute);
    await loadCurrentRoute();
}
