import { ethers, AbiCoder, keccak256 } from "ethers";
import { eq } from "drizzle-orm";

import { getContract } from "../../lib/contract";
import { db } from "../../lib/db";
import { traceEvents } from "../../lib/db/schema";
import InvariantError from "../../common/exceptions/InvariantError";
import NotFoundError from "../../common/exceptions/NotFoundError";
import AuthorizationError from "../../common/exceptions/AuthorizationError";
import { SubmitTraceEventDTO } from "../../common/dto";

class TraceEthService {
    async verifySignature(
        traceEventId: string,
        dataHash: string,
        data: SubmitTraceEventDTO
    ) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.id, traceEventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }

        const abiCoder = AbiCoder.defaultAbiCoder();

        const messageHash = keccak256(
            abiCoder.encode(
                ["uint256", "uint256", "address", "bytes32"],
                [
                    traceEvent.id, 
                    traceEvent.traceProductId, 
                    traceEvent.actorBlockchainAddress, 
                    dataHash
                ]
            )
        );

        const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), data.signature);

        if (recoveredAddress !== traceEvent.actorBlockchainAddress) {
            throw new AuthorizationError("Invalid signature");
        }
    }

    async addTraceEventToBlockchain(
        traceEventId: string,
        dataHash: string,
        data: SubmitTraceEventDTO
    ) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.id, traceEventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }

        if (traceEvent.validationStatus !== "PENDING") {
            throw new InvariantError("Trace event has already been recorded")
        }

        const contract = getContract();

        let tx
        try {
            tx = await contract.addTraceEvent(traceEventId, traceEvent.traceProductId, traceEvent.actorBlockchainAddress, dataHash, data.signature);
            tx.wait();
        } catch (error: any) {
            throw new InvariantError(`Blockchain transaction failed: ${error.reason}`);
        }

        return tx.hash;
    }

    async getTraceEventById(traceEventId: string) {
        const traceEventDb = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.id, traceEventId)
        });
        if (!traceEventDb) {
            throw new NotFoundError("Trace event not found");
        }

        const contract = getContract();

        let traceEventEth
        try {
            traceEventEth = await contract.getProductEvent(traceEventId);
        } catch (error: any) {
            throw new InvariantError(`Blockchain transaction failed: ${error.reason}`);
        }

        return traceEventEth;
    }
}

export default TraceEthService;