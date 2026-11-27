import coreSettingsClient from "../../../api/axiosClientModule";

export const createShiftGroup = async (payload) => {
    return await coreSettingsClient.post(
        "/settings/ShiftGroup/CreateShiftGroup",
        payload,
        {module:"attendance"}
    );
};

