import {
    setBusy,
    showStatus
} from "../../js/utils/helper.js?v=20261024-4";
import { login } from "./authService.js?v=20261024-4";

export async function mount(root, options) {
    const form = root.querySelector("#loginForm");
    const username = root.querySelector("#loginUsername");
    const password = root.querySelector("#loginPassword");
    const submitButton = root.querySelector("#loginButton");
    const status = root.querySelector("#loginStatus");
    const requestController = new AbortController();

    if (options.initialMessage) {
        showStatus(status, options.initialMessage, "success");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        setBusy(submitButton, true);
        showStatus(status, "正在登录...", "loading");

        let loggedIn = false;

        try {
            const data = await login(
                username.value.trim(),
                password.value,
                requestController.signal
            );

            showStatus(status, `登录成功，角色：${data.user.roleLabel}。`, "success");
            loggedIn = true;
            await options.onLogin(data.user);
        } catch (error) {
            if (!requestController.signal.aborted) {
                showStatus(status, `登录失败：${error.message}`, "error");
                password.select();
            }
        } finally {
            if (!loggedIn && !requestController.signal.aborted) {
                setBusy(submitButton, false);
            }
        }
    }

    form.addEventListener("submit", handleSubmit);
    username.focus();

    return () => {
        requestController.abort();
        form.removeEventListener("submit", handleSubmit);
    };
}
