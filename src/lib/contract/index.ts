import config from "../../common/config";
import { ethers } from "ethers";
import ProductTrackerArtifact from "../../../artifacts/contracts/ProductTracker.sol/ProductTracker.json";

const provider = new ethers.JsonRpcProvider(config.rpc.provider);
const wallet = new ethers.Wallet(config.contract.privateKey, provider);

export const getContract = () => {
    return new ethers.Contract(
        config.contract.address,
        ProductTrackerArtifact.abi,
        wallet
    );
}