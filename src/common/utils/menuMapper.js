
export const buildMenuTree = (menuData = []) => {
    if (!Array.isArray(menuData) || menuData.length === 0) {
        return [];
    }

    // Map the new ScreenAccess API response.
    const mappedMenus = menuData.map((item) => ({
        id: Number(item.ScreenID),
        parentId: Number(item.RDHR0000ID),
        subMenuId: Number(item.ScreenSubID),
        label: item.ScreenTitle || "",
        path: item.ScreenName || "",
        sequence: Number(item.ScreenSequence) || 0,
        icon: item.Icon || "",
        isSideMenu: item.IsSideMenu === true,
        formType: item.FormType || "",
        screenType: item.ScreenType || "",
        projectName: item.ProjectName || "",
        isApp: item.IsApp === true,
        children: [],
    }));

    const menuMap = new Map();

    mappedMenus.forEach((item) => {
        menuMap.set(Number(item.id), item);
    });

    const rootMenus = [];

    mappedMenus.forEach((item) => {
        const parent = menuMap.get(Number(item.parentId));

        if (parent && parent.id !== item.id) {
            parent.children.push(item);
        } else {
            // Parent is not included in the API response.
            // Display the item as a root menu.
            rootMenus.push(item);
        }
    });

    const sortMenus = (items) => {
        items.sort((a, b) => a.sequence - b.sequence);

        items.forEach((item) => {
            sortMenus(item.children);
        });
    };

    sortMenus(rootMenus);

    return rootMenus;
};
