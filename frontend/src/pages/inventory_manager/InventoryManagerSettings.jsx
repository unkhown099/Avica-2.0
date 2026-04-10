import React from "react";
import InventoryManagerLayout from "./InventoryManagerLayout";
import AccountSettings from "../shared/AccountSettings";

function InventoryManagerSettings() {
    return (
        <AccountSettings
            LayoutComponent={InventoryManagerLayout}
            role="inventory_manager"
        />
    );
}

export default InventoryManagerSettings;
