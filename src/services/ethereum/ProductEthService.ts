import { getContract } from "../../lib/contract";
import InvariantError from "../../common/exceptions/InvariantError";
import { ethers, solidityPackedKeccak256, AbiCoder, keccak256 } from "ethers";
import AuthorizationError from "../../common/exceptions/AuthorizationError";
import { db } from "../../lib/db";
import { eq } from "drizzle-orm";
import { traceEvents } from "../../lib/db/schema";
import NotFoundError from "../../common/exceptions/NotFoundError";

class ProductEthService {
    async verifySignature(
        eventId: number,
        signature: string
    ) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.eventId, eventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }

        const timestamp =
            typeof traceEvent.timestamp === "string"
                ? traceEvent.timestamp
                : traceEvent.timestamp.toISOString();
        const dataHash = solidityPackedKeccak256(
            ["uint256", "uint256", "address", "string", "string", "string"],
            [
                traceEvent.eventId,
                traceEvent.productId,
                traceEvent.actorBlockchainAddress,
                traceEvent.gln,
                traceEvent.supplychainStep,
                timestamp
            ]
        );

        const abiCoder = AbiCoder.defaultAbiCoder();

        const messageHash = keccak256(
            abiCoder.encode(
                ["uint256", "uint256", "address", "bytes32"],
                [
                    traceEvent.eventId, 
                    traceEvent.productId, 
                    traceEvent.actorBlockchainAddress, 
                    dataHash
                ]
            )
        );

        const recoverAddress = ethers.verifyMessage(ethers.getBytes(messageHash), signature);

        if (recoverAddress.toLowerCase() !== traceEvent.actorBlockchainAddress.toLowerCase()) {
            throw new AuthorizationError("Invalid signature");
        }

        return dataHash;
    }

    async addTraceEvent(
        eventId: number,
        dataHash: string,
        signature: string
    ) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.eventId, eventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not foun");
        }

        const contract = getContract();

        let tx
        try {
            tx = await contract.addTraceEvent(eventId, traceEvent.productId, traceEvent.actorBlockchainAddress, dataHash, signature);
            tx.wait();
        } catch (error: any) {
            throw new InvariantError(`Blockchain transaction failed: ${error.reason}`);
        }

        return tx.hash;
    }
}

export default ProductEthService;