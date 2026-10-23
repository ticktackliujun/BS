import { setBusy, showStatus } from "../../js/utils/helper.js";
import { getPartQuantity, savePartQuantity } from "./warehouseService.js";

export async function mount(container) {
    const form = container.querySelector("#warehouseQuantityForm");
    const quantityInput = container.querySelector("#warehouseQuantity");
    const saveButton = container.querySelector("#warehouseSaveButton");
    const savedQuantity = container.querySelector("#warehouseSavedQuantity");
    const status = container.querySelector("#warehouseStatus");
    const requestController = new AbortController();

    async function loadQuantity() {
        setBusy(saveButton, true);
        showStatus(status, "正在读取保存数量...", "loading");

        try {
            const data = await getPartQuantity(requestController.signal);
            quantityInput.value = data.quantity;
            savedQuantity.textContent = data.quantity;
            showStatus(status, "已读取上次保存的数量。", "success");
        } catch (error) {
            if (!requestController.signal.aborted) {
                showStatus(status, `读取失败：${error.message}`, "error");
            }
        } finally {
            if (!requestController.signal.aborted) {
                setBusy(saveButton, false);
                quantityInput.focus();
                quantityInput.select();
            }
        }
    }

    async function saveQuantity(event) {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const quantity = Number(quantityInput.value);

        if (!Number.isInteger(quantity) || quantity < 0) {
            showStatus(status, "数量必须是大于或等于 0 的整数。", "error");
            return;
        }

        setBusy(saveButton, true);
        showStatus(status, "正在保存...", "loading");

        try {
            const data = await savePartQuantity(
                quantity,
                requestController.signal
            );

            quantityInput.value = data.quantity;
            savedQuantity.textContent = data.quantity;
            showStatus(
                status,
                `保存成功，后端保存的数量是 ${data.quantity}。`,
                "success"
            );
        } catch (error) {
            if (!requestController.signal.aborted) {
                showStatus(status, `保存失败：${error.message}`, "error");
            }
        } finally {
            if (!requestController.signal.aborted) {
                setBusy(saveButton, false);
                quantityInput.focus();
            }
        }
    }

    form.addEventListener("submit", saveQuantity);
    await loadQuantity();

    return () => {
        requestController.abort();
        form.removeEventListener("submit", saveQuantity);
    };
}
