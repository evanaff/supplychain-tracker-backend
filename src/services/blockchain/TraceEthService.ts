import { ethers } from "ethers";
import { eq } from "drizzle-orm";

import { contract } from "../../lib/contract";
import { db } from "../../lib/db";
import { traceEvents } from "../../lib/db/schema";
import InvariantError from "../../common/exceptions/InvariantError";
import NotFoundError from "../../common/exceptions/NotFoundError";
import AuthorizationError from "../../common/exceptions/AuthorizationError";
import { SubmitTraceEventDTO } from "../../types/dataTransferObject";

class TraceEthService {
    async verifySignature(
        traceEventId: string,
        messageHash: string,
        data: SubmitTraceEventDTO
    ) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.id, traceEventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }

        const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), data.signature);

        if (recoveredAddress.toLowerCase() !== traceEvent.actorBlockchainAddress.toLowerCase()) {
            throw new AuthorizationError("Invalid signature");
        }
    }

    // async addTraceEventToBlockchain(
    //     traceEventId: string,
    //     dataHash: string,
    //     data: SubmitTraceEventDTO
    // ) {
    //     const traceEvent = await db.query.traceEvents.findFirst({
    //         where: eq(traceEvents.id, traceEventId)
    //     });
    //     if (!traceEvent) {
    //         throw new NotFoundError("Trace event not found");
    //     }

    //     if (traceEvent.isRecorded) {
    //         throw new InvariantError("Trace event has already been recorded")
    //     }

    //     let tx
    //     try {
    //         tx = await contract.addTraceEvent(traceEventId, dataHash, data.signature);
    //         tx.wait();
    //     } catch (error: any) {
    //         throw new InvariantError(`Blockchain transaction failed: ${error.reason}`);
    //     }

    //     return tx.hash;
    // }

    async getTraceEventById(traceEventId: string) {
        const traceEventDb = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.id, traceEventId)
        });
        if (!traceEventDb) {
            throw new NotFoundError("Trace event not found");
        }

        let traceEventEth
        try {
            traceEventEth = await contract.getProductEvent(traceEventId);
        } catch (error: any) {
            throw new InvariantError(`Blockchain transaction failed: ${error.reason}`);
        }

        console.log(traceEventEth);

        return traceEventEth;
    }
}

export default TraceEthService;