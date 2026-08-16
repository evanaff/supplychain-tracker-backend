import { ethers } from "ethers";
import config from "../../common/config";
import SupplyChainTrackerArtifact from "../../../artifacts/contracts/SupplyChainTracker.sol/SupplyChainTracker.json";

const provider = new ethers.JsonRpcProvider(config.rpc.url);
const wallet = new ethers.Wallet(config.contract.adminPrivateKey, provider);

export const contract = new ethers.Contract(
    config.contract.address,
    SupplyChainTrackerArtifact.abi,
    wallet
);