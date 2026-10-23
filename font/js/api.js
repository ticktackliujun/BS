export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: "application/json",
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validationMessage = data.errors
            ? Object.values(data.errors).flat()[0]
            : null;

        throw new ApiError(
            validationMessage || data.title || `请求失败：HTTP ${response.status}`,
            response.status
        );
    }

    return data;
}
