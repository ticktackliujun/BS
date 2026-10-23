import { requestJson } from "../../js/api.js";
import { loginPath } from "./authApi.js";

export function login(username, password, signal) {
    return requestJson(loginPath, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password }),
        signal
    });
}
