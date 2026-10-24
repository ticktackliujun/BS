export const usersPath = "/api/Users";

export function usersPagePath(page, pageSize) {
    const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize)
    });

    return `${usersPath}?${query}`;
}

export function userPath(id) {
    return `${usersPath}/${id}`;
}
