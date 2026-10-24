export const modules = {
    warehouse: {
        title: "零部件管理",
        html: "/modules/warehouse/index.html",
        script: "/modules/warehouse/warehouse.js",
        style: "/css/modules/warehouse/index.css"
    },
    users: {
        title: "用户管理",
        html: "/modules/users/index.html",
        script: "/modules/users/users.js",
        style: "/css/modules/users/index.css",
        version: "20261024-4",
        adminOnly: true
    }
};

export const defaultModuleName = "warehouse";
