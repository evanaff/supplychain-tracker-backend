import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const supplyChainTrackerModule = buildModule("supplyChainTrackerModule", (m) => {
    const supplyChainTracker = m.contract("SupplyChainTracker");

    return { supplyChainTracker };
});

export default supplyChainTrackerModule;