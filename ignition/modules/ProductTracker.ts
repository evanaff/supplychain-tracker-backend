import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const productTrackerModule = buildModule("ProductTrackerModule", (m) => {
    const productTracker = m.contract("ProductTracker");

    return { productTracker };
});

export default productTrackerModule;