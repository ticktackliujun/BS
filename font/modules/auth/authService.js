import { requestJson } from "../../js/api.js?v=20261024-4";
import {
    loginPath,
    logoutPath
} from "./authApi.js?v=20261024-4";

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

export function logout(signal) {
    return requestJson(logoutPath, {
        method: "POST",
        signal
    });
}
