import { requestJson } from "../../js/api.js?v=20261024-4";
import {
    userPath,
    usersPagePath,
    usersPath
} from "./usersApi.js?v=20261024-4";

export function getUsers(page, pageSize, signal) {
    return requestJson(
        usersPagePath(page, pageSize),
        { signal }
    );
}

export function createUser(user, signal) {
    return requestJson(usersPath, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user),
        signal
    });
}

export function updateUser(id, user, signal) {
    return requestJson(userPath(id), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user),
        signal
    });
}
