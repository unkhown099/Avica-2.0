import React from "react";
import InventoryLayout from "./InventoryLayout";
import AccountSettings from "../shared/AccountSettings";

function InventorySettings() {
    return (
        <AccountSettings
            LayoutComponent={InventoryLayout}
            role="inventory"
        />
    );
}

export default InventorySettings;
