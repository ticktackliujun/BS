import { requestJson } from "../../js/api.js";
import { partQuantityPath } from "./warehouseApi.js";

export function getPartQuantity(signal) {
    return requestJson(partQuantityPath, { signal });
}

export function savePartQuantity(quantity, signal) {
    return requestJson(partQuantityPath, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ quantity }),
        signal
    });
}
