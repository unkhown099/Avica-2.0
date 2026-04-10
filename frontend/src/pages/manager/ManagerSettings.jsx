import React from "react";
import ManagerLayout from "./ManagerLayout";
import AccountSettings from "../shared/AccountSettings";

function ManagerSettings() {
    return (
        <AccountSettings
            LayoutComponent={ManagerLayout}
            role="branch_manager"
        />
    );
}

export default ManagerSettings;
