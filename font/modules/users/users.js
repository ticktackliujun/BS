import {
    setBusy,
    showStatus
} from "../../js/utils/helper.js?v=20261024-4";
import {
    createUser,
    getUsers,
    updateUser
} from "./usersService.js?v=20261024-4";

const pageSize = 20;
const maxPageItems = 7;

function buildPageItems(page, totalPages) {
    if (totalPages <= maxPageItems) {
        return Array.from(
            { length: totalPages },
            (_, index) => index + 1
        );
    }

    if (page <= 4) {
        return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }

    if (page >= totalPages - 3) {
        return [
            1,
            "ellipsis",
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages
        ];
    }

    return [
        1,
        "ellipsis",
        page - 1,
        page,
        page + 1,
        "ellipsis",
        totalPages
    ];
}

export async function mount(container) {
    const addButton = container.querySelector("#addUserButton");
    const tableBody = container.querySelector("#usersTableBody");
    const emptyState = container.querySelector("#usersEmpty");
    const pageStatus = container.querySelector("#usersStatus");
    const pagination = container.querySelector("#usersPagination");
    const previousButton =
        container.querySelector("#usersPreviousPage");
    const nextButton = container.querySelector("#usersNextPage");
    const pageNumbers =
        container.querySelector("#usersPageNumbers");
    const pageSummary =
        container.querySelector("#usersPageSummary");
    const pageInput = container.querySelector("#usersPageInput");
    const jumpButton = container.querySelector("#usersJumpPage");
    const dialog = container.querySelector("#userDialog");
    const dialogTitle = container.querySelector("#userDialogTitle");
    const form = container.querySelector("#userForm");
    const usernameInput = container.querySelector("#userUsername");
    const passwordInput = container.querySelector("#userPassword");
    const passwordHint = container.querySelector("#userPasswordHint");
    const realNameInput = container.querySelector("#userRealName");
    const roleSelect = container.querySelector("#userRole");
    const dialogStatus = container.querySelector("#userDialogStatus");
    const closeButton = container.querySelector("#closeUserDialogButton");
    const cancelButton = container.querySelector("#cancelUserButton");
    const saveButton = container.querySelector("#saveUserButton");
    const requestController = new AbortController();

    let users = [];
    let roles = [];
    let editingUser = null;
    let paginationState = {
        page: 1,
        pageSize,
        totalCount: 0,
        totalPages: 0
    };
    let loadSequence = 0;

    function createCell(text) {
        const cell = document.createElement("td");
        cell.textContent = text;
        return cell;
    }

    function renderUsers() {
        tableBody.replaceChildren();
        emptyState.hidden = users.length > 0;

        for (const user of users) {
            const row = document.createElement("tr");
            row.append(createCell(user.username));
            row.append(createCell(user.realName));

            const roleCell = document.createElement("td");
            const roleBadge = document.createElement("span");
            roleBadge.className = "user-role-badge";
            roleBadge.textContent = user.roleName;
            roleCell.append(roleBadge);
            row.append(roleCell);

            const actionCell = document.createElement("td");
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "user-edit-button";
            editButton.textContent = "编辑";
            editButton.addEventListener("click", () => openDialog(user));
            actionCell.append(editButton);
            row.append(actionCell);

            tableBody.append(row);
        }
    }

    function renderRoles() {
        roleSelect.replaceChildren();

        for (const role of roles) {
            const option = document.createElement("option");
            option.value = String(role.id);
            option.textContent = role.name;
            roleSelect.append(option);
        }
    }

    function renderPagination() {
        const { page, totalCount, totalPages } = paginationState;
        pageNumbers.replaceChildren();

        for (const item of buildPageItems(page, totalPages)) {
            if (item === "ellipsis") {
                const ellipsis = document.createElement("span");
                ellipsis.className = "users-page-ellipsis";
                ellipsis.textContent = "...";
                pageNumbers.append(ellipsis);
                continue;
            }

            const button = document.createElement("button");
            button.type = "button";
            button.className = "users-page-number";
            button.textContent = String(item);
            button.disabled = item === page;

            if (item === page) {
                button.setAttribute("aria-current", "page");
            }

            button.addEventListener("click", () => {
                void load(item);
            });
            pageNumbers.append(button);
        }

        previousButton.disabled = page <= 1;
        nextButton.disabled = totalPages === 0 || page >= totalPages;
        pageInput.max = String(Math.max(1, totalPages));
        pageInput.value = String(page);
        pageSummary.textContent = totalCount === 0
            ? "共 0 条"
            : `共 ${totalCount} 条 · 第 ${page}/${totalPages} 页`;
        pagination.hidden = totalCount === 0;
    }

    async function load(page = 1) {
        const currentSequence = ++loadSequence;
        showStatus(pageStatus, "正在读取用户...", "loading");

        try {
            const data = await getUsers(
                page,
                pageSize,
                requestController.signal
            );

            if (currentSequence !== loadSequence) {
                return;
            }

            users = data.users;
            roles = data.roles;
            paginationState = {
                page: data.page,
                pageSize: data.pageSize,
                totalCount: data.totalCount,
                totalPages: data.totalPages
            };

            renderUsers();
            renderRoles();
            renderPagination();
            showStatus(
                pageStatus,
                `共 ${data.totalCount} 个用户，本页 ${data.users.length} 个。`,
                "success"
            );
        } catch (error) {
            if (
                currentSequence === loadSequence &&
                !requestController.signal.aborted
            ) {
                showStatus(pageStatus, `读取失败：${error.message}`, "error");
            }
        }
    }

    function jumpToPage() {
        const target = Number(pageInput.value);
        const maxPage = Math.max(1, paginationState.totalPages);

        if (
            !Number.isInteger(target) ||
            target < 1 ||
            target > maxPage
        ) {
            showStatus(
                pageStatus,
                `请输入 1 到 ${maxPage} 之间的页码。`,
                "error"
            );
            pageInput.focus();
            return;
        }

        void load(target);
    }

    function openDialog(user = null) {
        editingUser = user;
        form.reset();
        dialogTitle.textContent = user ? "编辑用户" : "新增用户";
        usernameInput.value = user?.username ?? "";
        usernameInput.disabled = Boolean(user);
        realNameInput.value = user?.realName ?? "";
        passwordInput.required = !user;
        passwordHint.textContent = user
            ? "留空表示保持原密码"
            : "请输入初始密码";
        showStatus(dialogStatus, "", "info");

        const roleId = user?.roleId ?? roles[0]?.id;
        roleSelect.value = roleId ? String(roleId) : "";

        dialog.showModal();
        (user ? realNameInput : usernameInput).focus();
    }

    function closeDialog() {
        editingUser = null;
        dialog.close();
    }

    async function saveUser(event) {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const password = passwordInput.value;
        const realName = realNameInput.value.trim();
        const roleId = Number(roleSelect.value);

        setBusy(saveButton, true);
        showStatus(dialogStatus, "正在保存...", "loading");

        try {
            const wasEditing = Boolean(editingUser);

            if (editingUser) {
                await updateUser(
                    editingUser.id,
                    {
                        password: password || null,
                        realName,
                        roleId
                    },
                    requestController.signal
                );
            } else {
                await createUser(
                    {
                        username: usernameInput.value.trim(),
                        password,
                        realName,
                        roleId
                    },
                    requestController.signal
                );
            }

            closeDialog();
            await load(paginationState.page);
            showStatus(
                pageStatus,
                wasEditing ? "用户已更新。" : "用户已新增。",
                "success"
            );
        } catch (error) {
            if (!requestController.signal.aborted) {
                showStatus(
                    dialogStatus,
                    `保存失败：${error.message}`,
                    "error"
                );
            }
        } finally {
            if (!requestController.signal.aborted) {
                setBusy(saveButton, false);
            }
        }
    }

    const handleAddButton = () => openDialog();
    const handlePreviousPage = () => {
        void load(Math.max(1, paginationState.page - 1));
    };
    const handleNextPage = () => {
        void load(
            Math.min(
                paginationState.totalPages,
                paginationState.page + 1
            )
        );
    };

    addButton.addEventListener("click", handleAddButton);
    previousButton.addEventListener("click", handlePreviousPage);
    nextButton.addEventListener("click", handleNextPage);
    jumpButton.addEventListener("click", jumpToPage);
    pageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            jumpToPage();
        }
    });
    closeButton.addEventListener("click", closeDialog);
    cancelButton.addEventListener("click", closeDialog);
    form.addEventListener("submit", saveUser);

    await load(1);

    return () => {
        requestController.abort();
        addButton.removeEventListener("click", handleAddButton);
        previousButton.removeEventListener("click", handlePreviousPage);
        nextButton.removeEventListener("click", handleNextPage);
        jumpButton.removeEventListener("click", jumpToPage);
        closeButton.removeEventListener("click", closeDialog);
        cancelButton.removeEventListener("click", closeDialog);
        form.removeEventListener("submit", saveUser);

        if (dialog.open) {
            dialog.close();
        }
    };
}
