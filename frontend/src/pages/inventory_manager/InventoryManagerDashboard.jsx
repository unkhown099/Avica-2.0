import React from "react";
import InventoryDashboard from "../inventory/InventoryDashboard.jsx";
import InventoryManagerLayout from "./InventoryManagerLayout.jsx";

export default function InventoryManagerDashboard() {
  return (
    <InventoryDashboard
      LayoutComponent={InventoryManagerLayout}
      title="Inventory Manager Dashboard"
    />
  );
}
