import { ethers } from "ethers";
import config from "../../common/config";
import ProductTrackerArtifact from "../../../artifacts/contracts/ProductTracker.sol/ProductTracker.json";

const provider = new ethers.JsonRpcProvider(config.rpc.provider);
const wallet = new ethers.Wallet(config.contract.privateKey, provider);

export const contract = new ethers.Contract(
    config.contract.address,
    ProductTrackerArtifact.abi,
    wallet
);