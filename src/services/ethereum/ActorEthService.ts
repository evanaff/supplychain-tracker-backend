import { isAddress } from "ethers";

import InvariantError from "../../common/exceptions/InvariantError";
import { getContract } from "../../lib/contract";
import { RoleMap } from "../../common/utils";

class ActorEthService {
    async AddActor(
        address: string,
        gln: string,
        role: string,
    ) {
        if (!isAddress(address)){
            throw new InvariantError("Invalid ethereum address");
        }

        const contract = getContract();

        try {
            let tx
            tx = await contract.addActor(address, gln, RoleMap[role]);
        } catch (error: any) {
            throw new InvariantError(`Blockchain transaction failed: ${error.reason}`);
        }
    }

    async deleteActor(address: string) {
        if (!isAddress(address)){
            throw new InvariantError("Invalid ethereum address");
        }

        const contract = getContract();

        try {
            let tx
            tx = await contract.deleteActor(address);
        } catch (error: any) {
            throw new InvariantError(`Blockchain transaction failed: ${error.reason}`);
        }
    }
}

export default ActorEthService;