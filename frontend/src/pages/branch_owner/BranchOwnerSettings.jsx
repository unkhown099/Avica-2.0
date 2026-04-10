import React from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";
import AccountSettings from "../shared/AccountSettings";

function BranchOwnerSettings() {
    return (
        <AccountSettings
            LayoutComponent={BranchOwnerLayout}
            role="business_owner"
        />
    );
}

export default BranchOwnerSettings;
