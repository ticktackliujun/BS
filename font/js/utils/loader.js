const loadedStyles = new Map();

export function loadStyle(href) {
    if (loadedStyles.has(href)) {
        return loadedStyles.get(href);
    }

    const promise = new Promise((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.moduleStyle = href;
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener(
            "error",
            () => reject(new Error(`样式加载失败：${href}`)),
            { once: true }
        );
        document.head.append(link);
    });

    loadedStyles.set(href, promise);
    return promise;
}

export async function loadHtml(htmlPath) {
    const response = await fetch(htmlPath, {
        headers: {
            Accept: "text/html"
        }
    });

    if (!response.ok) {
        throw new Error(`页面加载失败：HTTP ${response.status}`);
    }

    return response.text();
}
