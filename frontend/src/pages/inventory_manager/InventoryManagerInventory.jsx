import React from "react";
import AdminInventory from "../admin/AdminInventory.jsx";
import InventoryManagerLayout from "./InventoryManagerLayout.jsx";

function InventoryManagerInventory() {
  return (
    <AdminInventory
      LayoutComponent={InventoryManagerLayout}
      title="Inventory Manager"
      subtitle="Manage inventory operations and stock movement"
      showTransactionsTab={false}
    />
  );
}

export default InventoryManagerInventory;
