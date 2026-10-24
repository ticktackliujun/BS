import {
    defaultModuleName,
    modules
} from "./modules.js?v=20261024-4";
import {
    loadHtml,
    loadStyle
} from "./utils/loader.js?v=20261024-4";

let currentCleanup = null;
let navigationId = 0;

function getRouteName() {
    return location.hash.slice(1).trim() || defaultModuleName;
}

function withVersion(path, version) {
    if (!version) {
        return path;
    }

    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}v=${encodeURIComponent(version)}`;
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

function showLoadError(container, message) {
    container.replaceChildren();

    const error = document.createElement("p");
    error.className = "module-error";
    error.textContent = message;
    container.append(error);
}

export async function startRouter(container, user) {
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

        if (currentModule.adminOnly && user.role !== "admin") {
            history.replaceState(null, "", `#${defaultModuleName}`);
            await loadCurrentRoute();
            return;
        }

        setActiveNavigation(routeName);
        document.title = `${currentModule.title} - 零部件管理系统`;
        document.querySelector("#currentPageTitle").textContent =
            currentModule.title;
        container.replaceChildren();

        const loading = document.createElement("p");
        loading.className = "module-loading";
        loading.textContent = "正在加载模块...";
        container.append(loading);

        try {
            const htmlPath = withVersion(
                currentModule.html,
                currentModule.version
            );
            const stylePath = withVersion(
                currentModule.style,
                currentModule.version
            );
            const scriptPath = withVersion(
                currentModule.script,
                currentModule.version
            );

            const [html] = await Promise.all([
                loadHtml(htmlPath),
                loadStyle(stylePath)
            ]);

            if (requestedNavigation !== navigationId) {
                return;
            }

            currentCleanup?.();
            currentCleanup = null;
            container.innerHTML = html;

            const moduleEntry = await import(scriptPath);

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

    const handleHashChange = () => {
        void loadCurrentRoute();
    };

    window.addEventListener("hashchange", handleHashChange);
    await loadCurrentRoute();

    return () => {
        window.removeEventListener("hashchange", handleHashChange);
        currentCleanup?.();
        currentCleanup = null;
    };
}
