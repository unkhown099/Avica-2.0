import React from "react";
import StaffLayout from "./StaffLayout";
import AccountSettings from "../shared/AccountSettings";

function StaffSettings() {
    return (
        <AccountSettings
            LayoutComponent={StaffLayout}
            role="staff"
        />
    );
}

export default StaffSettings;
