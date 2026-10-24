export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export async function requestJson(url, options = {}) {
    const {
        signal,
        headers: optionHeaders,
        ...requestOptions
    } = options;
    const fetchOptions = {
        credentials: "same-origin",
        ...requestOptions,
        headers: {
            Accept: "application/json",
            ...optionHeaders
        }
    };

    if (
        typeof globalThis.AbortSignal === "function" &&
        signal instanceof globalThis.AbortSignal
    ) {
        fetchOptions.signal = signal;
    }

    const response = await fetch(url, fetchOptions);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validationMessage = data.errors
            ? Object.values(data.errors).flat()[0]
            : null;

        throw new ApiError(
            validationMessage ||
                data.detail ||
                data.title ||
                `请求失败：HTTP ${response.status}`,
            response.status
        );
    }

    return data;
}
