import { startRouter } from "./router.js?v=20261024-4";
import { loadHtml } from "./utils/loader.js?v=20261024-4";
import { logout } from "../modules/auth/authService.js?v=20261024-4";

export async function mountShell(root, user, onLogout) {
    root.innerHTML = await loadHtml("/shell.html");

    const content = root.querySelector("#app-content");
    const userName = root.querySelector("#currentUserName");
    const roleLabel = root.querySelector("#currentUserRole");
    const logoutButton = root.querySelector("#logoutButton");
    const adminOnlyNavigation =
        root.querySelector("[data-admin-only]");

    if (!(content instanceof HTMLElement)) {
        throw new Error("侧边栏页面缺少 #app-content。");
    }

    userName.textContent = `${user.displayName}（${user.username}）`;
    roleLabel.textContent = user.roleLabel;
    adminOnlyNavigation.hidden = user.role !== "admin";

    const disposeRouter = await startRouter(content, user);
    const handleLogout = async () => {
        logoutButton.disabled = true;

        try {
            await logout();
        } catch {
            // The local session must still be cleared if the API is offline.
        } finally {
            await onLogout();
        }
    };

    logoutButton.addEventListener("click", () => {
        void handleLogout();
    });

    return () => {
        logoutButton.removeEventListener("click", handleLogout);
        disposeRouter();
    };
}
