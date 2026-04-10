import React from "react";
import AdminLayout from "./AdminLayout";
import AccountSettings from "../shared/AccountSettings";

function AdminSettings() {
    return (
        <AccountSettings
            LayoutComponent={AdminLayout}
            role="admin"
        />
    );
}

export default AdminSettings;
