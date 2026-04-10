import React from "react";
import EmployeeLayout from "./EmployeeLayout";
import AccountSettings from "../shared/AccountSettings";

function EmployeeSettings() {
    return (
        <AccountSettings
            LayoutComponent={EmployeeLayout}
            role="employee"
        />
    );
}

export default EmployeeSettings;
