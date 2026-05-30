import { ethers } from "ethers";
import config from "../../common/config";
import ProductTrackerArtifact from "../../../artifacts/contracts/ProductTracker.sol/ProductTracker.json";

export const getContract = () => {
    const provider = new ethers.JsonRpcProvider(config.rpc.provider);
    const wallet = new ethers.Wallet(config.contract.privateKey, provider);

    return new ethers.Contract(
        config.contract.address,
        ProductTrackerArtifact.abi,
        wallet
    );
}