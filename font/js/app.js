import { startRouter } from "./router.js";

const content = document.querySelector("#app-content");

startRouter(content).catch((error) => {
    content.replaceChildren();

    const message = document.createElement("p");
    message.className = "module-error";
    message.textContent = `应用启动失败：${error.message}`;
    content.append(message);
});
