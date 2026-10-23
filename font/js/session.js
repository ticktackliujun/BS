const SESSION_KEY = "bs_current_user_v2";

export function getCurrentUser() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);

        if (!raw) {
            return null;
        }

        const user = JSON.parse(raw);

        if (
            typeof user?.username !== "string" ||
            typeof user?.role !== "string" ||
            typeof user?.roleLabel !== "string"
        ) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        return user;
    } catch {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

export function saveCurrentUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
    localStorage.removeItem(SESSION_KEY);
}
