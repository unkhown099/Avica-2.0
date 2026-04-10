import React from "react";
import SuperAdminLayout from "./SuperAdminLayout";
import AccountSettings from "../shared/AccountSettings";

function SuperAdminSettings() {
    return (
        <AccountSettings
            LayoutComponent={SuperAdminLayout}
            role="super_admin"
        />
    );
}

export default SuperAdminSettings;
