export function showStatus(element, message, type = "info") {
    if (!(element instanceof HTMLElement)) {
        return;
    }

    element.textContent = message;
    element.dataset.type = type;
}

export function setBusy(button, busy) {
    if (button instanceof HTMLButtonElement) {
        button.disabled = busy;
    }
}
