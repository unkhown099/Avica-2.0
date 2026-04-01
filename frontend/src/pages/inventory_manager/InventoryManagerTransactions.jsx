import InventoryManagerLayout from "./InventoryManagerLayout.jsx";
import MovementLog from "../inventory/InventoryMovementLog.jsx";

function InventoryManagerTransactions() {
  return (
    <MovementLog
      LayoutComponent={InventoryManagerLayout}
      pageTitle="Transaction History"
      subtitle="Track all inventory changes, transfers, and usage patterns."
    />
  );
}

export default InventoryManagerTransactions;
