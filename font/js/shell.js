import { startRouter } from "./router.js";
import { loadHtml } from "./utils/loader.js";

export async function mountShell(root, user, onLogout) {
    root.innerHTML = await loadHtml("/shell.html");

    const content = root.querySelector("#app-content");
    const userName = root.querySelector("#currentUserName");
    const roleLabel = root.querySelector("#currentUserRole");
    const logoutButton = root.querySelector("#logoutButton");

    if (!(content instanceof HTMLElement)) {
        throw new Error("侧边栏页面缺少 #app-content。");
    }

    userName.textContent = `${user.displayName}（${user.username}）`;
    roleLabel.textContent = user.roleLabel;

    const disposeRouter = await startRouter(content);
    const handleLogout = () => {
        void onLogout();
    };

    logoutButton.addEventListener("click", handleLogout);

    return () => {
        logoutButton.removeEventListener("click", handleLogout);
        disposeRouter();
    };
}
